# Hands-On Lab · Authentication System ShopEase

CodeIgniter 4, MySQL/MariaDB, dan Bootstrap 5. Tujuannya adalah membuat akun customer, menyimpan hash password, mengelola session, membatasi akses berdasarkan role, dan mengakhiri session melalui logout. Landing page mempertahankan modal Masuk dan Daftar Akun. Rute form PHP yang dipakai pada worksheet juga dapat diuji langsung.

## 1. Membuat database dan tabel pengguna

Gunakan instance MariaDB yang sudah menampilkan `ready for connections`. Impor `database/db_shopease.sql` **dari paket ini** ke database baru. Skrip membuat `db_shopease`, tabel, dan data demo. Jika `db_shopease` pada instance yang dipilih sudah berisi tabel proyek lama, gunakan nama database baru pada dua baris awal SQL dan pada `.env`. Impor ini tidak mengonversi struktur atau memindahkan data lama. Jangan mencampur SQL dari ZIP lama dengan paket ini.

```sql
CREATE DATABASE IF NOT EXISTS db_shopease;
USE db_shopease;
CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin', 'operator') NOT NULL DEFAULT 'customer',
    phone VARCHAR(20),
    address TEXT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL
);
```

Potongan tersebut menjelaskan tabel akun. Gunakan berkas SQL lengkap agar katalog dan seluruh relasi toko ikut dibuat. Registrasi publik menetapkan role customer. Password disimpan dalam bentuk hash.

## 2. Mengatur koneksi

Edit `.env` di samping `spark`. Contoh untuk instance terpisah yang sebelumnya disiapkan pada port 3307.

```ini
CI_ENVIRONMENT = development
app.baseURL = 'http://localhost:8080/'
app.indexPage = ''
database.default.hostname = 127.0.0.1
database.default.database = db_shopease
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi
database.default.port = 3307
```

Gunakan `3306` jika server yang aktif memakai port tersebut. Isi password jika akun root memilikinya. Untuk mengimpor ke port 3307 dari CMD di folder yang berisi `spark`, jalankan perintah berikut. Tambahkan `-p` untuk meminta password bila diperlukan.

```bat
"C:\xampp_new\mysql\bin\mysql.exe" -h 127.0.0.1 -P 3307 -u root < "database\db_shopease.sql"
```

## 3–9. Menerapkan autentikasi

| Tahap | File dan tindakan |
| --- | --- |
| 3. UserModel | `app/Models/UserModel.php` memakai `users.id_user`, auto increment, daftar kolom yang diizinkan, dan timestamp. |
| 4. AuthController | `register()` dan `login()` menampilkan form. `store()` mendaftarkan akun lalu mengarahkan ke login. `authenticate()` login dan mengarahkan berdasarkan role. `logout()` mengakhiri session lalu kembali ke login. Modal toko memakai endpoint JSON dan logika yang sama pada `ShopService::auth()`. |
| 5. Routes | GET `/register`, POST `/register`, GET `/login`, POST `/login`, POST `/logout`. Rute dashboard memakai filter role. |
| 6. Registrasi | `frontend/ShopEase.tsx` pada shell toko menampilkan nama, email, telepon dan alamat opsional, password, serta konfirmasi password. |
| 7. Login | Halaman autentikasi khusus pada shell toko menampilkan email dan password. Pesan berhasil registrasi muncul setelah pengalihan. |
| 8. Helper | `BaseController.php` memuat `url` dan `form`. Form autentikasi mengirim token CSRF pada header. Rute POST form PHP tetap tersedia untuk praktikum. |
| 9. AuthFilter | Alias `auth` terdaftar di `app/Config/Filters.php`. Akses web tanpa sesi menuju login. API toko mengembalikan HTTP 401 tanpa sesi dan 403 untuk role yang tidak berizin. |

Registrasi memvalidasi data dan kecocokan password, memanggil `password_hash()`, lalu menyimpan akun via UserModel. Login memakai `password_verify()`, meregenerasi ID session, lalu menyimpan `isLoggedIn`, `user_id`, `name`, `email`, dan `role`. Customer menuju beranda. Admin menuju `/admin` dan operator menuju `/operator`. Keduanya dapat membuka Pusat Pengelolaan dari menu dashboard. Semua akun bisa membuka `/profil`. Login dibatasi berdasarkan email dan IP. Logout menghapus identitas, mengganti ID sesi, dan menghapus cookie Ingat saya. Lihat [Keamanan autentikasi](SECURITY_AUTH.md) untuk mengaktifkan Ingat saya dan menguji batas percobaan.

## 10–11. Struktur dan cara menjalankan

