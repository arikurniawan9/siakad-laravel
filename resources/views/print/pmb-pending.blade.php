<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>PMB Pending</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #0f172a; }
        h1 { font-size: 18px; margin: 0 0 6px; }
        .meta { margin-bottom: 14px; color: #475569; font-size: 10px; line-height: 1.5; }
        .summary { margin: 10px 0 14px; padding: 10px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 5px; vertical-align: top; }
        th { background: #e2e8f0; text-align: left; }
    </style>
</head>
<body>
    <h1>Daftar PMB Pending</h1>
    <div class="meta">
        Dicetak: {{ now()->format('d M Y H:i') }}<br>
        Search: {{ $filters['search'] ?: '-' }}<br>
        Status Verifikasi: {{ $filters['status'] ?: 'pending' }}<br>
        Status Pembayaran: {{ $filters['payment_status'] ?: 'all' }}
    </div>

    <div class="summary">
        Total pending yang diekspor: <strong>{{ $total }}</strong>
    </div>

    <table>
        <thead>
            <tr>
                <th>No. Pendaftaran</th>
                <th>Nama</th>
                <th>Prodi</th>
                <th>Gelombang</th>
                <th>Email</th>
                <th>HP</th>
                <th>Asal Sekolah</th>
                <th>Status Bayar</th>
                <th>Catatan</th>
                <th>Dibuat</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row->nomor_pendaftaran }}</td>
                    <td>{{ $row->nama_lengkap }}</td>
                    <td>{{ $row->prodi?->nama ? $row->prodi->nama.' ('.$row->prodi->jenjang.')' : '-' }}</td>
                    <td>{{ $row->gelombang }}</td>
                    <td>{{ $row->email ?: '-' }}</td>
                    <td>{{ $row->phone ?: '-' }}</td>
                    <td>{{ $row->asal_sekolah ?: '-' }}</td>
                    <td>{{ $row->status_pembayaran }}</td>
                    <td>{{ $row->catatan ?: '-' }}</td>
                    <td>{{ optional($row->created_at)->format('d M Y H:i') }}</td>
                </tr>
            @empty
                <tr><td colspan="10">Tidak ada data pending.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
