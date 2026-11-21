# ShopEase — versi terbaru, 19 November 2026

Paket dasar yang dikembangkan: **ShopEase_Blue_Menu_Admin_Lengkap.zip**, paket terakhir yang ditemukan dari pekerjaan sebelumnya. Bila source lokal memiliki perubahan sesudah paket tersebut, bandingkan dan gabungkan file sebelum mengganti instalasi.

## Hasil membaca seluruh lampiran

Semua 11 gambar dibuka dan diperiksa. Kedua PDF dibaca seluruh teksnya dan ditinjau hasil render halamannya. Lampiran asli disertakan dalam folder docs. Mockup menjadi acuan warna, komponen dan susunan; tampilan belum diverifikasi identik per piksel.

| Lampiran | Ketentuan yang diambil |
| --- | --- |
| ERD ShopEase Toko Online | users, categories, products, carts, cart_items, orders, order_items, payments, shipments; primary/foreign key dan kardinalitas |
| Roadmap Pengembangan ShopEase dengan CodeIgniter 4 | Routing → MVC → CRUD → Authentication → Cart → Checkout → Orders → Payment → Dashboard |
| Struktur Proyek ShopEase CodeIgniter 4 | Controller Admin, Model, Views auth/admin/products/categories, Filter, uploads/products |
| Panduan Implementasi Autentikasi ShopEase | Tujuh tahap implementasi, database hingga pengujian |
| Infografis Routing CodeIgniter 4 ShopEase | Kelompok Public, Authentication, Customer, Admin, Operator |
| Infografik Alur Routing CodeIgniter 4 | Request, Router, Controller, Model/Database, View |
| Struktur Folder ShopEase dengan CodeIgniter 4 | Pemisahan Config, Controllers, Models, Views, Filters |
| Infografik Struktur Routing ShopEase | Pembagian URL, HTTP method dan akses per role |
| Infografis Modul Aplikasi ShopEase | Customer belanja; Admin kelola toko; Operator operasi/pengiriman |
| Kolase UI_UX ShopEase Toko Online | Ungu/putih, beranda, katalog, detail produk, keranjang, checkout, login/registrasi, riwayat/status pesanan, profil |
| Kolase UI Manajemen Produk ShopEase-2 | Sidebar gelap, tabel produk, form tambah/edit, kategori, gambar, harga, stok, status, aksi |
| Tahapan_Implementasi_Authentication_ShopEase_CI4.docx (1).pdf — 6 halaman | users.id_user; hash password; session regenerate; register/login; logout POST; CSRF; role customer default; AuthFilter; Bootstrap 5; pembatasan login |
| HOL_Product_Management_ShopEase_CI4.docx (1).pdf — 13 halaman | CRUD kategori/produk; multi gambar; validasi; FK; Admin/Operator; pencarian, filter, pagination; gambar utama; inventory; statistik |

## Penyelarasan acuan

PDF Product Management secara eksplisit memberikan akses kategori dan produk kepada Admin **dan Operator**. Ketentuan tersebut digunakan untuk /admin/products dan /admin/categories. Dashboard /admin tetap khusus Admin, /operator khusus Operator. Customer ditolak. Pengelolaan pembayaran dan laporan tetap mengikuti pembagian akses versi dasar.

Skema paket dasar berbeda dari contoh SQL numerik PDF. Migrasi maju mempertahankan ID teks produk dan kategori, menambahkan galeri, serta mengonversi relasi pengguna lama ke `users.id_user` numerik sambil menyimpan ID pengguna lama sebagai referensi:

| Contoh PDF | Penyimpanan proyek ini |
| --- | --- |
| categories.id_category INT | categories.id VARCHAR(40), PK lama |
| products.id_product INT | products.id VARCHAR(40), PK lama |
| products.id_category | products.category_id → categories.id |
| status tersedia / tidak_tersedia | Form memakai dua istilah tersebut; DB memakai active / inactive untuk kompatibilitas checkout |
| product_images.id_image | INT auto increment, tabel baru |
| product_images.id_product | VARCHAR(40) → products.id; ON DELETE CASCADE |
| product_images.image | URL gambar lokal; gambar utama juga disinkronkan ke products.image |

