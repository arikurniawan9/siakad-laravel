<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Nilai {{ $kelas['kode_kelas'] ?? '' }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; font-size: 12px; }
        h1 { margin: 0; font-size: 18px; }
        .muted { color: #64748b; }
        .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; background: #f8fafc; }
        .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
        th { background: #f1f5f9; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <h1>Rekap Nilai Kelas</h1>
    <p class="muted">Dokumen arsip penilaian kelas</p>

    <div class="card" style="margin-top: 12px;">
        <p><strong>Kode Kelas:</strong> {{ $kelas['kode_kelas'] ?? '-' }}</p>
        <p><strong>Mata Kuliah:</strong> {{ $kelas['mata_kuliah']['kode'] ?? '-' }} - {{ $kelas['mata_kuliah']['nama'] ?? '-' }}</p>
        <p><strong>Dosen:</strong> {{ $kelas['dosen'] ?? '-' }}</p>
        <p><strong>Ruang:</strong> {{ $kelas['ruangan'] ?? '-' }}</p>
        <p><strong>Tahun Akademik:</strong> {{ $kelas['tahun_akademik'] ?? '-' }} | <strong>Semester:</strong> {{ $kelas['semester_akademik'] ?? '-' }}</p>
    </div>

    <div class="summary">
        <div class="card">
            <p class="muted">Mahasiswa</p>
            <p><strong>{{ $ringkasan['total_mahasiswa'] ?? 0 }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">Final</p>
            <p><strong>{{ $ringkasan['sudah_final'] ?? 0 }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">Draft</p>
            <p><strong>{{ $ringkasan['draft'] ?? 0 }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">Belum Input</p>
            <p><strong>{{ $ringkasan['belum_input'] ?? 0 }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">IPK Kelas</p>
            <p><strong>{{ $ringkasan['ipk_kelas'] ?? '-' }}</strong></p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>NIM</th>
                <th>Mahasiswa</th>
                <th>Prodi</th>
                <th>SKS</th>
                <th>Nilai Angka</th>
                <th>Huruf</th>
                <th>Bobot</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row['nim'] ?? '-' }}</td>
                    <td>{{ $row['mahasiswa'] ?? '-' }}</td>
                    <td>{{ $row['prodi'] ?? '-' }}</td>
                    <td>{{ $row['sks'] ?? 0 }}</td>
                    <td>{{ $row['nilai_angka'] ?? '-' }}</td>
                    <td>{{ $row['nilai_huruf'] ?? '-' }}</td>
                    <td>{{ $row['bobot'] ?? '-' }}</td>
                    <td>{{ $row['status'] ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8">Belum ada data nilai.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="no-print" style="margin-top: 14px;">
        <button onclick="window.print()">Print / Save as PDF</button>
    </div>
</body>
</html>
