<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PmbVerificationChanged extends Notification
{
    use Queueable;

    public function __construct(
        public string $nomorPendaftaran,
        public string $namaLengkap,
        public string $statusSebelumnya,
        public string $statusBaru,
        public string $prodi,
        public ?string $catatan = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $title = match ($this->statusBaru) {
            'verified' => 'PMB berhasil diverifikasi',
            'rejected' => 'PMB ditolak',
            default => 'Status PMB diperbarui',
        };

        $actionLabel = match ($this->statusBaru) {
            'verified' => 'Lihat PMB',
            'rejected' => 'Perbaiki Data',
            default => 'Buka PMB',
        };

        $message = match ($this->statusBaru) {
            'verified' => 'Pendaftaran PMB '.$this->nomorPendaftaran.' atas nama '.$this->namaLengkap.' untuk prodi '.$this->prodi.' telah diverifikasi.',
            'rejected' => 'Pendaftaran PMB '.$this->nomorPendaftaran.' atas nama '.$this->namaLengkap.' ditolak. Silakan periksa kembali kelengkapan data.',
            default => 'Status verifikasi PMB '.$this->nomorPendaftaran.' atas nama '.$this->namaLengkap.' telah diperbarui.',
        };

        return [
            'title' => $title,
            'module' => 'pmb',
            'module_label' => 'PMB',
            'status' => $this->statusBaru,
            'status_sebelumnya' => $this->statusSebelumnya,
            'nomor_pendaftaran' => $this->nomorPendaftaran,
            'nama_lengkap' => $this->namaLengkap,
            'prodi' => $this->prodi,
            'catatan' => $this->catatan,
            'action_route' => 'pmb.index',
            'action_label' => $actionLabel,
            'message' => $message,
        ];
    }
}
