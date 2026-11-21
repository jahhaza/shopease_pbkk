# ShopEase — pembaruan 19 November 2026

Baca [panduan versi terbaru](docs/PANDUAN_VERSI_TERBARU.md) terlebih dahulu: pembacaan 13 lampiran, perubahan, pemetaan schema, cara menjalankan, dan status pengujian.

Untuk penjelasan implementasi CRUD beserta struktur proyek, tabel endpoint, hak akses, relasi data, dan diagram alur, baca [Dokumentasi CRUD ShopEase](docs/DOKUMENTASI_CRUD.md).

Versi ini mengembangkan ShopEase_Blue_Menu_Admin_Lengkap: tema ungu, autentikasi PHP Bootstrap 5, manajemen produk/kategori MVC untuk Admin dan Operator, galeri gambar, inventori.

Setelah membuat database db_shopease dan menyesuaikan .env, jalankan dari folder ini:

```bat
C:\xampp_new\php\php.exe spark migrate
C:\xampp_new\php\php.exe spark db:seed ShopSeeder
C:\xampp_new\php\php.exe spark serve
```

Buka http://localhost:8080. Sesuaikan lokasi PHP dengan XAMPP. Data akun demo, port dan langkah upgrade ada di panduan.

Build frontend, migrasi MySQL, registrasi/login, CRUD produk, dan 30 pemeriksaan integrasi lokal berhasil pada 19 November 2026. Dokumen lain berasal dari versi dasar dan dapat memuat hasil tes versi terdahulu.

## Lanjutan CRUD (20 November 2026)

Alamat pengiriman pelanggan kini dapat ditambah, dilihat, diubah, dan dihapus melalui menu **Alamat Pengiriman**. Alamat yang sudah dipakai dalam pesanan tetap tersimpan sebagai riwayat dan tidak dapat diubah atau dihapus. Endpoint baru: `POST /api/addresses/{id}/update` dan `POST /api/addresses/{id}/delete` (wajib login customer dan token CSRF). Pembaruan stok di inventori mempertahankan status produk yang dinonaktifkan secara manual; stok nol tetap menonaktifkan produk.

Tes integrasi terisolasi: `C:\xampp_new\php\php.exe -d extension=sqlite3 spark shopease:test` (36 pemeriksaan lulus). Jika memakai instalasi PHP lain, pastikan ekstensi SQLite3 aktif.
