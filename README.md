# STAI SIAKAD

Aplikasi Sistem Informasi Akademik berbasis Laravel 10, Inertia React, Vite, Tailwind CSS, dan MySQL.

## Fitur Utama

- Autentikasi, role access, dan captcha login.
- Dashboard dan pengaturan akses pengguna.
- Master akademik: jurusan, prodi, mata kuliah, kurikulum, kelas, ruangan, dan tahun akademik.
- Modul mahasiswa, dosen, KRS, nilai, tagihan, transaksi, PMB, laporan, dan notifikasi.
- Integrasi Midtrans untuk pembayaran PMB.
- Export PDF, import/export Excel, QR verification, dan maintenance database.

## Kebutuhan

- PHP 8.1 atau lebih baru.
- Composer.
- Node.js dan npm.
- MySQL.

## Setup Lokal

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Sesuaikan konfigurasi database dan Midtrans di `.env`, lalu jalankan:

```bash
php artisan migrate --seed
npm run build
php artisan serve
```

Untuk development frontend:

```bash
npm run dev
```

## Akun Awal

Seeder membuat akun super admin berdasarkan konfigurasi berikut di `.env`:

```env
SUPER_ADMIN_EMAIL=superadmin@siakad.test
SUPER_ADMIN_PASSWORD=change-this-password
```

Ganti password default sebelum dipakai di lingkungan selain lokal.

## Perintah Penting

```bash
php artisan test
npm run build
php artisan route:list
```

## Catatan Produksi

- Set `APP_ENV=production` dan `APP_DEBUG=false`.
- Gunakan password super admin yang kuat.
- Isi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, dan `MIDTRANS_IS_PRODUCTION` sesuai environment.
- Jalankan backup database sebelum memakai fitur restore/reset database.
- Pastikan folder `storage` dan `bootstrap/cache` writable oleh web server.
