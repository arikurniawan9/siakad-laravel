<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Data Tagihan</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #0f172a; }
        h1 { font-size: 18px; margin: 0 0 6px; }
        .meta { margin-bottom: 14px; color: #475569; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
        th { background: #e2e8f0; text-align: left; }
    </style>
</head>
<body>
    <h1>Data Tagihan</h1>
    <div class="meta">
        Search: {{ $filters['search'] ?: '-' }} |
        Status: {{ $filters['status'] ?: 'all' }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Mahasiswa</th>
                <th>Jenis</th>
                <th>Periode</th>
                <th>Nominal</th>
                <th>Potongan</th>
                <th>Denda</th>
                <th>Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row->kode_tagihan }}</td>
                    <td>{{ $row->mahasiswa?->nim }} - {{ $row->mahasiswa?->nama }}</td>
                    <td>{{ $row->jenis }}</td>
                    <td>{{ $row->tahun_akademik ?: '-' }} / {{ $row->semester_akademik ?: '-' }}</td>
                    <td>{{ number_format((float) $row->nominal, 0, ',', '.') }}</td>
                    <td>{{ number_format((float) $row->potongan, 0, ',', '.') }}</td>
                    <td>{{ number_format((float) $row->denda, 0, ',', '.') }}</td>
                    <td>{{ number_format((float) $row->total, 0, ',', '.') }}</td>
                    <td>{{ $row->status }}</td>
                </tr>
            @empty
                <tr><td colspan="9">Tidak ada data.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
