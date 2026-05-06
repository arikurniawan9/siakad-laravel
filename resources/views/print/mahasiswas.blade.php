<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Data Mahasiswa</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #0f172a; }
        h1 { font-size: 18px; margin: 0 0 6px; }
        .meta { margin-bottom: 14px; color: #475569; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
        th { background: #e2e8f0; text-align: left; }
    </style>
</head>
<body>
    <h1>Data Mahasiswa</h1>
    <div class="meta">
        Search: {{ $filters['search'] ?: '-' }} |
        Status: {{ $filters['status'] ?: 'all' }} |
        Prodi: {{ $filters['prodi_id'] ?: 'all' }}
    </div>

    <table>
        <thead>
            <tr>
                <th>NIM</th>
                <th>NISN</th>
                <th>Nama</th>
                <th>Prodi</th>
                <th>Angkatan</th>
                <th>Status</th>
                <th>Email</th>
                <th>Phone</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row->nim }}</td>
                    <td>{{ $row->nisn ?: '-' }}</td>
                    <td>{{ $row->nama }}</td>
                    <td>{{ $row->prodi?->nama ?: '-' }}</td>
                    <td>{{ $row->angkatan }}</td>
                    <td>{{ $row->status_mahasiswa }}</td>
                    <td>{{ $row->email ?: '-' }}</td>
                    <td>{{ $row->phone ?: '-' }}</td>
                </tr>
            @empty
                <tr><td colspan="8">Tidak ada data.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
