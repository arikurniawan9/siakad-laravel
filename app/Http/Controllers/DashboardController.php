<?php

namespace App\Http\Controllers;

use App\Models\DatabaseMaintenanceLog;
use App\Models\AuditLog;
use App\Models\Mahasiswa;
use App\Models\Pmb;
use App\Models\Tagihan;
use App\Models\User;
use App\Services\DatabaseMaintenanceService;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DashboardController extends Controller
{
    public function __construct(private readonly DatabaseMaintenanceService $databaseMaintenanceService)
    {
    }

    public function index(): Response
    {
        $user = request()->user();
        $isSuperAdmin = $user?->hasRole('super-admin') ?? false;

        $stats = [
            'mahasiswa_aktif' => Mahasiswa::query()->count(),
            'tagihan_berjalan' => (int) Tagihan::query()->whereIn('status', ['unpaid', 'partial'])->sum('nominal'),
            'pengajuan_pmb' => Pmb::query()->count(),
            'notifikasi_baru' => $user?->unreadNotifications()->count() ?? 0,
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'superAdminPanel' => $isSuperAdmin ? $this->buildSuperAdminPanel() : null,
        ]);
    }

    private function buildSuperAdminPanel(): array
    {
        $backups = $this->databaseMaintenanceService->listBackups(30);
        $latestBackup = collect($backups)->sortByDesc('last_modified')->first();

        $snapshot = [
            'login_failed_today' => 0,
            'captcha_locked_today' => 0,
            'backup_total' => count($backups),
            'backup_last_at' => $latestBackup ? date('Y-m-d H:i:s', (int) $latestBackup['last_modified']) : null,
            'inactive_user_total' => User::query()->where('is_active', false)->count(),
            'staff_user_total' => User::query()
                ->whereHas('roles', fn ($query) => $query->whereIn('name', ['admin', 'operator', 'bendahara', 'staff', 'keuangan', 'baak']))
                ->count(),
            'maintenance_failed_today' => DatabaseMaintenanceLog::query()
                ->whereDate('executed_at', now()->toDateString())
                ->where('status', 'failed')
                ->count(),
        ];

        try {
            $snapshot['login_failed_today'] = (int) DB::table('login_security_logs')
                ->whereDate('created_at', now()->toDateString())
                ->where('event', 'captcha_failed')
                ->count();

            $snapshot['captcha_locked_today'] = (int) DB::table('login_security_logs')
                ->whereDate('created_at', now()->toDateString())
                ->where('event', 'captcha_locked')
                ->count();
        } catch (Throwable) {
            // Abaikan jika tabel log belum tersedia.
        }

        $auditTrail = collect();

        try {
            $securityLogs = DB::table('login_security_logs')
                ->select(['created_at', 'event', 'email', 'ip_address', 'message'])
                ->latest('created_at')
                ->limit(8)
                ->get()
                ->map(fn ($row) => [
                    'at' => $row->created_at,
                    'source' => 'security',
                    'title' => strtoupper((string) $row->event),
                    'description' => trim(($row->message ?? '').' | '.($row->email ?? '-').' | IP '.($row->ip_address ?? '-')),
                ]);

            $auditTrail = $auditTrail->merge($securityLogs);
        } catch (Throwable) {
            // Abaikan jika tabel log belum tersedia.
        }

        $maintenanceLogs = DatabaseMaintenanceLog::query()
            ->with('user:id,name')
            ->latest('executed_at')
            ->limit(8)
            ->get()
            ->map(fn (DatabaseMaintenanceLog $log) => [
                'at' => optional($log->executed_at)->toDateTimeString(),
                'source' => 'maintenance',
                'title' => strtoupper($log->action).' / '.strtoupper($log->status),
                'description' => trim(($log->message ?? '-').' | '.($log->user?->name ?? 'system')),
            ]);

        $auditTrail = $auditTrail
            ->merge($maintenanceLogs)
            ->merge(
                AuditLog::query()
                    ->where('source', 'finance')
                    ->latest('created_at')
                    ->limit(8)
                    ->get()
                    ->map(fn (AuditLog $log) => [
                        'at' => optional($log->created_at)->toDateTimeString(),
                        'source' => 'finance',
                        'title' => strtoupper((string) $log->action),
                        'description' => trim(($log->message ?? '-').' | '.($log->user?->name ?? 'system')),
                    ])
            )
            ->sortByDesc('at')
            ->take(12)
            ->values();

        return [
            'snapshot' => $snapshot,
            'audit_trail' => $auditTrail,
            'trend' => $this->buildTrendPayload(),
        ];
    }

    private function buildTrendPayload(): array
    {
        $period = collect(CarbonPeriod::create(now()->subDays(6)->startOfDay(), '1 day', now()->startOfDay()));

        $defaultBuckets = $period->mapWithKeys(fn ($date) => [$date->toDateString() => 0]);

        $pmbDaily = Pmb::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->whereDate('created_at', '>=', now()->subDays(6)->toDateString())
            ->groupByRaw('DATE(created_at)')
            ->pluck('total', 'date');

        $userDaily = User::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->whereDate('created_at', '>=', now()->subDays(6)->toDateString())
            ->groupByRaw('DATE(created_at)')
            ->pluck('total', 'date');

        $maintenanceDaily = DatabaseMaintenanceLog::query()
            ->selectRaw('DATE(executed_at) as date, COUNT(*) as total')
            ->whereDate('executed_at', '>=', now()->subDays(6)->toDateString())
            ->groupByRaw('DATE(executed_at)')
            ->pluck('total', 'date');

        $labels = $period->map(fn ($date) => $date->translatedFormat('d M'))->values()->all();

        return [
            'labels' => $labels,
            'pmb_daily' => $defaultBuckets->merge($pmbDaily)->values()->map(fn ($value) => (int) $value)->all(),
            'user_daily' => $defaultBuckets->merge($userDaily)->values()->map(fn ($value) => (int) $value)->all(),
            'maintenance_daily' => $defaultBuckets->merge($maintenanceDaily)->values()->map(fn ($value) => (int) $value)->all(),
        ];
    }
}
