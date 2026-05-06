<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>KHS {{ $mahasiswa['nim'] ?? '' }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; font-size: 12px; }
        h1 { margin: 0; font-size: 18px; }
        .muted { color: #64748b; }
        .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 12px; background: #f8fafc; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        .semester { margin-top: 18px; page-break-inside: avoid; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
        th { background: #f1f5f9; }
        .badge { display: inline-block; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 700; }
        .badge-final { background: #dcfce7; color: #15803d; }
        .badge-sementara { background: #fef3c7; color: #b45309; }
        .badge-belum { background: #e2e8f0; color: #64748b; }
        .section-note { margin-top: 10px; padding: 8px 10px; border: 1px dashed #cbd5e1; border-radius: 10px; background: #fff7ed; color: #9a3412; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <h1>Kartu Hasil Studi</h1>
    <p class="muted">Rekap nilai final dari KRS yang telah dipublish</p>

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
            <p class="muted">Total SKS Lulus</p>
            <p><strong>{{ $ringkasan['total_sks_lulus'] ?? 0 }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">Total Semester</p>
            <p><strong>{{ $ringkasan['total_semester'] ?? 0 }}</strong></p>
        </div>
        <div class="card">
            <p class="muted">Semester Terakhir</p>
            <p><strong>{{ $ringkasan['semester_terakhir']['label'] ?? '-' }}</strong></p>
        </div>
    </div>

    @if(!empty($ringkasan['semester_terakhir']))
        <div class="section-note">
            Semester terakhir: {{ $ringkasan['semester_terakhir']['label'] ?? '-' }} dengan IPS {{ $ringkasan['semester_terakhir']['ips'] ?? '-' }} dan {{ $ringkasan['semester_terakhir']['sks'] ?? 0 }} SKS.
        </div>
    @endif

    @foreach($semesterRecords as $semester)
        <div class="semester">
            <div class="card">
                <strong>{{ $semester['tahun_akademik'] }}</strong><br>
                Semester {{ $semester['semester_akademik'] }} | IPS {{ $semester['ips'] ?? '-' }} | {{ $semester['semester_sks'] ?? 0 }} SKS
            </div>

            <p style="margin: 8px 0 0 0;">
                <span class="badge badge-final">Final: {{ $semester['sudah_final'] ?? 0 }}</span>
                <span class="badge badge-sementara">Sementara: {{ $semester['sementara'] ?? 0 }}</span>
                <span class="badge badge-belum">Belum Input: {{ $semester['belum_input'] ?? 0 }}</span>
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Kode</th>
                        <th>Mata Kuliah</th>
                        <th>SKS</th>
                        <th>Dosen</th>
                        <th>Nilai</th>
                        <th>Bobot</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($semester['rows'] as $row)
                        <tr>
                            <td>{{ $row['kode'] ?? '-' }}</td>
                            <td>{{ $row['nama'] ?? '-' }}</td>
                            <td>{{ $row['sks'] ?? 0 }}</td>
                            <td>{{ $row['dosen'] ?? '-' }}</td>
                            <td>{{ $row['nilai_huruf'] ?? '-' }}</td>
                            <td>{{ $row['bobot'] ?? '-' }}</td>
                            <td>
                                @if(($row['status_nilai'] ?? '') === 'final')
                                    Final
                                @elseif(($row['status_nilai'] ?? '') === 'sementara')
                                    Sementara
                                @else
                                    Belum Input
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7">Tidak ada data.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    @endforeach

    <div class="no-print" style="margin-top: 14px;">
        <button onclick="window.print()">Print / Save as PDF</button>
    </div>
</body>
</html>
