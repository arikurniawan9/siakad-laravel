# Catatan Pengerjaan — Keuangan & Superadmin (7 Mei 2026)

Timezone: Asia/Bangkok

## Ringkasan Perbaikan Inti

### 1) Alur Keuangan Konsisten (payment-driven)
- Midtrans callback **mencatat** `Pembayaran` + `PembayaranAllocation` lalu memanggil `Tagihan::refreshStatusFromPayments()` (status tagihan tidak di-set langsung).
- `Tagihan::paidAmount()` tetap kompatibel: fallback menjumlahkan `transaksis` `status=success` **hanya jika** belum ada `pembayarans`.

### 2) Proteksi Overpayment (manual payment)
- `PembayaranController@store` menolak:
  - pembayaran > sisa tagihan
  - alokasi item > sisa item

### 3) Standarisasi PMB
- `PmbController@createSnap` membuat `TagihanItem` default (`PMB-REG`) untuk tagihan PMB agar konsisten dengan tagihan mahasiswa.
- Kolom `pembayarans.mahasiswa_id` dibuat **nullable** supaya pembayaran PMB bisa dicatat.

### 4) Idempotensi (anti duplikasi)
- Unique index: `pembayarans (tagihan_id, provider, reference)` untuk mencegah duplikasi pembayaran (mis. double callback).
- `transaksis.order_id` sudah unik dari awal.

## Audit Trail

### Struktur
- Tabel: `audit_logs`
- Model: `app/Models/AuditLog.php`
- Helper: `app/Support/Audit.php`

### Logging yang ditambahkan
- Tagihan: create / status update / delete (`KeuanganController`)
- Pembayaran manual: create (`PembayaranController`)
- Midtrans: callback diterima + create payment dari gateway (`MidtransCallbackController`)
- Dashboard superadmin menampilkan audit finance (`DashboardController`)

## Period Lock / Closing

### Struktur
- Tabel: `finance_period_locks`
- Model: `app/Models/FinancePeriodLock.php`
- Helper: `app/Support/FinancePeriod.php` (`isLocked(tahun, semester)`)

### Enforcement
- Blok create/update/delete tagihan saat periode terkunci (`KeuanganController`)
- Blok pembayaran manual saat periode terkunci (`PembayaranController`)
- Callback Midtrans sukses saat terkunci: **tidak mencatat pembayaran** (tetap audit log) (`MidtransCallbackController`)

### UI
- Settings superadmin:
  - Page: `resources/js/Pages/Modules/Settings/FinancePeriodLocks.jsx`
  - Routes:
    - `settings.finance-period-locks.index`
    - `settings.finance-period-locks.store`
    - `settings.finance-period-locks.destroy`

## Rekonsiliasi Late Payment (Gateway saat periode terkunci)

### Struktur
- Tabel: `finance_reconciliations`
- Model: `app/Models/FinanceReconciliation.php`

### Behavior
- Jika callback Midtrans `success` datang saat periode terkunci:
  - sistem **tidak mencatat pembayaran**
  - sistem membuat item `finance_reconciliations` status `pending`

### UI Superadmin
- Page: `resources/js/Pages/Modules/Settings/FinanceReconciliation.jsx`
- Routes:
  - `settings.finance-reconciliation.index`
  - `settings.finance-reconciliation.resolve` (Resolve + Catat: buat `Pembayaran` + alokasi + refresh status tagihan + mark resolved)
  - `settings.finance-reconciliation.ignore`

## Testing
- Test baru/ditambah untuk skenario:
  - Midtrans success → pembayaran+alokasi + audit log
  - Midtrans failed tidak menimpa status jika sudah ada pembayaran
  - Period lock memblok aksi
  - Rekonsiliasi dibuat saat lock
  - Resolve rekonsiliasi mencatat pembayaran dan mengubah status tagihan

## Status Repo
- Sudah dipush ke GitHub (branch `main`)
- Commit: `feat: finance hardening, closing locks, audit & reconciliation`

## Kandidat Next Step
- Putuskan policy saat resolve: apakah boleh “Resolve + Catat” walau periode masih terkunci, atau harus unlock periode dulu.
- Export laporan closing per periode + ringkasan rekonsiliasi.
- Halaman audit finance khusus (filter & export) terpisah dari dashboard.