Ini **bukan salinan persis skema numerik PDF/ERD**. ID produk dan kategori tetap berbentuk teks agar keranjang dan pesanan lama tidak terputus. Jangan impor SQL contoh PDF ke tabel lama secara langsung.

## Pembaruan yang sudah ditulis

- Identitas warna publik ungu, putih, lavender; hero mengikuti teks Belanja Mudah & Aman di ShopEase.
- View PHP Bootstrap 5: app/Views/auth/login.php dan register.php. Registrasi publik tidak memiliki pilihan role.
- Password hash/verifikasi, regenerasi session, rate limiting dan AuthFilter dari versi dasar dipertahankan. Session menyertakan id_user dan alias user_id.
- ProductImageModel dan dua migrasi baru: galeri serta phone/address bila kolom tersebut belum ada.
- Halaman MVC kategori/produk dengan layout pengelola, sidebar, tabel dan form responsif. Form tambah/edit memakai template bersama untuk menghindari duplikasi.
- CRUD kategori; kategori berisi produk tidak dapat dihapus.
- CRUD produk: kategori harus ada, nama/deskripsi, harga Rupiah bilangan bulat tidak negatif, stok termasuk nol, status.
- Cari nama; filter kategori; stok rendah 1–5; stok habis; pagination 10 baris.
- Statistik produk, kategori, tersedia, tidak tersedia.
- Galeri maksimal 8 foto per produk; JPEG/PNG/WEBP maksimal 2 MB per foto.
- Validasi server meliputi error upload, MIME, ekstensi dan isi gambar. Nama file acak dari server.
- Preview sebelum unggah; pilih gambar utama; hapus gambar tertentu; bersihkan file setelah penghapusan berhasil.
- Transaksi untuk produk dan gambar; file baru dibersihkan jika transaksi gagal.
- Detail produk pelanggan menampilkan thumbnail galeri yang dapat dipilih.
- Produk yang digunakan keranjang/pesanan ditolak saat dihapus fisik; gunakan Tidak Tersedia untuk menonaktifkannya.
- Foto katalog nyata dari paket lama digunakan kembali dan tersedia lokal.
- Build CSS/JavaScript dan vendor PHP disertakan. Node.js hanya diperlukan untuk mengubah frontend.

Alur keranjang, checkout, pembayaran manual, pesanan, pengiriman dan laporan berasal dari versi dasar. Endpoint API lama dipertahankan; modul manajemen lengkap diarahkan ke halaman MVC baru. Struktur frontend publik masih memakai React di dalam view PHP, sedangkan autentikasi dan modul produk baru memakai view PHP/Bootstrap.

## Menjalankan di Windows / VS Code

1. Ekstrak ZIP. Buka folder **ShopEase** yang berisi file **spark** di VS Code.
2. Nyalakan MySQL di XAMPP. Buat database **db_shopease** melalui phpMyAdmin bila belum ada.
3. Sesuaikan .env: host, nama database, username, password, driver MySQLi, port. Paket memakai port **3306**; jika XAMPP memakai **3307**, ubah sesuai instalasi lokal. Pertahankan .env lokal saat upgrade.
4. Jalankan dari CMD di folder tersebut:

```bat
C:\xampp_new\php\php.exe spark migrate
C:\xampp_new\php\php.exe spark db:seed ShopSeeder
C:\xampp_new\php\php.exe spark serve
```

Ganti path dengan C:\xampp\php\php.exe bila PHP ada di sana. Seeder diperlukan untuk data/akun demo; tidak mengosongkan data lama. Bila vendor belum tersedia, jalankan composer install. Aset UI sudah dibangun; tidak perlu npm untuk menjalankan aplikasi.

5. Buka http://localhost:8080. Login pengelola, pilih Produk atau Kategori.
6. Pastikan writable dan public/uploads/products dapat ditulisi. Jika gagal, periksa writable/logs dan koneksi MySQL.

| Akun demo setelah seeding | Email | Password |
| --- | --- | --- |
| Admin | admin@shopease.test | ShopEase2026! |
| Operator | operator@shopease.test | ShopEase2026! |
| Customer | customer@shopease.test | ShopEase2026! |

Sebelum upgrade instalasi lama, cadangkan DB dan folder gambar. Jalankan **spark migrate** untuk menambah tabel/kolom. Jangan menggunakan migrate:refresh atau menghapus tabel. Jika database lokal memakai id_product/id_category numerik, database itu berbeda dari paket dasar ini dan perlu penyesuaian sebelum digunakan.

