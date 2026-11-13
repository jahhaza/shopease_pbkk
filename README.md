# ShopEase — Online Store

Aplikasi praktikum e-commerce berdasarkan HOL, PRD, studi kasus, dan ketiga infografis ShopEase. Bahasa antarmuka Indonesia, mata uang IDR, satu toko, tiga peran. Tampilan mengikuti pola marketplace dengan identitas ShopEase sendiri; seluruh ikon berupa SVG, bukan emoji. 17 foto produk nyata disertakan lokal beserta URL sumber, tanpa gambar AI.

## Yang tersedia

- Beranda, Tentang Kami, Hubungi Kami dengan pesan tersimpan ke dashboard admin.
- 17 produk, 5 kategori, pencarian, filter, sorting, pagination, detail produk dan wishlist lokal perangkat.
- Registrasi, login/logout, password hash, session, pembatasan customer/admin/operator di server.
- Keranjang tersimpan per akun: tambah, ubah jumlah, hapus, dan hitung subtotal.
- Simpan beberapa alamat, pilih ongkir Reguler Rp15.000 atau Express Rp25.000, catatan pesanan.
- Checkout dengan transaksi database, validasi stok, snapshot nama/harga, pengurangan stok, idempotency key dan pengosongan keranjang.
- Riwayat dan detail pesanan milik customer. Bukti pembayaran JPG/PNG/WebP maksimal 2 MB disimpan privat di writable/uploads.
- Admin melihat bukti, menyetujui atau menolak disertai alasan. Operator mengisi kurir dan nomor resi setelah pembayaran disetujui.
- Customer konfirmasi penerimaan. Pembatalan hanya sebelum pembayaran diterima; stok kembali tepat satu kali.
- CRUD kategori; kategori yang direferensikan produk tidak dapat dihapus. CRUD produk, upload foto, harga, stok dan nonaktifkan produk agar riwayat tetap utuh.
- Dashboard, data pelanggan, pesan masuk, grafik tujuh hari, filter laporan menurut tanggal/status, ekspor CSV.

## 1. Persyaratan

PHP 8.2+ (diuji menggunakan PHP 8.4.24); ekstensi intl, mbstring, mysqli, fileinfo, curl, DOM/XML. MySQL 8+ atau MariaDB 10.6+. Composer 2. Node.js hanya diperlukan jika ingin mengubah dan membangun ulang source UI. Aset UI terkompilasi dan dependensi PHP produksi sudah disertakan dalam ZIP.

Gunakan PHP yang sama untuk terminal dan Apache. Di XAMPP aktifkan ekstensi melalui php.ini, lalu restart Apache. Di Laragon pilih versi PHP yang sesuai.

## 2. Instalasi

Untuk memperbarui instalasi Hands-On yang sudah berjalan, baca [Keamanan autentikasi](docs/SECURITY_AUTH.md).

Ikuti [Hands-On Lab Authentication](docs/HANDS_ON_AUTHENTICATION.md) untuk impor SQL, konfigurasi port XAMPP, perintah menjalankan proyek, dan skenario pengujian. Paket ini memakai database `db_shopease` dengan `users.id_user` sesuai lab. Gunakan database kosong yang terpisah dari instalasi ShopEase lama jika struktur tabelnya berbeda.

## 3. Akun praktikum

| Peran | Email | Password |
|---|---|---|
| Admin | admin@shopease.test | ShopEase2026! |
| Operator | operator@shopease.test | ShopEase2026! |
| Customer | customer@shopease.test | ShopEase2026! |
| Customer kedua | customer2@shopease.test | ShopEase2026! |

Di dialog Masuk, buka bagian Akun demonstrasi untuk tombol coba cepat. Akun demonstrasi adalah fixture pendidikan dan semua kredensialnya sengaja ditampilkan. Untuk hosting komersial, hapus tombol demo, hapus/ganti akun ini, dan tetapkan kredensial privat sendiri.

## 4. Urutan demonstrasi

1. Masuk customer, buka produk, tambah keranjang, atur kuantitas.
2. Checkout; tambahkan alamat contoh, pilih ongkir dan buat pesanan.
3. Detail pesanan menampilkan nominal serta status. Unggah gambar contoh bukti; jangan mentransfer uang.
4. Logout. Masuk admin, Seller Center > Pembayaran > Detail. Buka bukti; Setujui Pembayaran atau isi alasan dan Tolak Bukti.
5. Setelah pembayaran diterima, logout lalu masuk operator. Seller Center > Pengiriman > Detail. Isi nama kurir dan resi contoh.
6. Masuk customer, Pesanan Saya > Detail > Konfirmasi Diterima.
7. Untuk demonstrasi pembatalan, buat pesanan baru yang belum dibayar, lalu batalkan. Stok kembali otomatis.
8. Admin dapat menambah kategori, menambah produk dengan unggah foto, mengubah stok, dan mengunduh laporan CSV.

