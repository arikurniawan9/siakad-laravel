<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>KRS {{ $krs->mahasiswa->nim ?? '' }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; font-size: 12px; }
        .watermark {
            position: fixed;
            top: 35%;
            left: 12%;
            width: 76%;
            text-align: center;
            font-size: 62px;
            color: rgba(15, 23, 42, 0.06);
            transform: rotate(-20deg);
            z-index: -1;
            font-weight: 700;
            letter-spacing: 4px;
        }
        h1 { margin: 0; font-size: 18px; }
        .muted { color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
        th { background: #f1f5f9; }
        .meta { margin-top: 10px; }
        .meta p { margin: 4px 0; }
        .actions { margin-top: 12px; }
        @media print { .actions { display:none; } }
    </style>
</head>
<body>
    <div class="watermark">SIAKAD STAI AL ITTIHAD</div>
    <h1>Kartu Rencana Studi</h1>
    <p class="muted">{{ $krs->tahun_akademik }} • Semester {{ $krs->semester_akademik }}</p>

    <div class="meta">
        <p><strong>NIM:</strong> {{ $krs->mahasiswa->nim ?? '-' }}</p>
        <p><strong>Nama:</strong> {{ $krs->mahasiswa->nama ?? '-' }}</p>
        <p><strong>Prodi:</strong> {{ $krs->mahasiswa->prodi->nama ?? '-' }}</p>
        <p><strong>Status:</strong> {{ $krs->status }}</p>
        <p><strong>SKS Ternilai Semester:</strong> {{ $academicSummary['semester_sks_ternilai'] ?? 0 }}</p>
        <p><strong>IPS Sementara:</strong> {{ $academicSummary['ips_sementara'] ?? '-' }}</p>
        <p><strong>SKS Kumulatif Lulus:</strong> {{ $academicSummary['total_sks_lulus'] ?? 0 }}</p>
        <p><strong>IPK Sementara:</strong> {{ $academicSummary['ipk_sementara'] ?? '-' }}</p>
        <p><strong>Nilai Final:</strong> {{ $academicSummary['nilai_final_count'] ?? 0 }}</p>
        <p><strong>Nilai Sementara:</strong> {{ $academicSummary['nilai_sementara_count'] ?? 0 }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Kode</th>
                <th>Mata Kuliah</th>
                <th>SKS</th>
                <th>Dosen</th>
                <th>Ruang</th>
                <th>Status Nilai</th>
            </tr>
        </thead>
        <tbody>
            @forelse($krs->details as $i => $d)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $d->kelas->mataKuliah->kode ?? '-' }}</td>
                    <td>{{ $d->kelas->mataKuliah->nama ?? '-' }}</td>
                    <td>{{ $d->sks }}</td>
                    <td>{{ $d->kelas->dosen->nama ?? '-' }}</td>
                    <td>{{ $d->kelas->ruanganRef->nama ?? $d->kelas->ruangan ?? '-' }}</td>
                    <td>
                        @if(empty($d->nilai))
                            Belum Input
                        @elseif(!empty($d->nilai->published_at))
                            Final
                        @else
                            Sementara
                        @endif
                    </td>
                </tr>
            @empty
                <tr><td colspan="7">Tidak ada detail KRS.</td></tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3"><strong>Total SKS</strong></td>
                <td><strong>{{ $krs->total_sks }}</strong></td>
                <td colspan="3"></td>
            </tr>
        </tfoot>
    </table>

    <div class="meta">
        <p><strong>Approved by:</strong> {{ $krs->approvedByUser->name ?? '-' }} ({{ $krs->approved_at ?? '-' }})</p>
        <p><strong>Rejected by:</strong> {{ $krs->rejectedByUser->name ?? '-' }} ({{ $krs->rejected_at ?? '-' }})</p>
    </div>

    <div class="meta">
        <p><strong>Link Verifikasi:</strong> {{ $verifyUrl ?? '-' }}</p>
        <p><strong>Document Hash:</strong> {{ $docHash ?? '-' }}</p>
        @if(!empty($qrSvg))
            {!! $qrSvg !!}
        @endif
    </div>

    <div class="actions">
        <button onclick="window.print()">Print / Save as PDF</button>
    </div>
</body>
</html>
