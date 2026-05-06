<?php

namespace App\Http\Controllers;

use App\Models\Dosen;
use App\Models\Krs;
use App\Models\Mahasiswa;
use App\Models\Pmb;
use App\Models\Tagihan;
use App\Models\TahunAkademik;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;
use Inertia\Response;

class LaporanController extends Controller
{
    public function index(): Response
    {
        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();

        $stats = [
            'mahasiswa' => Mahasiswa::query()->count(),
            'dosen' => Dosen::query()->count(),
            'krs_pending' => Krs::query()->where('status', 'submitted')->count(),
            'krs_approved' => Krs::query()->where('status', 'approved')->count(),
            'tagihan_pending' => Tagihan::query()->whereIn('status', ['pending', 'partial'])->count(),
            'tagihan_paid' => Tagihan::query()->where('status', 'paid')->count(),
            'nominal_pending' => (float) Tagihan::query()->whereIn('status', ['pending', 'partial'])->sum('total'),
            'nominal_paid' => (float) Tagihan::query()->where('status', 'paid')->sum('total'),
            'pmb_total' => Pmb::query()->count(),
            'pmb_verified' => Pmb::query()->where('status_verifikasi', 'verified')->count(),
        ];

        $recentKrs = Krs::query()
            ->with('mahasiswa:id,nim,nama')
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (Krs $krs) => [
                'id' => $krs->id,
                'mahasiswa' => $krs->mahasiswa?->nama,
                'nim' => $krs->mahasiswa?->nim,
                'tahun_akademik' => $krs->tahun_akademik,
                'semester_akademik' => $krs->semester_akademik,
                'status' => $krs->status,
                'total_sks' => (int) $krs->total_sks,
            ])
            ->values();

        $recentTagihan = Tagihan::query()
            ->with('mahasiswa:id,nim,nama')
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (Tagihan $tagihan) => [
                'id' => $tagihan->id,
                'kode_tagihan' => $tagihan->kode_tagihan,
                'mahasiswa' => $tagihan->mahasiswa?->nama,
                'nim' => $tagihan->mahasiswa?->nim,
                'jenis' => $tagihan->jenis,
                'status' => $tagihan->status,
                'total' => (float) $tagihan->total,
            ])
            ->values();

        return Inertia::render('Modules/Laporan/Index', [
            'tahunAktif' => $tahunAktif ? [
                'kode' => $tahunAktif->kode,
                'semester_aktif' => $tahunAktif->semester_aktif,
            ] : null,
            'stats' => $stats,
            'recentKrs' => $recentKrs,
            'recentTagihan' => $recentTagihan,
        ]);
    }

    public function exportPdf()
    {
        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();

        $stats = [
            'mahasiswa' => Mahasiswa::query()->count(),
            'dosen' => Dosen::query()->count(),
            'krs_pending' => Krs::query()->where('status', 'submitted')->count(),
            'krs_approved' => Krs::query()->where('status', 'approved')->count(),
            'tagihan_pending' => Tagihan::query()->whereIn('status', ['pending', 'partial'])->count(),
            'tagihan_paid' => Tagihan::query()->where('status', 'paid')->count(),
            'nominal_pending' => (float) Tagihan::query()->whereIn('status', ['pending', 'partial'])->sum('total'),
            'nominal_paid' => (float) Tagihan::query()->where('status', 'paid')->sum('total'),
            'pmb_total' => Pmb::query()->count(),
            'pmb_verified' => Pmb::query()->where('status_verifikasi', 'verified')->count(),
        ];

        $recentKrs = Krs::query()
            ->with('mahasiswa:id,nim,nama')
            ->latest('id')
            ->limit(10)
            ->get();

        $recentTagihan = Tagihan::query()
            ->with('mahasiswa:id,nim,nama')
            ->latest('id')
            ->limit(10)
            ->get();

        $pdf = Pdf::loadView('print.laporan', [
            'tahunAktif' => $tahunAktif,
            'stats' => $stats,
            'recentKrs' => $recentKrs,
            'recentTagihan' => $recentTagihan,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('Laporan-Sistem.pdf');
    }
}
