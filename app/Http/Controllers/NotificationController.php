<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $read = $request->string('read')->toString();
        $module = $request->string('module')->toString();
        $perPage = (int) $request->integer('per_page', 10);
        if (! in_array($perPage, [10, 30, 50, 100], true)) {
            $perPage = 10;
        }

        $notifications = auth()->user()?->notifications();
        $query = $notifications?->latest();

        if ($query && $read === 'unread') {
            $query->whereNull('read_at');
        } elseif ($query && $read === 'read') {
            $query->whereNotNull('read_at');
        }

        if ($query && $module !== '' && $module !== 'all') {
            $query->where('data', 'like', '%"module":"'.$module.'"%');
        }

        $inbox = $query ? $query->paginate($perPage)->withQueryString() : null;
        $moduleOptions = collect($notifications?->pluck('data') ?? [])
            ->map(fn ($item) => data_get($item, 'module'))
            ->filter()
            ->unique()
            ->values()
            ->map(fn ($value) => [
                'value' => $value,
                'label' => $this->moduleLabel((string) $value),
            ])
            ->prepend(['value' => 'all', 'label' => 'Semua Modul'])
            ->values();

        return Inertia::render('Modules/Notifications/Index', [
            'inbox' => $inbox,
            'summary' => [
                'total' => $notifications?->count() ?? 0,
                'unread' => $notifications?->whereNull('read_at')->count() ?? 0,
                'read' => $notifications?->whereNotNull('read_at')->count() ?? 0,
            ],
            'modules' => $moduleOptions,
            'filters' => [
                'read' => $read === '' ? 'all' : $read,
                'module' => $module === '' ? 'all' : $module,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function markRead(string $id): RedirectResponse
    {
        $notification = auth()->user()?->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }

        return back()->with('success', 'Notifikasi ditandai sudah dibaca.');
    }

    public function markAllRead(): RedirectResponse
    {
        auth()->user()?->unreadNotifications->markAsRead();

        return back()->with('success', 'Semua notifikasi ditandai sudah dibaca.');
    }

    private function moduleLabel(string $value): string
    {
        return match ($value) {
            'krs' => 'KRS',
            'finance' => 'Keuangan',
            'pmb' => 'PMB',
            'academic' => 'Akademik',
            'mahasiswa' => 'Mahasiswa',
            'dosen' => 'Dosen',
            default => ucfirst($value),
        };
    }
}
