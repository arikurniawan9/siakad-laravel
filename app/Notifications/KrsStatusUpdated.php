<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class KrsStatusUpdated extends Notification
{
    use Queueable;

    public function __construct(
        public int $krsId,
        public string $status,
        public string $tahunAkademik,
        public int $semesterAkademik,
        public int $totalSks
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $actionLabel = match ($this->status) {
            'draft' => 'Lihat Draft',
            'submitted' => 'Lihat Pengajuan',
            'approved' => 'Lihat Disetujui',
            'rejected' => 'Perbaiki KRS',
            default => 'Buka KRS',
        };

        return [
            'title' => match ($this->status) {
                'draft' => 'KRS berhasil disimpan',
                'submitted' => 'KRS berhasil disubmit',
                'approved' => 'KRS disetujui',
                'rejected' => 'KRS ditolak',
                default => 'Status KRS diperbarui',
            },
            'module' => 'krs',
            'module_label' => 'KRS',
            'status' => $this->status,
            'tahun_akademik' => $this->tahunAkademik,
            'semester_akademik' => $this->semesterAkademik,
            'total_sks' => $this->totalSks,
            'action_route' => 'krs.show',
            'action_url' => route('krs.show', $this->krsId),
            'action_label' => $actionLabel,
            'message' => match ($this->status) {
                'draft' => 'KRS Anda untuk '.$this->tahunAkademik.' semester '.$this->semesterAkademik.' berhasil disimpan.',
                'submitted' => 'KRS Anda untuk '.$this->tahunAkademik.' semester '.$this->semesterAkademik.' sudah disubmit dan menunggu verifikasi.',
                'approved' => 'KRS Anda untuk '.$this->tahunAkademik.' semester '.$this->semesterAkademik.' sudah disetujui.',
                'rejected' => 'KRS Anda untuk '.$this->tahunAkademik.' semester '.$this->semesterAkademik.' ditolak dan perlu diperbaiki.',
                default => 'KRS Anda untuk '.$this->tahunAkademik.' semester '.$this->semesterAkademik.' kini berstatus '.$this->status.'.',
            },
        ];
    }
}
