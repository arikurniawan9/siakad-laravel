<?php

$dashboard = [
    ['group' => 'Utama', 'items' => [
        ['label' => 'Dashboard', 'route' => 'dashboard'],
    ]],
];

$masterAkademik = [
    ['label' => 'Ringkasan Akademik', 'route' => 'akademik.index'],
    ['label' => 'Tahun Akademik', 'route' => 'akademik.tahun.index'],
    ['label' => 'Jurusan', 'route' => 'akademik.jurusan.index'],
    ['label' => 'Prodi', 'route' => 'akademik.prodi.index'],
    ['label' => 'Ruangan', 'route' => 'akademik.ruangan.index'],
    ['label' => 'Kurikulum', 'route' => 'akademik.kurikulum.index'],
    ['label' => 'Mata Kuliah', 'route' => 'akademik.matakuliah.index'],
    ['label' => 'Kelas', 'route' => 'akademik.kelas.index'],
];

$perkuliahan = [
    ['label' => 'KRS Umum', 'route' => 'krs.index'],
    ['label' => 'Data Mahasiswa', 'route' => 'mahasiswa.index'],
    ['label' => 'Data Dosen', 'route' => 'dosen.index'],
    ['label' => 'Relasi Dosen', 'route' => 'dosen.relasi.index'],
    ['label' => 'Input Nilai', 'route' => 'dosen.nilai'],
];

$pmb = [
    ['label' => 'Form Pendaftaran PMB', 'route' => 'pmb.index'],
    ['label' => 'Pembayaran PMB', 'route' => 'pmb.payment'],
];

$pmbManage = array_merge($pmb, [
    ['label' => 'Verifikasi PMB', 'route' => 'pmb.verification.index'],
]);

$keuangan = [
    ['label' => 'Dashboard Keuangan', 'route' => 'keuangan.index'],
    ['label' => 'Tagihan', 'route' => 'keuangan.tagihan'],
    ['label' => 'Transaksi', 'route' => 'keuangan.transaksi'],
    ['label' => 'Jenis Pembayaran', 'route' => 'keuangan.jenis-pembayaran'],
    ['label' => 'Setup Tarif', 'route' => 'keuangan.setup.index'],
];

$keuanganSuperadmin = array_merge($keuangan, [
    ['label' => 'Payment Gateway', 'route' => 'settings.payment-gateway.index'],
    ['label' => 'Closing / Period Lock', 'route' => 'settings.finance-period-locks.index'],
    ['label' => 'Rekonsiliasi Gateway', 'route' => 'settings.finance-reconciliation.index'],
]);

$laporan = [
    ['label' => 'Laporan', 'route' => 'laporan.index'],
];

$sistem = [
    ['label' => 'Notifikasi', 'route' => 'notifications.index'],
];

$website = [
    ['label' => 'Preview Website', 'route' => 'landing.index'],
    ['label' => 'Landing Page Builder', 'route' => 'settings.landing-page.index'],
];

$superAdminExtras = [
    ['label' => 'Manajemen User & Akses', 'route' => 'settings.user-access.index'],
    ['label' => 'Maintenance Database', 'route' => 'settings.database.index'],
    ['label' => 'Pengaturan', 'route' => 'settings.index'],
];

return [
    'super-admin' => array_merge($dashboard, [
        ['group' => 'Master Akademik', 'items' => $masterAkademik],
        ['group' => 'Perkuliahan', 'items' => $perkuliahan],
        ['group' => 'Website Kampus', 'items' => $website],
        ['group' => 'PMB', 'items' => $pmbManage],
        ['group' => 'Keuangan', 'items' => $keuanganSuperadmin],
        ['group' => 'Laporan', 'items' => $laporan],
        ['group' => 'Sistem & Akses', 'items' => array_merge($sistem, $superAdminExtras)],
    ]),
    'baak' => array_merge($dashboard, [
        ['group' => 'Master Akademik', 'items' => $masterAkademik],
        ['group' => 'Perkuliahan', 'items' => [
            ['label' => 'KRS Umum', 'route' => 'krs.index'],
            ['label' => 'Data Mahasiswa', 'route' => 'mahasiswa.index'],
            ['label' => 'Data Dosen', 'route' => 'dosen.index'],
            ['label' => 'Relasi Dosen', 'route' => 'dosen.relasi.index'],
        ]],
        ['group' => 'PMB', 'items' => $pmbManage],
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
    'admin' => array_merge($dashboard, [
        ['group' => 'Master Akademik', 'items' => $masterAkademik],
        ['group' => 'Perkuliahan', 'items' => [
            ['label' => 'KRS Umum', 'route' => 'krs.index'],
            ['label' => 'Data Mahasiswa', 'route' => 'mahasiswa.index'],
            ['label' => 'Data Dosen', 'route' => 'dosen.index'],
            ['label' => 'Relasi Dosen', 'route' => 'dosen.relasi.index'],
        ]],
        ['group' => 'Website Kampus', 'items' => $website],
        ['group' => 'PMB', 'items' => $pmbManage],
        ['group' => 'Keuangan', 'items' => $keuangan],
        ['group' => 'Laporan', 'items' => $laporan],
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
    'operator' => array_merge($dashboard, [
        ['group' => 'Master Akademik', 'items' => $masterAkademik],
        ['group' => 'Perkuliahan', 'items' => [
            ['label' => 'KRS Umum', 'route' => 'krs.index'],
            ['label' => 'Data Mahasiswa', 'route' => 'mahasiswa.index'],
            ['label' => 'Data Dosen', 'route' => 'dosen.index'],
        ]],
        ['group' => 'PMB', 'items' => [
            ['label' => 'Form Pendaftaran PMB', 'route' => 'pmb.index'],
            ['label' => 'Verifikasi PMB', 'route' => 'pmb.verification.index'],
        ]],
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
    'bendahara' => array_merge($dashboard, [
        ['group' => 'Keuangan', 'items' => $keuangan],
        ['group' => 'Laporan', 'items' => $laporan],
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
    'staff' => array_merge($dashboard, [
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
    'dosen' => array_merge($dashboard, [
        ['group' => 'Perkuliahan Dosen', 'items' => [
            ['label' => 'Jadwal Mengajar', 'route' => 'dosen.jadwal'],
            ['label' => 'Input Nilai', 'route' => 'dosen.nilai'],
        ]],
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
    'mahasiswa' => array_merge($dashboard, [
        ['group' => 'PMB Saya', 'items' => $pmb],
        ['group' => 'Akademik Saya', 'items' => [
            ['label' => 'KRS', 'route' => 'mahasiswa.krs'],
            ['label' => 'KHS', 'route' => 'mahasiswa.khs'],
            ['label' => 'Transkrip', 'route' => 'mahasiswa.transkrip'],
            ['label' => 'Tagihan', 'route' => 'mahasiswa.tagihan'],
        ]],
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
    'keuangan' => array_merge($dashboard, [
        ['group' => 'Keuangan', 'items' => [
            ['label' => 'Tagihan', 'route' => 'keuangan.tagihan'],
            ['label' => 'Transaksi', 'route' => 'keuangan.transaksi'],
            ['label' => 'Jenis Pembayaran', 'route' => 'keuangan.jenis-pembayaran'],
        ]],
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
    'calon-mahasiswa' => array_merge($dashboard, [
        ['group' => 'PMB Saya', 'items' => $pmb],
        ['group' => 'Sistem', 'items' => $sistem],
    ]),
];
