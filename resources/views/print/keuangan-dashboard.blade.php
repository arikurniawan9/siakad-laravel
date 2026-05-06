<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Dashboard Keuangan</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #0f172a; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        h2 { font-size: 13px; margin: 18px 0 8px; }
        .meta { margin-bottom: 12px; color: #475569; font-size: 10px; }
        .grid { width: 100%; border-collapse: collapse; }
        .grid td { vertical-align: top; padding: 4px; }
        .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; }
        .label { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; }
        .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th, td { border: 1px solid #cbd5e1; padding: 5px; vertical-align: top; }
        th { background: #e2e8f0; text-align: left; }
    </style>
</head>
<body>
    <h1>Dashboard Keuangan</h1>
    <div class="meta">
        Snapshot ringkasan tagihan dan transaksi pembayaran akademik.
    </div>

    <table class="grid">
        <tr>
            <td><div class="card"><div class="label">Total Tagihan</div><div class="value">{{ $stats['total_tagihan'] }}</div></div></td>
            <td><div class="card"><div class="label">Tagihan Pending</div><div class="value">{{ $stats['pending'] }}</div></div></td>
            <td><div class="card"><div class="label">Tagihan Lunas</div><div class="value">{{ $stats['paid'] }}</div></div></td>
            <td><div class="card"><div class="label">Transaksi Success</div><div class="value">{{ $transactionStats['success'] }}</div></div></td>
        </tr>
        <tr>
            <td><div class="card"><div class="label">Nominal Pending</div><div class="value">{{ number_format((float) $stats['nominal_pending'], 0, ',', '.') }}</div></div></td>
            <td><div class="card"><div class="label">Nominal Lunas</div><div class="value">{{ number_format((float) $stats['nominal_paid'], 0, ',', '.') }}</div></div></td>
            <td><div class="card"><div class="label">Transaksi Pending</div><div class="value">{{ $transactionStats['pending'] }}</div></div></td>
            <td><div class="card"><div class="label">Transaksi Failed</div><div class="value">{{ $transactionStats['failed'] }}</div></div></td>
        </tr>
    </table>

    <h2>Tagihan Pending Terbaru</h2>
    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Mahasiswa</th>
                <th>Jenis</th>
                <th>Periode</th>
                <th>Total</th>
                <th>Transaksi</th>
            </tr>
        </thead>
        <tbody>
            @forelse($recentTagihans as $row)
                <tr>
                    <td>{{ $row->kode_tagihan }}</td>
                    <td>{{ $row->mahasiswa?->nim }} - {{ $row->mahasiswa?->nama }}</td>
                    <td>{{ $row->jenis }}</td>
                    <td>{{ $row->tahun_akademik ?: '-' }} / {{ $row->semester_akademik ?: '-' }}</td>
                    <td>{{ number_format((float) $row->total, 0, ',', '.') }}</td>
                    <td>{{ $row->transaksis_count }}</td>
                </tr>
            @empty
                <tr><td colspan="6">Tidak ada tagihan pending.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Transaksi Terbaru</h2>
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
            @forelse($recentTransaksis as $row)
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
                <tr><td colspan="7">Tidak ada transaksi.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
