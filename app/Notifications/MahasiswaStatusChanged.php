<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class MahasiswaStatusChanged extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public string $namaMahasiswa,
        public string $statusSebelumnya,
        public string $statusBaru,
        public ?string $prodi = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'data' => $this->toArray($notifiable),
            'read_at' => null,
            'created_at' => now()->toDateTimeString(),
        ]);
    }

    public function toArray(object $notifiable): array
    {
        $statusLabel = match ($this->statusBaru) {
            'aktif' => 'Aktif',
            'cuti' => 'Cuti',
            'lulus' => 'Lulus',
            'dropout' => 'Dropout',
            'nonaktif' => 'Nonaktif',
            default => ucfirst($this->statusBaru),
        };

        return [
            'title' => 'Status mahasiswa diperbarui',
            'module' => 'mahasiswa',
            'module_label' => 'Mahasiswa',
            'status' => $this->statusBaru,
            'nama_mahasiswa' => $this->namaMahasiswa,
            'status_sebelumnya' => $this->statusSebelumnya,
            'prodi' => $this->prodi,
            'action_route' => 'dashboard',
            'action_label' => 'Buka Dashboard',
            'message' => 'Status '.$this->namaMahasiswa.' diubah dari '.$this->statusSebelumnya.' menjadi '.$statusLabel.'.',
        ];
    }
}
