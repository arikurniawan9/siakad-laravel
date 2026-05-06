<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentFailed extends Notification
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
        return ['database'];
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