Buka folder paket yang berisi `spark`. Kode aplikasi ada di `app/`, antarmuka dan foto di `public/`, dependensi PHP di `vendor/`, dan log di `writable/logs/`.

```bat
"C:\xampp_new\php\php.exe" spark serve
```

`run.cmd` menjalankan perintah yang sama. Akses [beranda](http://localhost:8080/), [form registrasi](http://localhost:8080/register), dan [form login](http://localhost:8080/login). Untuk melihat daftar rute, ganti `serve` dengan `routes`.

## 12. Skenario pengujian

| Percobaan | Hasil yang diharapkan |
| --- | --- |
| Registrasi data valid | Akun customer dibuat, diarahkan ke login. |
| Registrasi email duplikat | Ditolak. |
| Password kurang dari 8 karakter | Ditolak. |
| Konfirmasi password berbeda | Ditolak. |
| Login benar | Masuk dan diarahkan sesuai role. |
| Login salah | Pesan email atau password salah. |
| Klik Keluar dari menu akun | Session berakhir. |
| Buka `/admin` atau `/operator` tanpa login | Diarahkan ke `/login`. |
| Buka dashboard role lain | Diarahkan ke beranda. |
| Checkout dengan akun customer | Pesanan, alamat, pembayaran, dan keranjang terhubung ke `users.id_user`. |

## 13. Membuat akun uji admin dan operator

Daftarkan akun melalui form, lalu jalankan SQL berikut pada database proyek lokal. Keluar dan masuk kembali untuk menguji pengalihan.

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@shopease.com';
UPDATE users SET role = 'operator' WHERE email = 'operator@shopease.com';
```

## 14–15. Checklist dan pengembangan

- [ ] Database dan tabel `users` terbentuk dengan kolom yang sesuai.
- [ ] Form registrasi dan login serta lima rute autentikasi berfungsi.
- [ ] Password berupa hash dan telepon serta alamat opsional tersimpan.
- [ ] Session terbentuk setelah login dan berakhir saat logout.
- [ ] Dashboard mematuhi batas role dan pesanan memakai ID akun yang tepat.

Urutan pengembangan setelah autentikasi adalah dashboard customer, pengelolaan kategori dan produk, keranjang, checkout dan pembayaran, serta operasional pesanan. Modul toko tetap menggunakan antarmuka dan alur dari proyek ShopEase yang digabungkan.


## Pengujian tambahan worksheet

- Dari `/register`, coba kirim nama pendek, nomor HP salah, dan konfirmasi yang berbeda. Pastikan pesan tampil di bawah kolom yang terkait dan kolom password kembali kosong.
- Daftar dengan data valid, lalu periksa email yang terisi di `/login`. Customer menuju beranda, admin ke `/admin`, dan operator ke `/operator`. Lihat informasi akun di `/profil`.
- Gunakan akun customer untuk membuka `/admin`. Pastikan kembali ke beranda dengan pesan penolakan. Uji navigasi dan panel akun pada layar kecil.
- Uji POST logout melalui tombol dan cek halaman yang tidak terdaftar untuk melihat respons 404 bermerek.
- Jalankan `spark key:generate` jika belum punya kunci, lalu uji Ingat saya sebagai customer. Admin dan operator memakai password untuk masuk. Lihat [Keamanan autentikasi](SECURITY_AUTH.md).

## Sinkronisasi akses halaman dan toko

Halaman PHP dan API menggunakan session CodeIgniter serta pemeriksaan role yang sama. Katalog tetap dapat dilihat oleh tamu. Keranjang, alamat, dan checkout memerlukan role customer. Pusat Pengelolaan menerima admin dan operator. Perubahan produk atau kategori memerlukan admin. Riwayat pesanan customer dibatasi ke akun yang sedang login.

Uji logout di satu tab dengan ShopEase terbuka di tab kedua. Tab toko memeriksa ulang sesi ketika menerima perubahan login dari tab lain atau ketika tab kembali aktif. Jika sesi berakhir, data akun, pesanan, dan keranjang pada antarmuka dikosongkan setelah sinkronisasi. Uji juga membuka langsung `/cart`, `/checkout`, `/orders`, `/seller`, `/admin`, dan `/operator` sebagai tamu dan pengguna yang memiliki role berbeda.

Paket menggunakan MariaDB di `127.0.0.1:3307`. Jika database Hands-On yang aktif bernama `db_shopease_handson`, pertahankan nama tersebut di file `.env`. Untuk memperbarui instalasi yang sudah bekerja, salin `.env` lama agar kredensial dan kunci aplikasi tetap sama.

Beranda, katalog, autentikasi, profil, dan dashboard menggunakan shell yang sama dengan font Inter. Rute langsung tetap dilindungi oleh filter CodeIgniter. Akun uji tercantum di README.