## 5. Aturan data dan keamanan

Harga selalu dihitung kembali di backend; `total` dari browser diabaikan. Stok direservasi saat order dikonfirmasi, bukan saat masuk keranjang. Checkout menggunakan transaksi InnoDB dan `SELECT ... FOR UPDATE`, mengunci user dan produk dalam urutan ID untuk mengurangi risiko overselling. Salinan harga/nama disimpan di order_items. Idempotency key mencegah order ganda. Kegagalan transaksi mengembalikan semua perubahan.

Pembayaran memiliki status sendiri (`unpaid`, `submitted`, `verified`, `rejected`). Order: `pending_payment` → `waiting_verification` → `processing` → `shipped` → `completed`. Bukti ditolak mengembalikan order ke pending_payment. Cancel hanya dari pending_payment/waiting_verification dan tidak boleh dilakukan operator. Perubahan status dicatat di audit.

Registrasi selalu menghasilkan customer; role tidak diambil dari browser. Password memakai password_hash/password_verify. ID sesi diregenerasi saat login/logout. CSRF global CodeIgniter memakai sesi dan header X-CSRF-TOKEN. Auto-routing dimatikan. Endpoint privat menggunakan AuthFilter ditambah validasi service; data render React di-escape otomatis. Bukti tidak disimpan di public, hanya diakses melalui endpoint pemeriksa role dan kepemilikan. Upload memeriksa ukuran, ekstensi, MIME, serta validitas gambar; nama acak dibuat server. Login salah dibatasi delapan percobaan per email/IP per 15 menit.

## 6. Struktur MVC

- `app/Config/Routes.php`: route publik dan API eksplisit.
- `app/Controllers/HomeController.php`: Home/About/Contact; view awal.
- `AuthController`, `ProductController`, `CartController`, `CheckoutController`, `OrderController`: koordinasi request/respons.
- `app/Controllers/Admin/`: kategori, produk, dashboard.
- `app/Models/*Model.php`: model CI4 untuk 10 entitas inti.
- `app/Services/ShopService.php`: aturan transaksi, validasi, perhitungan, dan alur status.
- `app/Filters/AuthFilter.php`: otorisasi role di server.
- `app/Views/frontend/home.php`: shell view PHP yang memuat antarmuka React interaktif.
- `frontend/ShopEase.tsx`, `frontend/shopease.css`: kode antarmuka, memakai Bootstrap 5 sebagai baseline dan CSS kustom. HTML awal tetap melalui view CI4.
- `public/assets`: bundle UI siap pakai serta Bootstrap 5.3.8.
- `public/images`: foto produk nyata + sources.json.
- `database`: SQL lengkap, skema terpisah, seed JSON/SQL, skema SQLite untuk pengujian.
- `docs`: PRD implementasi, ERD, panduan dan hasil tes.

## 7. Mengubah UI

Jalankan `npm install`, ubah `frontend/ShopEase.tsx` atau `frontend/shopease.css`, lalu `npm run build:ui`. Ini memperbarui public/assets/shopease.js dan shopease.css. Tidak perlu Node.js di hosting PHP; hanya upload hasil build beserta aplikasi CI4. Google Fonts membutuhkan koneksi internet dan memiliki fallback Arial.

## 8. Pengujian dan bukti

`php spark shopease:test` menjalankan 29 pemeriksaan logika bisnis di SQLite dalam memori dan tidak mengubah database konfigurasi. Ekstensi sqlite3 diperlukan khusus untuk tes ini. Cakupan: login/hash/role, batas kuantitas, snapshot/total, idempotensi, stok, kepemilikan, reject/approve, resi, completion/cancel, rollback, dan kategori berelasi. Transport upload PHP memakai fixture dalam tes service; uji upload nyata tercakup pada suite API pratinjau.

Hasil run disertakan pada `docs/ci4-test-results.json`. Skema dan seed SQL MySQL sudah berhasil dieksekusi pada MariaDB 11.8.6 mode bootstrap. Pengujian service menggunakan SQLite, sehingga pengujian HTTP lengkap CI4 + InnoDB bersamaan, performa, dan pengujian browser Firefox tetap perlu dilakukan pada mesin XAMPP/Laragon sasaran.

Pratinjau online adalah implementasi paralel dengan runtime JavaScript, D1, dan R2 karena hosting preview tidak mengeksekusi PHP. 29 uji API pratinjau lulus termasuk upload nyata, CSRF, role, rollback, dan status. Ini tidak mengubah teknologi proyek CI4 yang ada pada paket ini. Responsivitas diimplementasikan melalui breakpoint 600/850/1150 px; pemeriksaan browser dilakukan pada desktop Chromium, belum pada perangkat fisik.

## 9. Deployment dan backup

