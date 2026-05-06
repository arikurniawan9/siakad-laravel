<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Data KRS</title>
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
    <h1>Data KRS</h1>
    <div class="meta">
        Tahun Aktif: {{ $tahunAktif?->kode ?: '-' }} |
        Search: {{ $filters['search'] ?: '-' }} |
        Status: {{ $filters['status'] ?: 'all' }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Mahasiswa</th>
                <th>Periode</th>
                <th>Total SKS</th>
                <th>Status</th>
                <th>Detail Kelas</th>
                <th>Audit</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row->mahasiswa?->nim }} - {{ $row->mahasiswa?->nama }}</td>
                    <td>{{ $row->tahun_akademik }} / {{ $row->semester_akademik }}</td>
                    <td>{{ $row->total_sks }}</td>
                    <td>{{ $row->status }}</td>
                    <td>
                        @foreach($row->details as $detail)
                            {{ $detail->kelas?->mataKuliah?->kode ?: '-' }} {{ $detail->kelas?->mataKuliah?->nama ?: '' }} ({{ $detail->sks }} SKS)@if(!$loop->last) | @endif
                        @endforeach
                    </td>
                    <td>
                        @if($row->approvedByUser)
                            Approved by {{ $row->approvedByUser->name }} ({{ $row->approved_at }})
                        @else
                            Belum di-approve
                        @endif
                        @if($row->rejectedByUser)
                            <br>Rejected by {{ $row->rejectedByUser->name }} ({{ $row->rejected_at }})
                        @endif
                    </td>
                </tr>
            @empty
                <tr><td colspan="6">Tidak ada data.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