## Routing dan struktur

| Path | Method | Akses |
| --- | --- | --- |
| / | GET | Publik |
| /register, /login | GET/POST | Publik |
| /logout | POST | Akhiri sesi |
| /admin | GET | Admin |
| /operator | GET | Operator |
| /admin/products, /admin/categories | GET | Admin, Operator |
| /admin/{products/categories}/create | GET | Admin, Operator |
| /admin/{products/categories}/store | POST | Admin, Operator |
| /admin/{products/categories}/edit/{id} | GET | Admin, Operator |
| /admin/{products/categories}/update/{id} | POST | Admin, Operator |
| /admin/{products/categories}/delete/{id} | POST | Admin, Operator |
| /admin/products/{id}/images/{id_image}/primary | POST | Admin, Operator |
| /admin/products/{id}/images/{id_image}/delete | POST | Admin, Operator |

Notasi {products/categories} berarti pilih salah satu path. Parameter produk/kategori menerima ID teks lama melalui (:segment), gambar menerima (:num). Auto routing dimatikan; form POST memakai CSRF.

File utama: app/Config/Routes.php; app/Controllers/Admin/ProductController.php dan CategoryController.php; app/Models/ProductImageModel.php; app/Views/admin/products/ serta categories/; app/Views/layouts/management.php; public/assets/management.css; public/uploads/products/.

## Status verifikasi

- **Berhasil:** npm run build:ui.
- **Berhasil:** parsing sintaks seluruh file PHP yang berubah, tanpa error sintaks.
- **Dilakukan saat pengemasan:** pemeriksaan integritas ZIP.
- **Berhasil di lingkungan lokal 19 November 2026:** migrasi pada database lama, seeder, query MySQL, registrasi dan login HTTP, tambah/hapus produk lewat form, unggah dua foto WEBP, ganti gambar utama, hapus gambar utama dengan pemilihan pengganti, serta 30 pemeriksaan integrasi SQLite terisolasi. Data produk dan foto uji telah dibersihkan.
- **Tampilan diperiksa melalui render browser lokal:** beranda pada lebar desktop 1440 px dan lebar ringkas sekitar 500 px; palet ungu, hero, promosi, dan navigasi tampil utuh. Kesamaan per piksel dengan mockup tidak dijadikan syarat karena gambar lampiran adalah acuan desain.

## Checklist pengujian lokal

| Skenario | Hasil yang perlu diverifikasi |
| --- | --- |
| Register valid, email duplikat, password pendek, konfirmasi berbeda | Hanya akun valid tersimpan |
| Login benar/salah, logout, akses sesudah logout | Sesi benar; akses sesudah logout ditolak |
| Guest/Customer membuka produk pengelola | Redirect login / akses ditolak |
| Admin dan Operator membuka kategori/produk | Keduanya diizinkan |
| Operator membuka /admin | Ditolak |
| Produk tanpa kategori/kategori palsu | Ditolak server |
| Harga/stok negatif dan stok nol | Negatif ditolak, nol diterima |
| Tambah/edit/hapus kategori, termasuk kategori terpakai | CRUD berhasil, kategori terpakai tidak terhapus |
| Pencarian, filter kategori/stok, pagination | Hasil konsisten dengan filter |
| Upload 2 foto valid | Keduanya tersimpan, foto pertama utama |
| Non-gambar, >2 MB/file, >8 gambar | Ditolak dengan pesan |
| Ganti gambar utama / hapus gambar utama | Katalog berubah; gambar pengganti dipilih |
| Hapus foto terakhir | Placeholder lokal digunakan |
| Hapus produk yang tidak direferensikan | Data dan file galeri dihapus |
| Hapus produk pada keranjang/pesanan | Ditolak; status dapat dinonaktifkan |
| Customer membuka galeri | Thumbnail dapat dipilih |
| Cart → checkout → pembayaran → pengiriman | Uji regresi alur versi dasar |

Prioritas pembaruan ini adalah dua praktikum terbaru: Authentication dan Product Management, dengan integrasi ke sistem lama. Pengujian runtime lokal dan konversi skema penuh masih menjadi pekerjaan terpisah yang belum diverifikasi.
