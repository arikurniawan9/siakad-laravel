<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Sistem</title>
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
    <h1>Laporan Sistem</h1>
    <div class="meta">
        Snapshot operasional akademik dan keuangan.
        @if($tahunAktif)
            | Tahun Aktif: {{ $tahunAktif->kode }} / Smt {{ $tahunAktif->semester_aktif }}
        @endif
    </div>

    <table class="grid">
        <tr>
            <td><div class="card"><div class="label">Mahasiswa</div><div class="value">{{ $stats['mahasiswa'] }}</div></div></td>
            <td><div class="card"><div class="label">Dosen</div><div class="value">{{ $stats['dosen'] }}</div></div></td>
            <td><div class="card"><div class="label">KRS Approved</div><div class="value">{{ $stats['krs_approved'] }}</div></div></td>
            <td><div class="card"><div class="label">Tagihan Paid</div><div class="value">{{ $stats['tagihan_paid'] }}</div></div></td>
        </tr>
        <tr>
            <td><div class="card"><div class="label">KRS Pending</div><div class="value">{{ $stats['krs_pending'] }}</div></div></td>
            <td><div class="card"><div class="label">Tagihan Pending</div><div class="value">{{ $stats['tagihan_pending'] }}</div></div></td>
            <td><div class="card"><div class="label">Nominal Pending</div><div class="value">{{ number_format((float) $stats['nominal_pending'], 0, ',', '.') }}</div></div></td>
            <td><div class="card"><div class="label">Nominal Paid</div><div class="value">{{ number_format((float) $stats['nominal_paid'], 0, ',', '.') }}</div></div></td>
        </tr>
    </table>

    <h2>KRS Terbaru</h2>
    <table>
        <thead>
            <tr>
                <th>Mahasiswa</th>
                <th>Periode</th>
                <th>SKS</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($recentKrs as $row)
                <tr>
                    <td>{{ $row->mahasiswa?->nim }} - {{ $row->mahasiswa?->nama }}</td>
                    <td>{{ $row->tahun_akademik }} / Smt {{ $row->semester_akademik }}</td>
                    <td>{{ $row->total_sks }}</td>
                    <td>{{ $row->status }}</td>
                </tr>
            @empty
                <tr><td colspan="4">Tidak ada data.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h2>Tagihan Terbaru</h2>
    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Mahasiswa</th>
                <th>Jenis</th>
                <th>Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($recentTagihan as $row)
                <tr>
                    <td>{{ $row->kode_tagihan }}</td>
                    <td>{{ $row->mahasiswa?->nim }} - {{ $row->mahasiswa?->nama }}</td>
                    <td>{{ $row->jenis }}</td>
                    <td>{{ number_format((float) $row->total, 0, ',', '.') }}</td>
                    <td>{{ $row->status }}</td>
                </tr>
            @empty
                <tr><td colspan="5">Tidak ada data.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
