<?php

use App\Http\Controllers\AkademikController;
use App\Http\Controllers\DosenController;
use App\Http\Controllers\DosenImportController;
use App\Http\Controllers\DosenRelasiController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DuitkuCallbackController;
use App\Http\Controllers\JenisPembayaranController;
use App\Http\Controllers\KeuanganController;
use App\Http\Controllers\KeuanganSetupController;
use App\Http\Controllers\KrsController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\MahasiswaController;
use App\Http\Controllers\MahasiswaImportController;
use App\Http\Controllers\PembayaranController;
use App\Http\Controllers\PublicGatewayController;
use App\Http\Controllers\MidtransCallbackController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PmbController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserAccessController;
use App\Http\Controllers\XenditCallbackController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingPageController::class, 'show'])->name('landing.index');
Route::get('/daftar-pmb', [PublicGatewayController::class, 'daftarPmb'])->name('public.daftar-pmb');
Route::get('/login-mahasiswa', [PublicGatewayController::class, 'loginMahasiswa'])->name('public.login-mahasiswa');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/pmb', [PmbController::class, 'index'])->name('pmb.index');
    Route::post('/pmb', [PmbController::class, 'store'])->name('pmb.store');
    Route::get('/pmb/payment', [PmbController::class, 'payment'])->name('pmb.payment');
    Route::get('/pmb/verifikasi', [PmbController::class, 'index'])->middleware('role:super-admin,admin,operator,baak')->name('pmb.verification.index');
    Route::get('/pmb/{pmb}/documents/{field}', [PmbController::class, 'downloadDocument'])->name('pmb.documents.download');
    Route::get('/pmb/export/csv', [PmbController::class, 'exportVerificationCsv'])->middleware('role:super-admin,admin,operator,baak')->name('pmb.verification.export.csv');
    Route::get('/pmb/export/pdf', [PmbController::class, 'exportVerificationPdf'])->middleware('role:super-admin,admin,operator,baak')->name('pmb.verification.export.pdf');
    Route::get('/pmb/export/xlsx', [PmbController::class, 'exportVerificationXlsx'])->middleware('role:super-admin,admin,operator,baak')->name('pmb.verification.export.xlsx');
    Route::post('/pmb/{pmb}/snap', [PmbController::class, 'createSnap'])->name('pmb.snap');
    Route::patch('/pmb/{pmb}/verification', [PmbController::class, 'updateVerification'])->middleware('role:super-admin,admin,operator,baak')->name('pmb.verification.update');

    Route::middleware(['role:super-admin,admin,operator,baak'])->group(function () {
        Route::get('/akademik', [AkademikController::class, 'index'])->name('akademik.index');
        Route::get('/akademik/jurusan', [AkademikController::class, 'jurusan'])->name('akademik.jurusan.index');
        Route::get('/akademik/jurusan/template', [AkademikController::class, 'templateJurusan'])->name('akademik.jurusan.template');
        Route::get('/akademik/jurusan/export', [AkademikController::class, 'exportJurusan'])->name('akademik.jurusan.export');
        Route::post('/akademik/jurusan/import', [AkademikController::class, 'importJurusan'])->middleware('action:action.create')->name('akademik.jurusan.import');
        Route::get('/akademik/prodi', [AkademikController::class, 'prodi'])->name('akademik.prodi.index');
        Route::get('/akademik/prodi/template', [AkademikController::class, 'templateProdi'])->name('akademik.prodi.template');
        Route::get('/akademik/prodi/export', [AkademikController::class, 'exportProdi'])->name('akademik.prodi.export');
        Route::post('/akademik/prodi/import', [AkademikController::class, 'importProdi'])->middleware('action:action.create')->name('akademik.prodi.import');
        Route::get('/akademik/mata-kuliah', [AkademikController::class, 'mataKuliah'])->name('akademik.matakuliah.index');
        Route::get('/akademik/mata-kuliah/template', [AkademikController::class, 'templateMataKuliah'])->name('akademik.matakuliah.template');
        Route::get('/akademik/mata-kuliah/export', [AkademikController::class, 'exportMataKuliah'])->name('akademik.matakuliah.export');
        Route::post('/akademik/mata-kuliah/import', [AkademikController::class, 'importMataKuliah'])->middleware('action:action.create')->name('akademik.matakuliah.import');
        Route::get('/akademik/kurikulum', [AkademikController::class, 'kurikulum'])->name('akademik.kurikulum.index');
        Route::get('/akademik/kurikulum/template', [AkademikController::class, 'templateKurikulum'])->name('akademik.kurikulum.template');
        Route::get('/akademik/kurikulum/export', [AkademikController::class, 'exportKurikulum'])->name('akademik.kurikulum.export');
        Route::post('/akademik/kurikulum/import', [AkademikController::class, 'importKurikulum'])->middleware('action:action.create')->name('akademik.kurikulum.import');
        Route::get('/akademik/kelas', [AkademikController::class, 'kelas'])->name('akademik.kelas.index');
        Route::get('/akademik/kelas/template', [AkademikController::class, 'templateKelas'])->name('akademik.kelas.template');
        Route::get('/akademik/kelas/export', [AkademikController::class, 'exportKelas'])->name('akademik.kelas.export');
        Route::post('/akademik/kelas/import', [AkademikController::class, 'importKelas'])->middleware('action:action.create')->name('akademik.kelas.import');
        Route::get('/akademik/ruangan', [AkademikController::class, 'ruangan'])->name('akademik.ruangan.index');
        Route::get('/akademik/ruangan/template', [AkademikController::class, 'templateRuangan'])->name('akademik.ruangan.template');
        Route::get('/akademik/ruangan/export', [AkademikController::class, 'exportRuangan'])->name('akademik.ruangan.export');
        Route::post('/akademik/ruangan/import', [AkademikController::class, 'importRuangan'])->middleware('action:action.create')->name('akademik.ruangan.import');
        Route::get('/akademik/tahun-akademik', [AkademikController::class, 'tahunAkademik'])->name('akademik.tahun.index');
        Route::get('/akademik/tahun-akademik/template', [AkademikController::class, 'templateTahunAkademik'])->name('akademik.tahun.template');
        Route::get('/akademik/tahun-akademik/export', [AkademikController::class, 'exportTahunAkademik'])->name('akademik.tahun.export');
        Route::post('/akademik/tahun-akademik/import', [AkademikController::class, 'importTahunAkademik'])->middleware('action:action.create')->name('akademik.tahun.import');
        Route::post('/akademik/jurusan', [AkademikController::class, 'storeJurusan'])->middleware('action:action.create')->name('akademik.jurusan.store');
        Route::put('/akademik/jurusan/{jurusan}', [AkademikController::class, 'updateJurusan'])->middleware('action:action.update')->name('akademik.jurusan.update');
        Route::delete('/akademik/jurusan/{jurusan}', [AkademikController::class, 'destroyJurusan'])->middleware('action:action.delete')->name('akademik.jurusan.destroy');
        Route::post('/akademik/prodi', [AkademikController::class, 'storeProdi'])->middleware('action:action.create')->name('akademik.prodi.store');
        Route::put('/akademik/prodi/{prodi}', [AkademikController::class, 'updateProdi'])->middleware('action:action.update')->name('akademik.prodi.update');
        Route::delete('/akademik/prodi/{prodi}', [AkademikController::class, 'destroyProdi'])->middleware('action:action.delete')->name('akademik.prodi.destroy');
        Route::post('/akademik/mata-kuliah', [AkademikController::class, 'storeMataKuliah'])->middleware('action:action.create')->name('akademik.matakuliah.store');
        Route::put('/akademik/mata-kuliah/{mataKuliah}', [AkademikController::class, 'updateMataKuliah'])->middleware('action:action.update')->name('akademik.matakuliah.update');
        Route::delete('/akademik/mata-kuliah/{mataKuliah}', [AkademikController::class, 'destroyMataKuliah'])->middleware('action:action.delete')->name('akademik.matakuliah.destroy');
        Route::post('/akademik/kurikulum', [AkademikController::class, 'storeKurikulum'])->middleware('action:action.create')->name('akademik.kurikulum.store');
        Route::put('/akademik/kurikulum/{kurikulum}', [AkademikController::class, 'updateKurikulum'])->middleware('action:action.update')->name('akademik.kurikulum.update');
        Route::delete('/akademik/kurikulum/{kurikulum}', [AkademikController::class, 'destroyKurikulum'])->middleware('action:action.delete')->name('akademik.kurikulum.destroy');
        Route::post('/akademik/kelas', [AkademikController::class, 'storeKelas'])->middleware('action:action.create')->name('akademik.kelas.store');
        Route::put('/akademik/kelas/{kelas}', [AkademikController::class, 'updateKelas'])->middleware('action:action.update')->name('akademik.kelas.update');
        Route::delete('/akademik/kelas/{kelas}', [AkademikController::class, 'destroyKelas'])->middleware('action:action.delete')->name('akademik.kelas.destroy');
        Route::post('/akademik/ruangan', [AkademikController::class, 'storeRuangan'])->middleware('action:action.create')->name('akademik.ruangan.store');
        Route::put('/akademik/ruangan/{ruangan}', [AkademikController::class, 'updateRuangan'])->middleware('action:action.update')->name('akademik.ruangan.update');
        Route::delete('/akademik/ruangan/{ruangan}', [AkademikController::class, 'destroyRuangan'])->middleware('action:action.delete')->name('akademik.ruangan.destroy');
        Route::post('/akademik/tahun-akademik', [AkademikController::class, 'storeTahunAkademik'])->middleware('action:action.create')->name('akademik.tahun.store');
        Route::put('/akademik/tahun-akademik/{tahunAkademik}', [AkademikController::class, 'updateTahunAkademik'])->middleware('action:action.update')->name('akademik.tahun.update');
        Route::delete('/akademik/tahun-akademik/{tahunAkademik}', [AkademikController::class, 'destroyTahunAkademik'])->middleware('action:action.delete')->name('akademik.tahun.destroy');
    });
    Route::get('/krs', [KrsController::class, 'index'])->name('krs.index');
    Route::get('/krs/export/pdf', [KrsController::class, 'indexPdf'])->name('krs.index.pdf');
    Route::get('/krs/{krs}', [KrsController::class, 'show'])->name('krs.show');
    Route::get('/krs/{krs}/print', [KrsController::class, 'print'])->name('krs.print');
    Route::get('/krs/{krs}/pdf', [KrsController::class, 'pdf'])->name('krs.pdf');
    Route::post('/krs', [KrsController::class, 'store'])->name('krs.store');
    Route::patch('/krs/{krs}/submit', [KrsController::class, 'submit'])->name('krs.submit');
    Route::middleware(['role:super-admin,admin,operator,baak'])->group(function () {
        Route::patch('/krs/{krs}/approve', [KrsController::class, 'approve'])->middleware('action:action.update')->name('krs.approve');
        Route::patch('/krs/{krs}/reject', [KrsController::class, 'reject'])->middleware('action:action.update')->name('krs.reject');
    });

    Route::middleware(['role:super-admin,admin,bendahara,keuangan'])->group(function () {
        Route::get('/keuangan', [KeuanganController::class, 'index'])->name('keuangan.index');
        Route::get('/keuangan/export/pdf', [KeuanganController::class, 'dashboardPdf'])->name('keuangan.dashboard.pdf');
        Route::get('/keuangan/tagihan', [KeuanganController::class, 'tagihan'])->name('keuangan.tagihan');
        Route::get('/keuangan/tagihan/export/pdf', [KeuanganController::class, 'tagihanPdf'])->name('keuangan.tagihan.pdf');
        Route::post('/keuangan/tagihan', [KeuanganController::class, 'storeTagihan'])->middleware('action:action.create')->name('keuangan.tagihan.store');
        Route::post('/keuangan/tagihan/bulk', [KeuanganController::class, 'storeBulkTagihan'])->middleware('action:action.create')->name('keuangan.tagihan.bulk');
        Route::patch('/keuangan/tagihan/{tagihan}/status', [KeuanganController::class, 'updateTagihanStatus'])->middleware('action:action.update')->name('keuangan.tagihan.status');
        Route::delete('/keuangan/tagihan/{tagihan}', [KeuanganController::class, 'destroyTagihan'])->middleware('action:action.delete')->name('keuangan.tagihan.destroy');
        Route::post('/keuangan/tagihan/{tagihan}/pembayaran', [PembayaranController::class, 'store'])->middleware('action:action.create')->name('keuangan.tagihan.pembayaran.store');
        Route::get('/keuangan/transaksi', [KeuanganController::class, 'transaksi'])->name('keuangan.transaksi');
        Route::get('/keuangan/transaksi/export/pdf', [KeuanganController::class, 'transaksiPdf'])->name('keuangan.transaksi.pdf');

        Route::get('/keuangan/jenis-pembayaran', [JenisPembayaranController::class, 'index'])->name('keuangan.jenis-pembayaran');
        Route::post('/keuangan/jenis-pembayaran', [JenisPembayaranController::class, 'store'])->middleware('action:action.create')->name('keuangan.jenis-pembayaran.store');
        Route::put('/keuangan/jenis-pembayaran/{jenisPembayaran}', [JenisPembayaranController::class, 'update'])->middleware('action:action.update')->name('keuangan.jenis-pembayaran.update');
        Route::delete('/keuangan/jenis-pembayaran/{jenisPembayaran}', [JenisPembayaranController::class, 'destroy'])->middleware('action:action.delete')->name('keuangan.jenis-pembayaran.destroy');

        Route::middleware(['role:super-admin,admin'])->group(function () {
            Route::get('/keuangan/setup-tarif', [KeuanganSetupController::class, 'index'])->name('keuangan.setup.index');
            Route::post('/keuangan/setup-tarif/jenis-tagihan', [KeuanganSetupController::class, 'storeJenisTagihan'])->name('keuangan.setup.jenis-tagihan.store');
            Route::put('/keuangan/setup-tarif/jenis-tagihan/{jenisTagihan}', [KeuanganSetupController::class, 'updateJenisTagihan'])->name('keuangan.setup.jenis-tagihan.update');
            Route::delete('/keuangan/setup-tarif/jenis-tagihan/{jenisTagihan}', [KeuanganSetupController::class, 'destroyJenisTagihan'])->name('keuangan.setup.jenis-tagihan.destroy');

            Route::post('/keuangan/setup-tarif/tarif', [KeuanganSetupController::class, 'storeTarif'])->name('keuangan.setup.tarif.store');
            Route::post('/keuangan/setup-tarif/tarif/bulk', [KeuanganSetupController::class, 'storeTarifBulk'])->name('keuangan.setup.tarif.bulk');
            Route::delete('/keuangan/setup-tarif/tarif/{tarifKeuangan}', [KeuanganSetupController::class, 'destroyTarif'])->name('keuangan.setup.tarif.destroy');
        });
    });

    Route::middleware(['role:super-admin,admin'])->group(function () {
        Route::get('/settings/landing-page', [LandingPageController::class, 'edit'])->name('settings.landing-page.index');
        Route::put('/settings/landing-page', [LandingPageController::class, 'update'])->name('settings.landing-page.update');
        Route::post('/settings/landing-page/upload-image', [LandingPageController::class, 'uploadImage'])->name('settings.landing-page.upload-image');
    });

    Route::middleware(['role:super-admin,admin,operator,baak'])->group(function () {
        Route::get('/mahasiswa', [MahasiswaController::class, 'index'])->name('mahasiswa.index');
        Route::get('/mahasiswa/export/pdf', [MahasiswaController::class, 'indexPdf'])->name('mahasiswa.index.pdf');
        Route::get('/mahasiswa/export/xlsx', [MahasiswaController::class, 'indexXlsx'])->name('mahasiswa.index.xlsx');
        Route::post('/mahasiswa', [MahasiswaController::class, 'store'])->middleware('action:action.create')->name('mahasiswa.store');
        Route::put('/mahasiswa/{mahasiswa}', [MahasiswaController::class, 'update'])->middleware('action:action.update')->name('mahasiswa.update');
        Route::delete('/mahasiswa/{mahasiswa}', [MahasiswaController::class, 'destroy'])->middleware('action:action.delete')->name('mahasiswa.destroy');
        Route::get('/mahasiswa/import', function() { return redirect()->route('mahasiswa.index'); })->name('mahasiswa.import.index');
        Route::match(['get', 'post'], '/mahasiswa/import/preview', [MahasiswaImportController::class, 'preview'])->name('mahasiswa.import.preview');
        Route::post('/mahasiswa/import/preview/update', [MahasiswaImportController::class, 'updatePreview'])->middleware('action:action.create')->name('mahasiswa.import.preview.update');
        Route::post('/mahasiswa/import/process', [MahasiswaImportController::class, 'process'])->middleware('action:action.create')->name('mahasiswa.import.process');
        Route::get('/mahasiswa/import/template', [MahasiswaImportController::class, 'template'])->name('mahasiswa.import.template');
    });
    Route::middleware(['role:super-admin,admin,operator,baak,mahasiswa'])->group(function () {
        Route::get('/mahasiswa/krs', [MahasiswaController::class, 'krs'])->name('mahasiswa.krs');
        Route::get('/mahasiswa/khs', [MahasiswaController::class, 'khs'])->name('mahasiswa.khs');
        Route::get('/mahasiswa/khs/pdf', [MahasiswaController::class, 'khsPdf'])->name('mahasiswa.khs.pdf');
        Route::get('/mahasiswa/transkrip', [MahasiswaController::class, 'transkrip'])->name('mahasiswa.transkrip');
        Route::get('/mahasiswa/transkrip/pdf', [MahasiswaController::class, 'transkripPdf'])->name('mahasiswa.transkrip.pdf');
        Route::get('/mahasiswa/tagihan', [MahasiswaController::class, 'tagihan'])->name('mahasiswa.tagihan');
    });

    Route::middleware(['role:super-admin,admin,operator,baak'])->group(function () {
        Route::get('/dosen', [DosenController::class, 'index'])->name('dosen.index');
        Route::get('/dosen/export/pdf', [DosenController::class, 'indexPdf'])->name('dosen.index.pdf');
        Route::post('/dosen', [DosenController::class, 'store'])->middleware('action:action.create')->name('dosen.store');
        Route::put('/dosen/{dosen}', [DosenController::class, 'update'])->middleware('action:action.update')->name('dosen.update');
        Route::delete('/dosen/{dosen}', [DosenController::class, 'destroy'])->middleware('action:action.delete')->name('dosen.destroy');
        Route::get('/dosen/import', function() { return redirect()->route('dosen.index'); })->name('dosen.import.index');
        Route::match(['get', 'post'], '/dosen/import/preview', [DosenImportController::class, 'preview'])->name('dosen.import.preview');
        Route::post('/dosen/import/process', [DosenImportController::class, 'process'])->middleware('action:action.create')->name('dosen.import.process');
        Route::get('/dosen/import/template', [DosenImportController::class, 'template'])->name('dosen.import.template');
        Route::get('/dosen/relasi', [DosenRelasiController::class, 'index'])->name('dosen.relasi.index');
        Route::put('/dosen/relasi/{dosen}', [DosenRelasiController::class, 'update'])->middleware('action:action.update')->name('dosen.relasi.update');
    });
    Route::middleware(['role:super-admin,admin,operator,baak,dosen'])->group(function () {
        Route::get('/dosen/jadwal', [DosenController::class, 'jadwal'])->name('dosen.jadwal');
    });
    Route::middleware(['role:super-admin,admin,operator,baak,dosen'])->group(function () {
        Route::get('/dosen/nilai', [DosenController::class, 'nilai'])->name('dosen.nilai');
        Route::get('/dosen/nilai/{kelas}/pdf', [DosenController::class, 'nilaiPdf'])->name('dosen.nilai.pdf');
        Route::post('/dosen/nilai/{kelas}/store', [DosenController::class, 'storeNilai'])->middleware('action:action.update')->name('dosen.nilai.store');
        Route::patch('/dosen/nilai/{kelas}/publish', [DosenController::class, 'publishNilai'])->middleware('action:action.update')->name('dosen.nilai.publish');
    });

    Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
    Route::get('/laporan/export/pdf', [LaporanController::class, 'exportPdf'])->name('laporan.export.pdf');
    Route::middleware(['role:super-admin'])->group(function () {
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::get('/settings/database', [SettingsController::class, 'database'])->name('settings.database.index');
        Route::get('/settings/payment-gateway', [SettingsController::class, 'paymentGateway'])->name('settings.payment-gateway.index');
        Route::put('/settings/payment-gateway', [SettingsController::class, 'updatePaymentGateway'])->name('settings.payment-gateway.update');
        Route::post('/settings/payment-gateway/test', [SettingsController::class, 'testPaymentGateway'])->name('settings.payment-gateway.test');
        Route::get('/settings/finance-period-locks', [SettingsController::class, 'financePeriodLocks'])->name('settings.finance-period-locks.index');
        Route::post('/settings/finance-period-locks', [SettingsController::class, 'storeFinancePeriodLock'])->name('settings.finance-period-locks.store');
        Route::delete('/settings/finance-period-locks/{lock}', [SettingsController::class, 'destroyFinancePeriodLock'])->name('settings.finance-period-locks.destroy');
        Route::get('/settings/finance-reconciliation', [SettingsController::class, 'financeReconciliation'])->name('settings.finance-reconciliation.index');
        Route::get('/settings/finance-reconciliation/export/csv', [SettingsController::class, 'exportFinanceReconciliationCsv'])->name('settings.finance-reconciliation.export.csv');
        Route::patch('/settings/finance-reconciliation/bulk', [SettingsController::class, 'bulkFinanceReconciliation'])->name('settings.finance-reconciliation.bulk');
        Route::patch('/settings/finance-reconciliation/{item}/undo-ignore', [SettingsController::class, 'undoIgnoreFinanceReconciliation'])->name('settings.finance-reconciliation.undoIgnore');
        Route::patch('/settings/finance-reconciliation/{item}/resolve', [SettingsController::class, 'resolveFinanceReconciliation'])->name('settings.finance-reconciliation.resolve');
        Route::patch('/settings/finance-reconciliation/{item}/ignore', [SettingsController::class, 'ignoreFinanceReconciliation'])->name('settings.finance-reconciliation.ignore');
        Route::get('/settings/user-access', [UserAccessController::class, 'index'])->name('settings.user-access.index');
        Route::post('/settings/user-access', [UserAccessController::class, 'store'])->name('settings.user-access.store');
        Route::put('/settings/user-access/{user}', [UserAccessController::class, 'update'])->name('settings.user-access.update');
        Route::patch('/settings/user-access/{user}/password', [UserAccessController::class, 'resetPassword'])->name('settings.user-access.password');
        Route::post('/settings/database/backup', [SettingsController::class, 'backupDatabase'])->name('settings.database.backup');
        Route::post('/settings/database/restore', [SettingsController::class, 'restoreDatabase'])->name('settings.database.restore');
        Route::post('/settings/database/restore/{filename}', [SettingsController::class, 'restoreDatabaseFromStoredBackup'])->name('settings.database.restoreStored');
        Route::post('/settings/database/reset', [SettingsController::class, 'resetDatabase'])->name('settings.database.reset');
        Route::get('/settings/database/backup/{filename}', [SettingsController::class, 'downloadBackup'])->name('settings.database.download');
        Route::delete('/settings/database/backup/{filename}', [SettingsController::class, 'deleteBackup'])->name('settings.database.delete');
        Route::post('/settings/database/purge', [SettingsController::class, 'purgeBackups'])->name('settings.database.purge');
        Route::get('/settings/database/logs/export', [SettingsController::class, 'exportMaintenanceLogsCsv'])->name('settings.database.logs.export');
    });
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
});

Route::middleware(['signed'])->group(function () {
    Route::get('/krs/{krs}/verify', [KrsController::class, 'verify'])->name('krs.verify');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::post('/payments/midtrans/callback', MidtransCallbackController::class)->name('payments.midtrans.callback');
Route::post('/payments/xendit/callback', XenditCallbackController::class)->name('payments.xendit.callback');
Route::post('/payments/duitku/callback', DuitkuCallbackController::class)->name('payments.duitku.callback');

require __DIR__.'/auth.php';