Set `CI_ENVIRONMENT = production`, baseURL HTTPS dengan trailing slash, kredensial database privat, dan secure cookie di hosting HTTPS. Arahkan root ke public dan batasi akses writable. Nonaktifkan akun/tombol demo sebelum penggunaan nyata. Payment gateway, tarif kurir otomatis, notifikasi email, serta multi-vendor di luar scope versi 1. Rekening 0000000000 adalah simulasi. Tidak ada transaksi uang sungguhan.

Backup MySQL: ekspor db_shopease melalui phpMyAdmin atau `mysqldump --single-transaction -u USER -p db_shopease > backup.sql`. Salin juga `writable/uploads` secara aman. Pulihkan SQL dan folder upload bersama-sama agar referensi bukti tidak putus.

## 10. Hasil akademik dan batasannya

Tersedia source CI4, SQL + seed, PRD implementasi dan laporan pengujian PDF, ERD, alur aktivitas, serta source UI. Dokumen referensi pengguna tetap menjadi acuan kebutuhan. Video rekaman interaksi dan slide presentasi belum dibuat; gunakan urutan demonstrasi di bagian 4 untuk merekam pada lingkungan kelas. Fitur lanjutan seperti payment gateway bukan bagian dari rilis ini.

Foto adalah aset nyata dari laman merek/retailer yang ditemukan melalui pencarian gambar web. Lihat `docs/SUMBER_GAMBAR.md` dan `public/images/sources.json`. Google bukan pemilik foto; hak cipta tetap pada pemilik masing-masing. Untuk penggunaan komersial, gunakan foto yang izinnya Anda miliki. Harga, rating dan angka terjual pada seed merupakan data contoh, bukan klaim penjualan nyata.

### Memilih akun saat demo

Buka `/login`, pilih Customer, Operator, atau Admin di panel **Akun Demo**, lalu klik **Masuk**. Gunakan **Keluar** sebelum berganti akun. Tombol mengisi form dengan akun seed bawaan dan tetap melewati proses autentikasi. Pastikan tiga akun demo dari SQL paket tersedia dalam database aktif. Panel hanya tampil pada lingkungan development ketika `shopease.demoAccounts = true`. Jika menyalin `.env` dari instalasi sebelumnya, tambahkan baris tersebut.

### Halaman autentikasi

Menu Masuk dan Daftar membuka halaman khusus di `/login` dan `/register`. Header, footer, font Inter, dan palet biru menggunakan aset toko yang sama. Pada layar sempit, halaman menampilkan formulir dalam satu kolom.

### Tampilan HP

Pada lebar hingga 760 px, navigasi utama ada di bagian bawah. Customer dapat membuka keranjang dari sana. Admin dan operator mempunyai navigasi Ringkasan, Pesanan, dan Akun. Filter produk dapat dilipat, form autentikasi tampil satu kolom, dan pesanan pada dashboard ditampilkan sebagai kartu. Untuk memeriksa dari Chrome di laptop, buka mode perangkat dan coba lebar 320 px, 390 px, serta 430 px. Jika membuka dari HP pada Wi-Fi yang sama, jalankan server dengan host IPv4 laptop dan gunakan alamat itu pada browser HP. MariaDB tetap berjalan di laptop pada port 3307.


### Cakupan tampilan HP

Lebar hingga 760 px memakai layout satu kolom untuk form serta halaman yang membutuhkan ruang baca. Beranda, katalog, favorit, keranjang, checkout, pesanan, profil, Tentang Kami, Bantuan, dan 404 memiliki penyesuaian untuk layar kecil. Halaman Masuk dan Daftar mempertahankan panel pengantar dalam bentuk banner ringkas. Pada dashboard admin/operator, menu menggunakan pilihan ringkas, sedangkan tabel pesanan, produk, kategori, dan pelanggan tampil sebagai kartu. Dialog mengikuti ukuran layar dan dapat digulir.

Gunakan perangkat HP atau Chrome Device Toolbar untuk memeriksa tampilan pada lebar 320, 390, dan 430 px. Pada setiap ukuran, coba daftar, masuk, keluar, buka profil, buka detail produk, dan navigasi dashboard dengan akun yang sesuai.


### Akses berdasarkan peran

- Tamu dan customer dapat membuka etalase. Keranjang, checkout, dan riwayat pribadi memerlukan akun customer.
- Admin masuk ke `/admin` dan dapat mengelola produk, kategori, dan pesanan. Data produk pengelolaan memakai `/api/admin/catalog` dengan filter admin.
- Operator masuk ke `/operator` dan melihat ringkasan pesanan serta pengiriman. Jika admin atau operator membuka beranda atau katalog, aplikasi mengarahkan kembali ke dashboard perannya. API katalog belanja mengembalikan 403 untuk kedua role.
- Uji masing-masing akun lewat panel Akun Demo. Pastikan tautan beranda, katalog, favorit, dan keranjang tidak tampil untuk admin atau operator, termasuk pada navigasi bawah di HP.
