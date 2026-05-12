<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Data Transaksi</title>
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
    <h1>Data Transaksi</h1>
    <div class="meta">
        Search: {{ $filters['search'] ?: '-' }} |
        Status: {{ $filters['status'] ?: 'all' }} |
        Rekonsiliasi: {{ $filters['reconciliation'] ?: 'all' }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Order ID</th>
                <th>Mahasiswa</th>
                <th>Invoice</th>
                <th>Metode</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Waktu</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row->order_id }}</td>
                    <td>{{ $row->tagihan?->mahasiswa?->nim }} - {{ $row->tagihan?->mahasiswa?->nama }}</td>
                    <td>{{ $row->tagihan?->kode_tagihan }} / {{ $row->tagihan?->jenis }}</td>
                    <td>{{ $row->payment_type ?: '-' }}</td>
                    <td>{{ number_format((float) $row->gross_amount, 0, ',', '.') }}</td>
                    <td>{{ $row->status }}</td>
                    <td>{{ optional($row->paid_at ?? $row->created_at)->format('d-m-Y H:i') }}</td>
                </tr>
            @empty
                <tr><td colspan="7">Tidak ada data.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
