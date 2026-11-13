# Keamanan autentikasi ShopEase

## Pasang pada proyek Hands-On yang sudah berjalan

1. Hentikan server PHP dengan Ctrl+C. Ekstrak paket baru ke folder terpisah.
2. Paket sudah memakai host `127.0.0.1` dan port `3307`. Jika instalasi Hands-On sebelumnya sudah bekerja, salin file `.env` lama ke folder baru untuk memakai nama database dan kredensial yang sama. Contoh konfigurasi sebelumnya adalah `127.0.0.1`, port `3307`, dan database `db_shopease_handson`. Gunakan nama database yang sudah berhasil kamu akses. Pembaruan memakai tabel `users` dan `attempts` dari paket Hands-On.
3. Pastikan MariaDB aktif. Jika belum memiliki kunci aplikasi, jalankan dari CMD di folder baru.

   ```bat
   "C:\xampp_new\php\php.exe" spark key:generate
   ```

   Perintah mengisi `encryption.key` di `.env`. Jika kunci sudah ada, pertahankan nilainya. Jangan bagikan kunci atau isi `.env`. Jalankan `run.cmd`, lalu buka [ShopEase](http://localhost:8080/).

## Kontrol dan skenario uji

| Kontrol | Implementasi dan cara uji |
| --- | --- |
| Pembatasan login | Untuk satu kombinasi email dan IP, lima kegagalan mengunci login sekitar 60 detik. Percobaan selanjutnya, termasuk password yang benar, menerima HTTP 429 sampai jendela berakhir. Setelah login berhasil, penghitung kombinasi itu dihapus. Pembatas tambahan per IP memakai throttler CodeIgniter. |
| Pesan login dan hash | Email yang tidak terdaftar dan password salah menghasilkan pesan yang sama. Sistem melakukan pemeriksaan hash pembanding untuk akun yang tidak ditemukan. Hash password akun diperbarui saat login berhasil jika pengaturan hashing bawaan berubah. |
| Session | ID diregenerasi setelah login. Sesi kedaluwarsa setelah 30 menit tidak aktif atau 8 jam sejak dibuat. Role dibaca dari database. Perubahan password atau role membatalkan sesi aktif saat akses berikutnya. |
| Ingat saya | Dengan kunci terpasang, customer dapat memilih Ingat saya pada modal atau halaman login. Cookie HMAC berlaku 30 hari. Cookie menggunakan HttpOnly dan SameSite=Lax. Setelah sesi hilang, request GET berikutnya dapat memulihkan login customer. Perubahan password, role, atau kunci membatalkan cookie lama. |
| Logout | Logout memutus sesi dan menghapus cookie dari browser. Cookie Ingat saya ditandatangani tanpa penyimpanan token di server, sehingga salinan cookie yang sudah dicuri tidak dicabut oleh logout biasa. |
| CSRF dan log | Perlindungan CSRF berlaku untuk form dan API. Log development mencatat hasil login tanpa menyimpan password, token cookie, atau email yang dimasukkan pada percobaan gagal. |

Saat menjalankan aplikasi pada HTTPS, aktifkan `cookie.secure = true` dan gunakan URL HTTPS. Pertahankan pengaturan cookie HTTP lokal untuk XAMPP pada localhost. Akun demo pada paket disediakan untuk praktikum lokal.

Rujukan [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
