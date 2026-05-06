<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Transkrip {{ $mahasiswa['nim'] ?? '' }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; font-size: 12px; }
        h1 { margin: 0; font-size: 18px; }
        .muted { color: #64748b; }
        .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; background: #f8fafc; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
        th { background: #f1f5f9; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <h1>Transkrip Nilai</h1>
    <p class="muted">Gabungan seluruh mata kuliah dengan nilai final</p>

    <div class="card" style="margin-top: 12px;">
        <p><strong>NIM:</strong> {{ $mahasiswa['nim'] ?? '-' }}</p>
        <p><strong>Nama:</strong> {{ $mahasiswa['nama'] ?? '-' }}</p>
        <p><strong>Prodi:</strong> {{ $mahasiswa['prodi'] ?? '-' }}</p>
        <p><strong>Angkatan:</strong> {{ $mahasiswa['angkatan'] ?? '-' }}</p>
    </div>

    <div class="summary">
        <div class="card">
            <p class="muted">IPK</p>
            <p><strong>{{ $ringkasan['ipk'] ?? '-' }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">Total SKS</p>
            <p><strong>{{ $ringkasan['total_sks'] ?? 0 }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">Total MK Final</p>
            <p><strong>{{ $ringkasan['total_matkul'] ?? 0 }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">Semester</p>
            <p><strong>{{ $ringkasan['total_semester'] ?? 0 }}</strong></p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Semester</th>
                <th>Kode</th>
                <th>Mata Kuliah</th>
                <th>SKS</th>
                <th>Nilai</th>
                <th>Bobot</th>
                <th>Dosen</th>
                <th>Ruang</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row['semester'] ?? '-' }}</td>
                    <td>{{ $row['kode'] ?? '-' }}</td>
                    <td>{{ $row['nama'] ?? '-' }}</td>
                    <td>{{ $row['sks'] ?? 0 }}</td>
                    <td>{{ $row['nilai_huruf'] ?? '-' }}</td>
                    <td>{{ $row['bobot'] ?? '-' }}</td>
                    <td>{{ $row['dosen'] ?? '-' }}</td>
                    <td>{{ $row['ruang'] ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8">Belum ada nilai final.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="no-print" style="margin-top: 14px;">
        <button onclick="window.print()">Print / Save as PDF</button>
    </div>
</body>
</html>
