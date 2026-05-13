# Worklog 2026-05-12

## Ringkasan Pengerjaan

- Menambahkan halaman baru `Settings > Payment Gateway` untuk konfigurasi provider:
  - Midtrans
  - Xendit
  - Duitku
  - Manual
- Menambahkan penyimpanan konfigurasi gateway di database melalui tabel `app_settings`.
- Menjalankan migration:
  - `2026_05_12_150000_create_app_settings_table`
- Menambahkan service konfigurasi gateway runtime:
  - `app/Services/PaymentGatewayConfigService.php`
- Mengubah `MidtransService` agar membaca key dari database settings (fallback ke `config/services.php`).
- Menghubungkan PMB Payment agar:
  - memakai client key runtime dari settings
  - support sandbox/production script otomatis
  - memvalidasi provider aktif sebelum membuat Snap

## Endpoint & Route Baru

- Settings:
  - `GET /settings/payment-gateway`
  - `PUT /settings/payment-gateway`
  - `POST /settings/payment-gateway/test`
- Callback:
  - `POST /payments/midtrans/callback` (existing)
  - `POST /payments/xendit/callback` (baru)
  - `POST /payments/duitku/callback` (baru)

## Callback & Integrasi Pembayaran

- Menambahkan callback controller:
  - `XenditCallbackController`
  - `DuitkuCallbackController`
- Menambahkan pengecualian CSRF untuk callback Xendit dan Duitku.
- Menyamakan alur callback sukses seperti Midtrans:
  - update `transaksis`
  - cek period lock
  - masuk `finance_reconciliations` jika periode terkunci
  - create `pembayarans` (idempotent per provider+reference)
  - create `pembayaran_allocations`
  - refresh status tagihan
- Menambahkan notifikasi sukses/gagal (PMB & mahasiswa) untuk callback Xendit dan Duitku.

## UI/UX yang Ditambahkan

- Menambahkan tampilan callback URL full (berbasis `APP_URL`) pada halaman Payment Gateway.
- Menambahkan tombol `Copy` per callback URL dengan indikator `Tersalin`.
- Menambahkan tombol `Test Konfigurasi` di halaman Payment Gateway.
- Menambahkan menu sidebar:
  - `Payment Gateway` pada section Keuangan (super-admin)
- Menambahkan label pada form `Keuangan > Jenis Pembayaran` (form tambah data).
- Menambahkan opsi provider `xendit` dan `duitku` pada `Jenis Pembayaran`.

## File Utama yang Diubah/Ditambah

- `database/migrations/2026_05_12_150000_create_app_settings_table.php`
- `app/Models/AppSetting.php`
- `app/Services/PaymentGatewayConfigService.php`
- `app/Services/MidtransService.php`
- `app/Http/Controllers/SettingsController.php`
- `app/Http/Controllers/PmbController.php`
- `app/Http/Controllers/XenditCallbackController.php`
- `app/Http/Controllers/DuitkuCallbackController.php`
- `app/Http/Controllers/JenisPembayaranController.php`
- `app/Http/Middleware/VerifyCsrfToken.php`
- `routes/web.php`
- `config/menu.php`
- `config/access_control.php`
- `resources/js/Pages/Modules/Settings/PaymentGateway.jsx`
- `resources/js/Pages/Modules/Pmb/Payment.jsx`
- `resources/js/Pages/Modules/Keuangan/JenisPembayaran.jsx`

## Verifikasi

- Syntax check PHP: lolos.
- Build frontend (`npm run build`): sukses.

## Catatan Lanjutan (Next)

- Menambahkan dokumentasi mapping `payment_type` per provider di UI.
- Menambahkan pengujian end-to-end callback sandbox per provider.
- Optional: satukan logic callback provider ke service agar lebih modular.
