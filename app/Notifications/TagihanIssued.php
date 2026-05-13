<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class TagihanIssued extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public string $kodeTagihan,
        public string $jenis,
        public string $namaMahasiswa,
        public float $total
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
        return [
            'title' => 'Tagihan baru diterbitkan',
            'module' => 'finance',
            'module_label' => 'Keuangan',
            'status' => 'pending',
            'kode_tagihan' => $this->kodeTagihan,
            'jenis' => $this->jenis,
            'nama_mahasiswa' => $this->namaMahasiswa,
            'total' => $this->total,
            'action_route' => 'mahasiswa.tagihan',
            'action_url' => route('mahasiswa.tagihan', ['search' => $this->kodeTagihan]),
            'action_label' => 'Lihat Tagihan',
            'message' => 'Tagihan '.$this->kodeTagihan.' untuk '.$this->namaMahasiswa.' telah diterbitkan dengan total Rp '.number_format($this->total, 0, ',', '.').'.',
        ];
    }
}
