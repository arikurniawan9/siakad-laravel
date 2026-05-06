<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TagihanStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        public string $kodeTagihan,
        public string $namaMahasiswa,
        public string $statusSebelumnya,
        public string $statusBaru,
        public ?float $total = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $statusLabel = match ($this->statusBaru) {
            'pending' => 'Pending',
            'partial' => 'Partial',
            'paid' => 'Lunas',
            'cancelled' => 'Dibatalkan',
            default => ucfirst($this->statusBaru),
        };

        $title = match ($this->statusBaru) {
            'pending' => 'Tagihan masih pending',
            'partial' => 'Tagihan telah dibayar sebagian',
            'paid' => 'Tagihan telah lunas',
            'cancelled' => 'Tagihan dibatalkan',
            default => 'Status tagihan diperbarui',
        };

        $actionLabel = match ($this->statusBaru) {
            'partial' => 'Lanjut Bayar',
            'cancelled' => 'Cek Tagihan',
            default => 'Lihat Tagihan',
        };

        $message = match ($this->statusBaru) {
            'pending' => 'Tagihan '.$this->kodeTagihan.' untuk '.$this->namaMahasiswa.' masih menunggu pembayaran.',
            'partial' => 'Tagihan '.$this->kodeTagihan.' untuk '.$this->namaMahasiswa.' telah dibayar sebagian dan masih ada sisa tagihan.',
            'paid' => 'Tagihan '.$this->kodeTagihan.' untuk '.$this->namaMahasiswa.' telah lunas.',
            'cancelled' => 'Tagihan '.$this->kodeTagihan.' untuk '.$this->namaMahasiswa.' dibatalkan.',
            default => 'Tagihan '.$this->kodeTagihan.' untuk '.$this->namaMahasiswa.' diubah dari '.$this->statusSebelumnya.' menjadi '.$statusLabel.'.',
        };

        return [
            'title' => $title,
            'module' => 'finance',
            'module_label' => 'Keuangan',
            'status' => $this->statusBaru,
            'kode_tagihan' => $this->kodeTagihan,
            'nama_mahasiswa' => $this->namaMahasiswa,
            'status_sebelumnya' => $this->statusSebelumnya,
            'total' => $this->total,
            'action_route' => 'mahasiswa.tagihan',
            'action_url' => route('mahasiswa.tagihan', ['search' => $this->kodeTagihan]),
            'action_label' => $actionLabel,
            'message' => $message,
        ];
    }
}
