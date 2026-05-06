<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DosenUpdated extends Notification
{
    use Queueable;

    public function __construct(
        public string $namaDosen,
        public string $type,
        public string $before,
        public string $after,
        public ?string $prodi = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $isStatus = $this->type === 'status';
        $label = $isStatus ? 'Status dosen diperbarui' : 'Relasi dosen diperbarui';
        $statusLabel = match ($this->after) {
            'tetap' => 'Tetap',
            'tidak_tetap' => 'Tidak Tetap',
            'luar_biasa' => 'Luar Biasa',
            default => $this->after,
        };

        return [
            'title' => $label,
            'module' => 'dosen',
            'module_label' => 'Dosen',
            'status' => $this->after,
            'nama_dosen' => $this->namaDosen,
            'before' => $this->before,
            'after' => $this->after,
            'prodi' => $this->prodi,
            'action_route' => 'dashboard',
            'action_label' => 'Buka Dashboard',
            'message' => $isStatus
                ? 'Status dosen '.$this->namaDosen.' diubah dari '.$this->before.' menjadi '.$statusLabel.'.'
                : 'Relasi prodi dosen '.$this->namaDosen.' diubah dari '.$this->before.' menjadi '.$this->after.'.',
        ];
    }
}
