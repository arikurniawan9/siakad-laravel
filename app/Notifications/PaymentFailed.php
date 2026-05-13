<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class PaymentFailed extends Notification implements ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $message,
        public string $module,
        public string $actionRoute,
        public string $actionLabel,
        public ?string $status = 'warning',
        public ?string $kodeTagihan = null,
        public ?string $orderId = null,
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
            'title' => $this->title,
            'message' => $this->message,
            'module' => $this->module,
            'module_label' => match ($this->module) {
                'krs' => 'KRS',
                'pmb' => 'PMB',
                'finance' => 'Keuangan',
                default => ucfirst($this->module),
            },
            'status' => $this->status,
            'action_route' => $this->actionRoute,
            'action_label' => $this->actionLabel,
            'kode_tagihan' => $this->kodeTagihan,
            'order_id' => $this->orderId,
        ];
    }
}
