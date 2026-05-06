<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PmbRegistered extends Notification
{
    use Queueable;

    public function __construct(
        public string $nomorPendaftaran,
        public string $namaLengkap
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pendaftaran PMB disimpan',
            'module' => 'pmb',
            'module_label' => 'PMB',
            'status' => 'draft',
            'nomor_pendaftaran' => $this->nomorPendaftaran,
            'nama_lengkap' => $this->namaLengkap,
            'action_route' => 'pmb.index',
            'action_label' => 'Buka PMB',
            'message' => 'Pendaftaran PMB atas nama '.$this->namaLengkap.' dengan nomor '.$this->nomorPendaftaran.' berhasil disimpan.',
        ];
    }
}
