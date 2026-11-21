# Perubahan ShopEase dari Pertemuan 11 ke Pertemuan 12

## Ringkasan untuk presentasi

Pada Pertemuan 11, ShopEase sudah memiliki registrasi, login, session, role, dan AuthFilter. Pertemuan 12 menambahkan pengelolaan data toko dan alur pesanan: produk serta kategori dari database, galeri gambar, inventori, keranjang, checkout, bukti pembayaran, verifikasi admin, pengiriman, dan konfirmasi pesanan diterima. Ada modul CRUD **Data Karyawan** sebagai latihan model CodeIgniter 4. Panel admin dan formulir CRUD memakai Bootstrap 5 serta gaya ungu pastel ShopEase.

| Bagian | Sebelumnya | Sekarang |
| --- | --- | --- |
| Karyawan | Belum ada | Tabel, lima data awal, model dengan validasi, pencarian, filter jabatan, pagination, dan CRUD khusus admin |
| Produk | Daftar dari database dan CRUD dasar | Pagination 8, pencarian model, maksimal 5 gambar, gambar utama, dan status otomatis tidak tersedia saat stok nol |
| Inventori | Filter stok di daftar produk | Halaman khusus tiga tab, ubah stok langsung, status otomatis mengikuti stok |
| Customer | Login menuju beranda; profil hanya dibaca | Login menuju dashboard customer, ringkasan pesanan, ubah profil, dan ganti password |
| Checkout | Kurir Reguler/Express, ongkir tetap | Tambah SiCepat REG Rp12.000, gratis ongkir Surabaya, pilihan bank, dan hitung ulang di server |
| Pembayaran | Bukti transfer tanpa nama pengirim | Nama pengirim disimpan; file baru di `writable/uploads/payments` dan hanya pemilik/staf boleh melihatnya |
| Pengiriman | Nomor resi minimal 5 karakter | Minimal 8 karakter alfanumerik, hanya admin/operator yang dapat mengirim |
| Riwayat | Produk tidak dapat dihapus jika pernah dipesan | `order_items.product_id` dapat kosong saat produk dihapus; nama/harga pesanan tetap tersimpan |
| Dashboard admin | Statistik dasar | Ringkasan kategori, ketersediaan, status pesanan, dan daftar stok rendah/habis |

## Akses dan alur

- Admin: semua pengelolaan toko, verifikasi pembayaran, dan CRUD karyawan.
- Operator: produk, kategori, inventori, serta pengiriman; tidak dapat memverifikasi pembayaran atau membuka data karyawan.
- Customer: keranjang, checkout, pembayaran, riwayat, dashboard, profil, pembatalan sebelum bayar, dan konfirmasi penerimaan.
- Semua form yang mengubah data menggunakan POST dan CSRF.

Status internal database masih memakai kode Inggris (`pending_payment`, `waiting_verification`, `processing`, `shipped`, `completed`, `cancelled`) agar data lama tetap berlaku. Antarmuka menampilkan label bahasa Indonesia.

## Menjalankan

1. Nyalakan MySQL XAMPP pada port **3307**.
2. Dari folder proyek, jalankan `& 'C:\xampp_new\php\php.exe' spark migrate --all`.
3. Jalankan `& 'C:\Program Files\nodejs\npm.cmd' run build:ui` bila kode UI berubah.
4. Jalankan `& 'C:\xampp_new\php\php.exe' spark serve --host 127.0.0.1 --port 8080`.
5. Buka `http://localhost:8080/`.

Untuk pengujian alur dasar terisolasi: `& 'C:\xampp_new\php\php.exe' -d extension=sqlite3 spark shopease:test`.
