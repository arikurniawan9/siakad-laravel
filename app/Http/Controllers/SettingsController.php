<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\AuditLog;
use App\Models\DatabaseMaintenanceLog;
use App\Models\FinanceReconciliation;
use App\Models\FinancePeriodLock;
use App\Models\Pembayaran;
use App\Models\PembayaranAllocation;
use App\Models\TagihanItem;
use App\Models\TahunAkademik;
use App\Models\User;
use App\Services\DatabaseMaintenanceService;
use App\Support\Audit;
use App\Support\SensitiveActionConfirmation;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingsController extends Controller
{
    public function __construct(private readonly DatabaseMaintenanceService $databaseMaintenanceService)
    {
    }

    public function index(): Response
    {
        $logAction = (string) request()->string('log_action', 'all');
        $logStatus = (string) request()->string('log_status', 'all');
        $logLimit = min(max((int) request()->integer('log_limit', 12), 5), 100);

        $tahunAktif = TahunAkademik::query()->where('is_active', true)->latest('id')->first();
        $users = User::query()->latest('id')->limit(8)->get();

        $stats = [
            'total_user' => User::query()->count(),
            'user_aktif' => User::query()->where('is_active', true)->count(),
            'email_terverifikasi' => User::query()->whereNotNull('email_verified_at')->count(),
            'tahun_aktif' => $tahunAktif?->kode,
            'semester_aktif' => $tahunAktif?->semester_aktif,
            'app_env' => app()->environment(),
            'app_name' => config('app.name'),
            'php_version' => PHP_VERSION,
            'backup_total' => count($this->databaseMaintenanceService->listBackups()),
            'backup_last_at' => $this->latestBackupTimestamp(),
            'maintenance_failed_today' => DatabaseMaintenanceLog::query()
                ->where('status', 'failed')
                ->whereDate('executed_at', now()->toDateString())
                ->count(),
            'reconciliation_pending_total' => FinanceReconciliation::query()
                ->where('status', 'pending')
                ->count(),
        ];

        return Inertia::render('Modules/Settings/Index', [
            'stats' => $stats,
            'recentUsers' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => (bool) $user->is_active,
                'email_verified_at' => optional($user->email_verified_at)->toDateTimeString(),
            ])->values(),
            'backups' => collect($this->databaseMaintenanceService->listBackups())->map(fn ($backup) => [
                'filename' => $backup['filename'],
                'size' => (int) $backup['size'],
                'last_modified_at' => date('Y-m-d H:i:s', (int) $backup['last_modified']),
                'last_modified_ts' => (int) $backup['last_modified'],
            ])->values(),
            'maintenanceLogs' => DatabaseMaintenanceLog::query()
                ->with('user:id,name,email')
                ->when($logAction !== 'all', fn ($q) => $q->where('action', $logAction))
                ->when($logStatus !== 'all', fn ($q) => $q->where('status', $logStatus))
                ->latest('executed_at')
                ->limit($logLimit)
                ->get()
                ->map(fn (DatabaseMaintenanceLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'status' => $log->status,
                    'filename' => $log->filename,
                    'message' => $log->message,
                    'ip_address' => $log->ip_address,
                    'executed_at' => optional($log->executed_at)->toDateTimeString(),
                    'actor' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                    ] : null,
                ])
                ->values(),
            'logFilters' => [
                'log_action' => $logAction,
                'log_status' => $logStatus,
                'log_limit' => $logLimit,
            ],
            'criticalActions' => AuditLog::query()
                ->with('user:id,name,email')
                ->whereIn('source', ['settings', 'finance'])
                ->whereIn('action', [
                    'payment_gateway.update',
                    'payment_gateway.test',
                    'payment_automation.update',
                    'reconciliation.bulk_resolve',
                    'reconciliation.bulk_ignore',
                    'reconciliation.export_csv',
                    'period.lock',
                    'period.unlock',
                ])
                ->latest('created_at')
                ->limit(12)
                ->get()
                ->map(fn (AuditLog $log) => [
                    'id' => (int) $log->id,
                    'source' => (string) $log->source,
                    'action' => (string) $log->action,
                    'message' => (string) ($log->message ?? '-'),
                    'created_at' => optional($log->created_at)->toDateTimeString(),
                    'actor' => $log->user ? [
                        'id' => (int) $log->user->id,
                        'name' => (string) $log->user->name,
                        'email' => (string) $log->user->email,
                    ] : null,
                ])
                ->values(),
        ]);
    }

    public function database(): Response
    {
        $logAction = (string) request()->string('log_action', 'all');
        $logStatus = (string) request()->string('log_status', 'all');
        $logLimit = min(max((int) request()->integer('log_limit', 20), 5), 200);

        return Inertia::render('Modules/Settings/Database', [
            'availableTables' => $this->databaseMaintenanceService->listTables(),
            'backups' => collect($this->databaseMaintenanceService->listBackups())->map(fn ($backup) => [
                'filename' => $backup['filename'],
                'size' => (int) $backup['size'],
                'last_modified_at' => date('Y-m-d H:i:s', (int) $backup['last_modified']),
                'last_modified_ts' => (int) $backup['last_modified'],
            ])->values(),
            'maintenanceLogs' => DatabaseMaintenanceLog::query()
                ->with('user:id,name,email')
                ->when($logAction !== 'all', fn ($q) => $q->where('action', $logAction))
                ->when($logStatus !== 'all', fn ($q) => $q->where('status', $logStatus))
                ->latest('executed_at')
                ->limit($logLimit)
                ->get()
                ->map(fn (DatabaseMaintenanceLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'status' => $log->status,
                    'filename' => $log->filename,
                    'message' => $log->message,
                    'ip_address' => $log->ip_address,
                    'executed_at' => optional($log->executed_at)->toDateTimeString(),
                    'actor' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                    ] : null,
                ])
                ->values(),
            'logFilters' => [
                'log_action' => $logAction,
                'log_status' => $logStatus,
                'log_limit' => $logLimit,
            ],
        ]);
    }

    public function paymentGateway(): Response
    {
        $config = $this->paymentGatewayConfig();
        $activeProvider = (string) ($config['active_provider'] ?? 'midtrans');
        $providers = ['midtrans', 'xendit', 'duitku', 'manual'];
        if (! in_array($activeProvider, $providers, true)) {
            $activeProvider = 'midtrans';
        }

        return Inertia::render('Modules/Settings/PaymentGateway', [
            'gatewaySettings' => [
                'active_provider' => $activeProvider,
                'is_production' => (bool) ($config['is_production'] ?? false),
                'providers' => [
                    'midtrans' => [
                        'is_configured' => filled($config['midtrans']['server_key'] ?? null) && filled($config['midtrans']['client_key'] ?? null),
                        'server_key' => $this->maskSecret((string) ($config['midtrans']['server_key'] ?? '')),
                        'client_key' => $this->maskSecret((string) ($config['midtrans']['client_key'] ?? '')),
                    ],
                    'xendit' => [
                        'is_configured' => filled($config['xendit']['secret_key'] ?? null),
                        'secret_key' => $this->maskSecret((string) ($config['xendit']['secret_key'] ?? '')),
                        'public_key' => $this->maskSecret((string) ($config['xendit']['public_key'] ?? '')),
                        'callback_token' => $this->maskSecret((string) ($config['xendit']['callback_token'] ?? '')),
                    ],
                    'duitku' => [
                        'is_configured' => filled($config['duitku']['merchant_code'] ?? null) && filled($config['duitku']['api_key'] ?? null),
                        'merchant_code' => $this->maskSecret((string) ($config['duitku']['merchant_code'] ?? '')),
                        'api_key' => $this->maskSecret((string) ($config['duitku']['api_key'] ?? '')),
                    ],
                ],
            ],
            'callbackUrls' => [
                'midtrans' => route('payments.midtrans.callback'),
                'xendit' => route('payments.xendit.callback'),
                'duitku' => route('payments.duitku.callback'),
            ],
        ]);
    }

    public function paymentAutomation(): Response
    {
        $stored = AppSetting::query()->where('key', 'payment_automation')->first();
        $value = is_array($stored?->value) ? $stored->value : [];

        return Inertia::render('Modules/Settings/PaymentAutomation', [
            'automationSettings' => [
                'auto_post_gateway_payment' => (bool) ($value['auto_post_gateway_payment'] ?? true),
                'allow_auto_reconcile_bank_mutation' => (bool) ($value['allow_auto_reconcile_bank_mutation'] ?? false),
                'bank_mutation_provider' => (string) ($value['bank_mutation_provider'] ?? 'none'),
                'match_strategy' => (string) ($value['match_strategy'] ?? 'order_id_and_amount'),
                'min_confidence_percent' => (int) ($value['min_confidence_percent'] ?? 95),
                'auto_mark_paid_on_match' => (bool) ($value['auto_mark_paid_on_match'] ?? false),
                'notes' => (string) ($value['notes'] ?? ''),
            ],
        ]);
    }

    public function updatePaymentAutomation(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'auto_post_gateway_payment' => ['boolean'],
            'allow_auto_reconcile_bank_mutation' => ['boolean'],
            'bank_mutation_provider' => ['required', Rule::in(['none', 'bca', 'bni', 'bri', 'mandiri', 'other'])],
            'match_strategy' => ['required', Rule::in(['order_id_and_amount', 'amount_and_name', 'amount_only'])],
            'min_confidence_percent' => ['required', 'integer', 'min:50', 'max:100'],
            'auto_mark_paid_on_match' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $stored = AppSetting::query()->where('key', 'payment_automation')->first();
        $current = is_array($stored?->value) ? $stored->value : [];

        $payload = [
            'auto_post_gateway_payment' => (bool) ($validated['auto_post_gateway_payment'] ?? false),
            'allow_auto_reconcile_bank_mutation' => (bool) ($validated['allow_auto_reconcile_bank_mutation'] ?? false),
            'bank_mutation_provider' => (string) $validated['bank_mutation_provider'],
            'match_strategy' => (string) $validated['match_strategy'],
            'min_confidence_percent' => (int) $validated['min_confidence_percent'],
            'auto_mark_paid_on_match' => (bool) ($validated['auto_mark_paid_on_match'] ?? false),
            'notes' => trim((string) ($validated['notes'] ?? '')),
        ];

        AppSetting::query()->updateOrCreate(
            ['key' => 'payment_automation'],
            ['value' => $payload]
        );

        Audit::log(
            source: 'settings',
            action: 'payment_automation.update',
            entityType: 'app_setting',
            entityId: null,
            message: 'Pengaturan otomasi pembayaran diperbarui',
            meta: [
                'auto_post_gateway_payment' => (bool) $payload['auto_post_gateway_payment'],
                'allow_auto_reconcile_bank_mutation' => (bool) $payload['allow_auto_reconcile_bank_mutation'],
                'bank_mutation_provider' => (string) $payload['bank_mutation_provider'],
                'match_strategy' => (string) $payload['match_strategy'],
                'min_confidence_percent' => (int) $payload['min_confidence_percent'],
                'auto_mark_paid_on_match' => (bool) $payload['auto_mark_paid_on_match'],
                'before' => [
                    'auto_post_gateway_payment' => (bool) ($current['auto_post_gateway_payment'] ?? true),
                    'allow_auto_reconcile_bank_mutation' => (bool) ($current['allow_auto_reconcile_bank_mutation'] ?? false),
                    'bank_mutation_provider' => (string) ($current['bank_mutation_provider'] ?? 'none'),
                    'match_strategy' => (string) ($current['match_strategy'] ?? 'order_id_and_amount'),
                    'min_confidence_percent' => (int) ($current['min_confidence_percent'] ?? 95),
                    'auto_mark_paid_on_match' => (bool) ($current['auto_mark_paid_on_match'] ?? false),
                ],
                'after' => [
                    'auto_post_gateway_payment' => (bool) $payload['auto_post_gateway_payment'],
                    'allow_auto_reconcile_bank_mutation' => (bool) $payload['allow_auto_reconcile_bank_mutation'],
                    'bank_mutation_provider' => (string) $payload['bank_mutation_provider'],
                    'match_strategy' => (string) $payload['match_strategy'],
                    'min_confidence_percent' => (int) $payload['min_confidence_percent'],
                    'auto_mark_paid_on_match' => (bool) $payload['auto_mark_paid_on_match'],
                ],
            ],
        );

        return back()->with('success', 'Pengaturan otomasi pembayaran berhasil disimpan.');
    }

    public function updatePaymentGateway(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'active_provider' => ['required', 'string', Rule::in(['midtrans', 'xendit', 'duitku', 'manual'])],
            'is_production' => ['boolean'],
            'midtrans_server_key' => ['nullable', 'string', 'max:255'],
            'midtrans_client_key' => ['nullable', 'string', 'max:255'],
            'xendit_secret_key' => ['nullable', 'string', 'max:255'],
            'xendit_public_key' => ['nullable', 'string', 'max:255'],
            'xendit_callback_token' => ['nullable', 'string', 'max:255'],
            'duitku_merchant_code' => ['nullable', 'string', 'max:80'],
            'duitku_api_key' => ['nullable', 'string', 'max:255'],
        ]);

        $current = $this->paymentGatewayConfig();

        $payload = [
            'active_provider' => (string) $validated['active_provider'],
            'is_production' => (bool) ($validated['is_production'] ?? false),
            'midtrans' => [
                'server_key' => $this->resolveSecretValue((string) ($validated['midtrans_server_key'] ?? ''), (string) ($current['midtrans']['server_key'] ?? '')),
                'client_key' => $this->resolveSecretValue((string) ($validated['midtrans_client_key'] ?? ''), (string) ($current['midtrans']['client_key'] ?? '')),
            ],
            'xendit' => [
                'secret_key' => $this->resolveSecretValue((string) ($validated['xendit_secret_key'] ?? ''), (string) ($current['xendit']['secret_key'] ?? '')),
                'public_key' => $this->resolveSecretValue((string) ($validated['xendit_public_key'] ?? ''), (string) ($current['xendit']['public_key'] ?? '')),
                'callback_token' => $this->resolveSecretValue((string) ($validated['xendit_callback_token'] ?? ''), (string) ($current['xendit']['callback_token'] ?? '')),
            ],
            'duitku' => [
                'merchant_code' => $this->resolveSecretValue((string) ($validated['duitku_merchant_code'] ?? ''), (string) ($current['duitku']['merchant_code'] ?? '')),
                'api_key' => $this->resolveSecretValue((string) ($validated['duitku_api_key'] ?? ''), (string) ($current['duitku']['api_key'] ?? '')),
            ],
        ];

        $activeProvider = (string) $payload['active_provider'];
        if ($activeProvider !== 'manual' && ! $this->isPaymentProviderReady($activeProvider, $payload)) {
            throw ValidationException::withMessages([
                'active_provider' => "Konfigurasi {$activeProvider} belum lengkap untuk dijadikan provider aktif.",
            ]);
        }
        $this->validateMidtransModeKey($payload);

        AppSetting::query()->updateOrCreate(
            ['key' => 'payment_gateway'],
            ['value' => $payload]
        );

        Audit::log(
            source: 'settings',
            action: 'payment_gateway.update',
            entityType: 'app_setting',
            entityId: null,
            message: 'Konfigurasi payment gateway diperbarui',
            meta: [
                'active_provider' => (string) $payload['active_provider'],
                'is_production' => (bool) $payload['is_production'],
                'before' => [
                    'active_provider' => (string) ($current['active_provider'] ?? 'midtrans'),
                    'is_production' => (bool) ($current['is_production'] ?? false),
                ],
                'after' => [
                    'active_provider' => (string) $payload['active_provider'],
                    'is_production' => (bool) $payload['is_production'],
                ],
                'midtrans_configured' => filled($payload['midtrans']['server_key'] ?? null) && filled($payload['midtrans']['client_key'] ?? null),
                'xendit_configured' => filled($payload['xendit']['secret_key'] ?? null) && filled($payload['xendit']['callback_token'] ?? null),
                'duitku_configured' => filled($payload['duitku']['merchant_code'] ?? null) && filled($payload['duitku']['api_key'] ?? null),
            ],
        );

        return back()->with('success', 'Pengaturan payment gateway berhasil disimpan.');
    }

    public function testPaymentGateway(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'provider' => ['nullable', 'string', Rule::in(['midtrans', 'xendit', 'duitku', 'manual'])],
        ]);

        $config = $this->paymentGatewayConfig();
        $provider = (string) ($validated['provider'] ?? $config['active_provider'] ?? 'midtrans');

        if (! $this->isPaymentProviderReady($provider, $config)) {
            return back()->with('error', "Konfigurasi {$provider} belum lengkap.");
        }

        Audit::log(
            source: 'settings',
            action: 'payment_gateway.test',
            entityType: 'app_setting',
            entityId: null,
            message: 'Tes konfigurasi payment gateway dijalankan',
            meta: ['provider' => $provider],
        );

        return back()->with('success', "Tes konfigurasi {$provider} berhasil (format credential valid).");
    }

    public function financePeriodLocks(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $limit = min(max((int) $request->integer('limit', 50), 5), 200);

        $tahunAkademiks = TahunAkademik::query()
            ->orderByDesc('is_active')
            ->orderByDesc('id')
            ->get(['id', 'kode', 'nama', 'semester_aktif', 'is_active']);

        $locks = FinancePeriodLock::query()
            ->with('lockedBy:id,name,email')
            ->when($search !== '', function ($q) use ($search) {
                $q->where('tahun_akademik', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%");
            })
            ->latest('locked_at')
            ->limit($limit)
            ->get();

        return Inertia::render('Modules/Settings/FinancePeriodLocks', [
            'filters' => [
                'search' => $search,
                'limit' => $limit,
            ],
            'tahunAkademiks' => $tahunAkademiks->map(fn (TahunAkademik $tahun) => [
                'id' => $tahun->id,
                'kode' => $tahun->kode,
                'nama' => $tahun->nama,
                'semester_aktif' => (int) $tahun->semester_aktif,
                'is_active' => (bool) $tahun->is_active,
            ])->values(),
            'locks' => $locks->map(fn (FinancePeriodLock $lock) => [
                'id' => $lock->id,
                'tahun_akademik' => $lock->tahun_akademik,
                'semester_akademik' => $lock->semester_akademik,
                'reason' => $lock->reason,
                'locked_at' => optional($lock->locked_at)->toDateTimeString(),
                'actor' => $lock->lockedBy ? [
                    'id' => $lock->lockedBy->id,
                    'name' => $lock->lockedBy->name,
                    'email' => $lock->lockedBy->email,
                ] : null,
            ])->values(),
        ]);
    }

    public function storeFinancePeriodLock(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tahun_akademik' => [
                'required',
                'string',
                'max:20',
                Rule::exists('tahun_akademiks', 'kode')->whereNull('deleted_at'),
            ],
            'semester_akademik' => ['nullable', 'integer', 'min:1', 'max:14'],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $tahun = trim((string) $data['tahun_akademik']);
        $semester = filled($data['semester_akademik'] ?? null) ? (int) $data['semester_akademik'] : null;

        FinancePeriodLock::query()->firstOrCreate(
            ['tahun_akademik' => $tahun, 'semester_akademik' => $semester],
            [
                'locked_at' => now(),
                'locked_by_user_id' => $request->user()?->id,
                'reason' => filled($data['reason'] ?? null) ? trim((string) $data['reason']) : null,
            ]
        );

        Audit::log(
            source: 'finance',
            action: 'period.lock',
            entityType: 'finance_period_lock',
            entityId: null,
            message: 'Periode keuangan dikunci',
            meta: ['tahun_akademik' => $tahun, 'semester_akademik' => $semester],
        );

        return back()->with('success', 'Periode berhasil dikunci.');
    }

    public function destroyFinancePeriodLock(Request $request, FinancePeriodLock $lock): RedirectResponse
    {
        $tahun = $lock->tahun_akademik;
        $semester = $lock->semester_akademik;
        $lock->delete();

        Audit::log(
            source: 'finance',
            action: 'period.unlock',
            entityType: 'finance_period_lock',
            entityId: (int) $lock->id,
            message: 'Periode keuangan dibuka',
            meta: ['tahun_akademik' => $tahun, 'semester_akademik' => $semester],
        );

        return back()->with('success', 'Periode berhasil dibuka.');
    }

    public function financeReconciliation(Request $request): Response
    {
        $status = (string) $request->string('status', 'pending');
        if (! in_array($status, ['pending', 'resolved', 'ignored', 'all'], true)) {
            $status = 'pending';
        }

        $search = trim((string) $request->string('search'));
        $limit = min(max((int) $request->integer('limit', 50), 5), 200);
        $sortBy = (string) $request->string('sort_by', 'created_at');
        $sortDir = (string) $request->string('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'amount', 'status', 'provider', 'order_id', 'priority'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = FinanceReconciliation::query()
            ->with([
                'tagihan:id,kode_tagihan,jenis,tahun_akademik,semester_akademik,total,status',
                'resolvedBy:id,name,email',
            ])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('tagihan', fn ($t) => $t->where('kode_tagihan', 'like', "%{$search}%"));
            });

        if ($sortBy === 'priority') {
            $priorityOrderAsc = "CASE
                WHEN status = 'pending' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24 THEN 1
                WHEN status = 'pending' AND amount >= 5000000 THEN 2
                WHEN status = 'pending' THEN 3
                WHEN status = 'resolved' THEN 4
                ELSE 5
            END";
            $priorityOrderDesc = "CASE
                WHEN status = 'ignored' THEN 1
                WHEN status = 'resolved' THEN 2
                WHEN status = 'pending' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) < 24 AND amount < 5000000 THEN 3
                WHEN status = 'pending' AND amount >= 5000000 THEN 4
                WHEN status = 'pending' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24 THEN 5
                ELSE 6
            END";
            $query->orderByRaw($sortDir === 'asc' ? $priorityOrderAsc : $priorityOrderDesc);
        } elseif ($sortBy === 'status') {
            $query->orderByRaw("FIELD(status, 'pending', 'resolved', 'ignored')");
            if ($sortDir === 'desc') {
                $query->reorder()->orderByRaw("FIELD(status, 'ignored', 'resolved', 'pending')");
            }
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $query
            ->orderBy('id', 'desc')
            ->limit($limit);

        $items = $query->get();

        return Inertia::render('Modules/Settings/FinanceReconciliation', [
            'filters' => [
                'status' => $status,
                'search' => $search,
                'limit' => $limit,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'items' => $items->map(fn (FinanceReconciliation $item) => [
                'id' => $item->id,
                'provider' => $item->provider,
                'order_id' => $item->order_id,
                'transaction_id' => $item->transaction_id,
                'payment_type' => $item->payment_type,
                'amount' => (float) $item->amount,
                'status' => $item->status,
                'reason' => $item->reason,
                'resolution_notes' => $item->resolution_notes,
                'created_at' => optional($item->created_at)->toDateTimeString(),
                'age_hours' => (int) floor(now()->diffInSeconds($item->created_at ?? now()) / 3600),
                'priority' => $item->status !== 'pending'
                    ? 'low'
                    : ((int) floor(now()->diffInSeconds($item->created_at ?? now()) / 3600) >= 24
                        ? 'high'
                        : ((float) $item->amount >= 5000000 ? 'medium' : 'low')),
                'recommendation' => $item->status !== 'pending'
                    ? 'Selesai diproses, cukup monitor audit trail.'
                    : ((int) floor(now()->diffInSeconds($item->created_at ?? now()) / 3600) >= 24
                        ? 'Prioritaskan segera: item telah melewati SLA 24 jam.'
                        : ((float) $item->amount >= 5000000
                            ? 'Prioritas menengah: nominal besar, verifikasi dan catat lebih dulu.'
                            : 'Prioritas normal: proses sesuai antrean harian.')),
                'resolved_at' => optional($item->resolved_at)->toDateTimeString(),
                'resolved_by' => $item->resolvedBy ? [
                    'id' => $item->resolvedBy->id,
                    'name' => $item->resolvedBy->name,
                    'email' => $item->resolvedBy->email,
                ] : null,
                'undo_available' => $item->status === 'ignored'
                    && str_contains((string) ($item->resolution_notes ?? ''), '[bulk-ignore]')
                    && filled($item->resolved_at)
                    && now()->diffInMinutes($item->resolved_at) <= 5,
                'undo_remaining_seconds' => $this->undoRemainingSeconds($item),
                'tagihan' => $item->tagihan ? [
                    'id' => $item->tagihan->id,
                    'kode_tagihan' => $item->tagihan->kode_tagihan,
                    'jenis' => $item->tagihan->jenis,
                    'tahun_akademik' => $item->tagihan->tahun_akademik,
                    'semester_akademik' => $item->tagihan->semester_akademik,
                    'total' => (float) $item->tagihan->total,
                    'status' => $item->tagihan->status,
                ] : null,
            ])->values(),
        ]);
    }

    public function exportFinanceReconciliationCsv(Request $request): StreamedResponse
    {
        $status = (string) $request->string('status', 'pending');
        if (! in_array($status, ['pending', 'resolved', 'ignored', 'all'], true)) {
            $status = 'pending';
        }

        $search = trim((string) $request->string('search'));
        $limit = min(max((int) $request->integer('limit', 500), 1), 5000);
        $sortBy = (string) $request->string('sort_by', 'created_at');
        $sortDir = (string) $request->string('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'amount', 'status', 'provider', 'order_id', 'priority'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }
        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = FinanceReconciliation::query()
            ->with(['tagihan:id,kode_tagihan,tahun_akademik,semester_akademik', 'resolvedBy:id,name'])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('tagihan', fn ($t) => $t->where('kode_tagihan', 'like', "%{$search}%"));
            });

        if ($sortBy === 'priority') {
            $priorityOrderAsc = "CASE
                WHEN status = 'pending' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24 THEN 1
                WHEN status = 'pending' AND amount >= 5000000 THEN 2
                WHEN status = 'pending' THEN 3
                WHEN status = 'resolved' THEN 4
                ELSE 5
            END";
            $priorityOrderDesc = "CASE
                WHEN status = 'ignored' THEN 1
                WHEN status = 'resolved' THEN 2
                WHEN status = 'pending' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) < 24 AND amount < 5000000 THEN 3
                WHEN status = 'pending' AND amount >= 5000000 THEN 4
                WHEN status = 'pending' AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24 THEN 5
                ELSE 6
            END";
            $query->orderByRaw($sortDir === 'asc' ? $priorityOrderAsc : $priorityOrderDesc);
        } elseif ($sortBy === 'status') {
            $query->orderByRaw("FIELD(status, 'pending', 'resolved', 'ignored')");
            if ($sortDir === 'desc') {
                $query->reorder()->orderByRaw("FIELD(status, 'ignored', 'resolved', 'pending')");
            }
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $rows = $query
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get();

        $filename = 'finance-reconciliation-'.now()->format('Ymd-His').'.csv';
        Audit::log(
            source: 'settings',
            action: 'reconciliation.export_csv',
            entityType: 'finance_reconciliation',
            entityId: null,
            message: 'Export CSV rekonsiliasi keuangan',
            meta: [
                'status' => $status,
                'search' => $search,
                'limit' => $limit,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
                'filename' => $filename,
            ],
        );

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'id',
                'status',
                'provider',
                'order_id',
                'transaction_id',
                'payment_type',
                'amount',
                'tagihan_kode',
                'tahun_akademik',
                'semester_akademik',
                'reason',
                'resolution_notes',
                'created_at',
                'resolved_at',
                'resolved_by',
                'sla_age_hours',
            ]);

            foreach ($rows as $row) {
                $ageHours = (int) floor(now()->diffInSeconds($row->created_at ?? now()) / 3600);
                fputcsv($handle, [
                    $row->id,
                    $row->status,
                    $row->provider,
                    $row->order_id,
                    $row->transaction_id,
                    $row->payment_type,
                    (float) $row->amount,
                    $row->tagihan?->kode_tagihan,
                    $row->tagihan?->tahun_akademik,
                    $row->tagihan?->semester_akademik,
                    $row->reason,
                    $row->resolution_notes,
                    optional($row->created_at)->toDateTimeString(),
                    optional($row->resolved_at)->toDateTimeString(),
                    $row->resolvedBy?->name,
                    $ageHours,
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    public function resolveFinanceReconciliation(Request $request, FinanceReconciliation $item): RedirectResponse
    {
        $data = $request->validate([
            'resolution_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $notes = filled($data['resolution_notes'] ?? null) ? trim((string) $data['resolution_notes']) : null;
        if (! $this->resolveReconciliationItem($item, $notes, $request->user()?->id)) {
            return back()->with('error', 'Item rekonsiliasi sudah diproses.');
        }

        Audit::log(
            source: 'finance',
            action: 'reconciliation.resolve',
            entityType: 'finance_reconciliation',
            entityId: (int) $item->id,
            message: 'Rekonsiliasi diselesaikan',
            meta: ['order_id' => $item->order_id],
        );

        return back()->with('success', 'Item rekonsiliasi di-resolve dan pembayaran dicatat.');
    }

    public function ignoreFinanceReconciliation(Request $request, FinanceReconciliation $item): RedirectResponse
    {
        $data = $request->validate([
            'resolution_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $notes = filled($data['resolution_notes'] ?? null) ? trim((string) $data['resolution_notes']) : null;
        if (! $this->ignoreReconciliationItem($item, $notes, $request->user()?->id)) {
            return back()->with('error', 'Item rekonsiliasi sudah diproses.');
        }

        Audit::log(
            source: 'finance',
            action: 'reconciliation.ignore',
            entityType: 'finance_reconciliation',
            entityId: (int) $item->id,
            message: 'Rekonsiliasi diabaikan',
            meta: ['order_id' => $item->order_id],
        );

        return back()->with('success', 'Item rekonsiliasi ditandai ignored.');
    }

    public function bulkFinanceReconciliation(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', 'string', Rule::in(['resolve', 'ignore'])],
            'item_ids' => ['required', 'array', 'min:1', 'max:200'],
            'item_ids.*' => ['integer', 'exists:finance_reconciliations,id'],
            'resolution_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $action = (string) $data['action'];
        $notes = filled($data['resolution_notes'] ?? null) ? trim((string) $data['resolution_notes']) : null;
        $userId = $request->user()?->id;

        $items = FinanceReconciliation::query()
            ->whereIn('id', $data['item_ids'])
            ->get();

        $processed = 0;
        $processedIds = [];
        foreach ($items as $item) {
            $effectiveNotes = $notes;
            if ($action === 'ignore') {
                $effectiveNotes = trim(($effectiveNotes ? $effectiveNotes.' ' : '').'[bulk-ignore]');
            }

            $ok = $action === 'resolve'
                ? $this->resolveReconciliationItem($item, $effectiveNotes, $userId)
                : $this->ignoreReconciliationItem($item, $effectiveNotes, $userId);

            if (! $ok) {
                continue;
            }

            $processed++;
            $processedIds[] = (int) $item->id;

            Audit::log(
                source: 'finance',
                action: $action === 'resolve' ? 'reconciliation.resolve' : 'reconciliation.ignore',
                entityType: 'finance_reconciliation',
                entityId: (int) $item->id,
                message: $action === 'resolve' ? 'Rekonsiliasi diselesaikan (bulk)' : 'Rekonsiliasi diabaikan (bulk)',
                meta: ['order_id' => $item->order_id],
            );
        }

        if ($processed === 0) {
            return back()->with('error', 'Tidak ada item pending yang bisa diproses.');
        }

        Audit::log(
            source: 'finance',
            action: $action === 'resolve' ? 'reconciliation.bulk_resolve' : 'reconciliation.bulk_ignore',
            entityType: 'finance_reconciliation',
            entityId: null,
            message: $action === 'resolve' ? 'Bulk resolve rekonsiliasi' : 'Bulk ignore rekonsiliasi',
            meta: [
                'processed_count' => $processed,
                'selected_count' => count($data['item_ids']),
                'item_ids' => $processedIds,
            ],
        );

        return back()->with('success', "Bulk {$action} berhasil untuk {$processed} item.");
    }

    public function undoIgnoreFinanceReconciliation(Request $request, FinanceReconciliation $item): RedirectResponse
    {
        if ($item->status !== 'ignored') {
            return back()->with('error', 'Item bukan status ignored.');
        }

        if (! str_contains((string) ($item->resolution_notes ?? ''), '[bulk-ignore]')) {
            return back()->with('error', 'Undo hanya berlaku untuk hasil bulk ignore.');
        }

        if (! $item->resolved_at || now()->diffInMinutes($item->resolved_at) > 5) {
            return back()->with('error', 'Waktu undo sudah lewat (maksimal 5 menit).');
        }

        $item->update([
            'status' => 'pending',
            'resolved_at' => null,
            'resolved_by_user_id' => null,
            'resolution_notes' => $this->stripBulkIgnoreMarker((string) ($item->resolution_notes ?? '')),
        ]);

        Audit::log(
            source: 'finance',
            action: 'reconciliation.undo_ignore',
            entityType: 'finance_reconciliation',
            entityId: (int) $item->id,
            message: 'Undo ignore rekonsiliasi',
            meta: ['order_id' => $item->order_id],
        );

        return back()->with('success', 'Ignore dibatalkan. Item kembali ke pending.');
    }

    public function backupDatabase(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'mode' => ['nullable', 'string', Rule::in(['full', 'custom'])],
            'label' => ['nullable', 'string', 'max:40'],
            'tables' => ['nullable', 'array', 'min:1'],
            'tables.*' => ['string', Rule::in($this->databaseMaintenanceService->listTables())],
        ]);

        try {
            $mode = (string) ($data['mode'] ?? 'full');
            $tables = $mode === 'custom' ? ($data['tables'] ?? []) : null;
            $label = filled($data['label'] ?? null) ? trim((string) $data['label']) : null;

            $backup = $this->databaseMaintenanceService->backup($tables, $label);
            $tableCount = is_array($backup['tables'] ?? null) ? count($backup['tables']) : 0;

            $message = $mode === 'custom'
                ? 'Backup parsial berhasil dibuat: '.$backup['filename'].' ('.$tableCount.' tabel)'
                : 'Backup database berhasil dibuat: '.$backup['filename'];

            $this->logMaintenance($request, 'backup', 'success', $backup['filename'], $message);

            return back()->with('success', $message);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            logger()->error('Database backup failed', [
                'user_id' => $request->user()?->id,
                'mode' => (string) ($data['mode'] ?? 'full'),
                'tables_count' => is_array($data['tables'] ?? null) ? count($data['tables']) : 0,
                'error' => $exception->getMessage(),
            ]);
            $this->logMaintenance($request, 'backup', 'failed', null, $exception->getMessage());

            return back()->withErrors(['backup_file' => $this->humanizeDatabaseException($exception)]);
        }
    }

    public function restoreDatabase(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'backup_file' => ['required', 'file', 'mimes:sql,txt', 'max:51200'],
            'confirmation' => ['required', 'string'],
        ]);
        SensitiveActionConfirmation::assert((string) $data['confirmation'], SensitiveActionConfirmation::RESTORE_DATABASE);

        try {
            $result = $this->databaseMaintenanceService->restore($data['backup_file']);
            $filename = $data['backup_file']->getClientOriginalName();
            $message = 'Restore database selesai. Statements: '.($result['statements'] ?? 0).', durasi: '.($result['elapsed_ms'] ?? 0).'ms.';

            $this->logMaintenance($request, 'restore', 'success', $filename, $message);

            return back()->with('success', $message);
        } catch (\Throwable $exception) {
            $this->logMaintenance($request, 'restore', 'failed', $data['backup_file']->getClientOriginalName(), $exception->getMessage());

            return back()->withErrors(['backup_file' => $this->humanizeDatabaseException($exception)]);
        }
    }

    public function restoreDatabaseFromStoredBackup(Request $request, string $filename): RedirectResponse
    {
        $data = $request->validate([
            'confirmation' => ['required', 'string'],
        ]);
        SensitiveActionConfirmation::assert((string) $data['confirmation'], SensitiveActionConfirmation::RESTORE_DATABASE);

        try {
            $result = $this->databaseMaintenanceService->restoreFromStoredBackup($filename);
            $message = 'Restore database selesai. Statements: '.($result['statements'] ?? 0).', durasi: '.($result['elapsed_ms'] ?? 0).'ms.';

            $this->logMaintenance($request, 'restore', 'success', basename($filename), $message);

            return back()->with('success', $message);
        } catch (\Throwable $exception) {
            $this->logMaintenance($request, 'restore', 'failed', basename($filename), $exception->getMessage());

            return back()->withErrors(['backup_file' => $this->humanizeDatabaseException($exception)]);
        }
    }

    public function resetDatabase(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'confirmation' => ['required', 'string'],
        ]);
        SensitiveActionConfirmation::assert((string) $data['confirmation'], SensitiveActionConfirmation::RESET_DATABASE);

        try {
            $this->databaseMaintenanceService->resetExceptSuperAdmin();
            $this->logMaintenance($request, 'reset', 'success', null, 'Reset database selesai, super-admin dipertahankan.');

            return back()->with('success', 'Database berhasil direset. Data super-admin dipertahankan.');
        } catch (\Throwable $exception) {
            $this->logMaintenance($request, 'reset', 'failed', null, $exception->getMessage());

            return back()->withErrors(['confirmation' => $exception->getMessage()]);
        }
    }

    public function downloadBackup(Request $request, string $filename)
    {
        $path = $this->databaseMaintenanceService->downloadPath($filename);
        $this->logMaintenance($request, 'download', 'success', basename($path), 'Download backup database.');

        return Storage::disk('local')->download($path, basename($path));
    }

    public function deleteBackup(Request $request, string $filename): RedirectResponse
    {
        $data = $request->validate([
            'confirmation' => ['required', 'string'],
        ]);
        SensitiveActionConfirmation::assert((string) $data['confirmation'], SensitiveActionConfirmation::DELETE_BACKUP);

        try {
            $this->databaseMaintenanceService->deleteBackup($filename);
            $this->logMaintenance($request, 'delete-backup', 'success', $filename, 'Hapus file backup berhasil.');

            return back()->with('success', 'File backup berhasil dihapus: '.$filename);
        } catch (\Throwable $exception) {
            $this->logMaintenance($request, 'delete-backup', 'failed', $filename, $exception->getMessage());

            return back()->withErrors(['backup_file' => $exception->getMessage()]);
        }
    }

    public function purgeBackups(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'older_than_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'confirmation' => ['required', 'string'],
        ]);
        SensitiveActionConfirmation::assert((string) $data['confirmation'], SensitiveActionConfirmation::PURGE_BACKUP);

        try {
            $deleted = $this->databaseMaintenanceService->purgeOldBackups((int) $data['older_than_days']);
            $this->logMaintenance($request, 'purge-backup', 'success', null, 'Purge backup berhasil. Terhapus: '.$deleted.' file.');

            return back()->with('success', 'Purge backup selesai. Terhapus '.$deleted.' file.');
        } catch (\Throwable $exception) {
            $this->logMaintenance($request, 'purge-backup', 'failed', null, $exception->getMessage());

            return back()->withErrors(['backup_file' => $exception->getMessage()]);
        }
    }

    public function exportMaintenanceLogsCsv(Request $request): StreamedResponse
    {
        $logAction = (string) $request->string('log_action', 'all');
        $logStatus = (string) $request->string('log_status', 'all');
        $limit = min(max((int) $request->integer('limit', 500), 1), 5000);

        $rows = DatabaseMaintenanceLog::query()
            ->with('user:id,name,email')
            ->when($logAction !== 'all', fn ($q) => $q->where('action', $logAction))
            ->when($logStatus !== 'all', fn ($q) => $q->where('status', $logStatus))
            ->latest('executed_at')
            ->limit($limit)
            ->get();

        $filename = 'maintenance-logs-'.now()->format('Ymd-His').'.csv';
        $this->logMaintenance($request, 'export-log', 'success', $filename, 'Export log maintenance CSV.');

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['id', 'executed_at', 'action', 'status', 'actor_name', 'actor_email', 'filename', 'ip_address', 'message']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->id,
                    optional($row->executed_at)->toDateTimeString(),
                    $row->action,
                    $row->status,
                    $row->user?->name,
                    $row->user?->email,
                    $row->filename,
                    $row->ip_address,
                    $row->message,
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    private function logMaintenance(Request $request, string $action, string $status, ?string $filename, ?string $message): void
    {
        $userId = $request->user()?->id;

        try {
            if ($userId && ! DB::table('users')->where('id', $userId)->exists()) {
                $userId = null;
            }

            DatabaseMaintenanceLog::query()->create([
                'user_id' => $userId,
                'action' => $action,
                'status' => $status,
                'filename' => $filename,
                'ip_address' => $request->ip(),
                'message' => $message,
                'executed_at' => now(),
            ]);
        } catch (\Throwable $exception) {
            // Jangan menggagalkan aksi utama (restore/backup/reset) hanya karena gagal log.
            try {
                if ($userId) {
                    DatabaseMaintenanceLog::query()->create([
                        'user_id' => null,
                        'action' => $action,
                        'status' => $status,
                        'filename' => $filename,
                        'ip_address' => $request->ip(),
                        'message' => $message ? ($message."\n(log fallback: user_id missing/invalid)") : 'Log fallback: user_id missing/invalid',
                        'executed_at' => now(),
                    ]);
                }
            } catch (\Throwable) {
                // ignore
            }

            logger()->warning('Failed to write database maintenance log', [
                'action' => $action,
                'status' => $status,
                'filename' => $filename,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function humanizeDatabaseException(\Throwable $exception): string
    {
        $message = (string) $exception->getMessage();

        if (str_contains($message, 'There is no active transaction')) {
            return 'Restore gagal karena transaksi database tidak aktif. Coba ulang restore dengan file backup yang valid.';
        }

        if ($exception instanceof QueryException) {
            $sqlState = (string) ($exception->errorInfo[0] ?? '');

            if ($sqlState === '23000') {
                if (str_contains($message, 'database_maintenance_logs_user_id_foreign')) {
                    return 'Restore selesai, tetapi sistem gagal menyimpan log maintenance (akun pengguna tidak ditemukan setelah restore). Silakan refresh dan login ulang bila perlu.';
                }

                return 'Aksi gagal karena konflik relasi data (integrity constraint). Pastikan file backup sesuai dengan struktur database saat ini.';
            }
        }

        if (str_contains($message, 'File backup kosong')) {
            return 'File backup kosong. Silakan pilih file .sql yang valid.';
        }

        return 'Terjadi kesalahan saat menjalankan aksi database. Silakan coba lagi atau cek log server.';
    }

    private function paymentGatewayConfig(): array
    {
        $stored = AppSetting::query()->where('key', 'payment_gateway')->first();
        $value = is_array($stored?->value) ? $stored->value : [];

        return [
            'active_provider' => (string) ($value['active_provider'] ?? 'midtrans'),
            'is_production' => (bool) ($value['is_production'] ?? false),
            'midtrans' => [
                'server_key' => (string) ($value['midtrans']['server_key'] ?? ''),
                'client_key' => (string) ($value['midtrans']['client_key'] ?? ''),
            ],
            'xendit' => [
                'secret_key' => (string) ($value['xendit']['secret_key'] ?? ''),
                'public_key' => (string) ($value['xendit']['public_key'] ?? ''),
                'callback_token' => (string) ($value['xendit']['callback_token'] ?? ''),
            ],
            'duitku' => [
                'merchant_code' => (string) ($value['duitku']['merchant_code'] ?? ''),
                'api_key' => (string) ($value['duitku']['api_key'] ?? ''),
            ],
        ];
    }

    private function maskSecret(string $value): string
    {
        if ($value === '') {
            return '';
        }

        if (strlen($value) <= 8) {
            return str_repeat('*', strlen($value));
        }

        return substr($value, 0, 4).str_repeat('*', max(strlen($value) - 8, 4)).substr($value, -4);
    }

    private function resolveSecretValue(string $input, string $fallback): string
    {
        $trimmed = trim($input);
        if ($trimmed === '') {
            return $fallback;
        }

        if (str_contains($trimmed, '*')) {
            return $fallback;
        }

        return $trimmed;
    }

    private function isPaymentProviderReady(string $provider, array $config): bool
    {
        return match ($provider) {
            'midtrans' => filled($config['midtrans']['server_key'] ?? null) && filled($config['midtrans']['client_key'] ?? null),
            'xendit' => filled($config['xendit']['secret_key'] ?? null) && filled($config['xendit']['callback_token'] ?? null),
            'duitku' => filled($config['duitku']['merchant_code'] ?? null) && filled($config['duitku']['api_key'] ?? null),
            'manual' => true,
            default => false,
        };
    }

    private function validateMidtransModeKey(array $config): void
    {
        $serverKey = trim((string) ($config['midtrans']['server_key'] ?? ''));
        $clientKey = trim((string) ($config['midtrans']['client_key'] ?? ''));
        if ($serverKey === '' && $clientKey === '') {
            return;
        }

        $serverLooksLikeServerKey = str_contains(strtolower($serverKey), 'server');
        $clientLooksLikeClientKey = str_contains(strtolower($clientKey), 'client');
        if (! $serverLooksLikeServerKey || ! $clientLooksLikeClientKey) {
            throw ValidationException::withMessages([
                'midtrans_server_key' => 'Format key Midtrans tidak valid. Isi Server Key pada kolom server (Mid-server / SB-Mid-server) dan Client Key pada kolom client (Mid-client / SB-Mid-client).',
            ]);
        }

        $isProduction = (bool) ($config['is_production'] ?? false);
        $serverIsSandbox = str_starts_with($serverKey, 'SB-');
        $clientIsSandbox = str_starts_with($clientKey, 'SB-');

        if ($isProduction && ($serverIsSandbox || $clientIsSandbox)) {
            throw ValidationException::withMessages([
                'midtrans_server_key' => 'Mode production aktif, gunakan key production (Mid-server / Mid-client).',
            ]);
        }

        if (! $isProduction && (! $serverIsSandbox || ! $clientIsSandbox)) {
            throw ValidationException::withMessages([
                'midtrans_server_key' => 'Mode sandbox aktif, gunakan key sandbox (SB-Mid-server / SB-Mid-client).',
            ]);
        }
    }

    private function latestBackupTimestamp(): ?string
    {
        $backups = $this->databaseMaintenanceService->listBackups();
        if ($backups === []) {
            return null;
        }

        $latest = collect($backups)->sortByDesc(fn ($item) => (int) ($item['last_modified'] ?? 0))->first();

        return isset($latest['last_modified'])
            ? date('Y-m-d H:i:s', (int) $latest['last_modified'])
            : null;
    }

    private function resolveReconciliationItem(FinanceReconciliation $item, ?string $notes, ?int $userId): bool
    {
        if ($item->status !== 'pending') {
            return false;
        }

        DB::transaction(function () use ($item, $notes, $userId) {
            if ($item->tagihan) {
                $tagihan = $item->tagihan()->lockForUpdate()->first();
                if ($tagihan) {
                    $alreadyRecorded = DB::table('pembayarans')
                        ->whereNull('deleted_at')
                        ->where('tagihan_id', $tagihan->id)
                        ->where('provider', $item->provider)
                        ->where('reference', $item->order_id)
                        ->exists();

                    if (! $alreadyRecorded) {
                        $items = $tagihan->items()
                            ->orderBy('sort_order')
                            ->orderBy('id')
                            ->get(['id', 'total', 'kode', 'nama', 'nominal', 'potongan', 'denda', 'sort_order']);

                        if ($items->isEmpty()) {
                            $items = collect([
                                TagihanItem::query()->create([
                                    'tagihan_id' => $tagihan->id,
                                    'jenis_tagihan_id' => null,
                                    'kode' => substr((string) ($tagihan->jenis ?? 'ITEM'), 0, 30),
                                    'nama' => substr((string) ($tagihan->jenis ?? 'Item'), 0, 120),
                                    'nominal' => (float) $tagihan->nominal,
                                    'potongan' => (float) $tagihan->potongan,
                                    'denda' => (float) $tagihan->denda,
                                    'total' => (float) $tagihan->total,
                                    'keterangan' => null,
                                    'sort_order' => 0,
                                ]),
                            ]);
                        }

                        $amount = (float) $item->amount;

                        $pembayaran = Pembayaran::query()->create([
                            'tagihan_id' => $tagihan->id,
                            'mahasiswa_id' => filled($tagihan->mahasiswa_id) ? (int) $tagihan->mahasiswa_id : null,
                            'jenis_pembayaran_id' => null,
                            'provider' => (string) $item->provider,
                            'reference' => (string) $item->order_id,
                            'amount' => $amount,
                            'paid_at' => now(),
                            'notes' => $notes,
                            'created_by_user_id' => $userId,
                        ]);

                        $paidPerItem = DB::table('pembayaran_allocations')
                            ->join('pembayarans', 'pembayarans.id', '=', 'pembayaran_allocations.pembayaran_id')
                            ->whereNull('pembayarans.deleted_at')
                            ->whereIn('pembayaran_allocations.tagihan_item_id', $items->pluck('id')->all())
                            ->groupBy('pembayaran_allocations.tagihan_item_id')
                            ->selectRaw('pembayaran_allocations.tagihan_item_id as tagihan_item_id, SUM(pembayaran_allocations.amount) as total_paid')
                            ->pluck('total_paid', 'tagihan_item_id')
                            ->map(fn ($v) => (float) $v);

                        $remaining = $amount;
                        foreach ($items as $it) {
                            if ($remaining <= 0) {
                                break;
                            }

                            $itemPaid = (float) ($paidPerItem[$it->id] ?? 0);
                            $itemRemaining = max((float) $it->total - $itemPaid, 0);
                            if ($itemRemaining <= 0) {
                                continue;
                            }

                            $take = min($remaining, $itemRemaining);
                            if ($take <= 0) {
                                continue;
                            }

                            PembayaranAllocation::query()->create([
                                'pembayaran_id' => $pembayaran->id,
                                'tagihan_item_id' => $it->id,
                                'amount' => $take,
                            ]);

                            $remaining -= $take;
                        }

                        if (round($remaining, 2) > 0) {
                            $firstItem = $items->first();
                            PembayaranAllocation::query()->create([
                                'pembayaran_id' => $pembayaran->id,
                                'tagihan_item_id' => $firstItem->id,
                                'amount' => $remaining,
                            ]);
                        }

                        $tagihan->refreshStatusFromPayments();
                    } else {
                        $tagihan->refreshStatusFromPayments();
                    }
                }
            }

            $item->update([
                'status' => 'resolved',
                'resolution_notes' => $notes,
                'resolved_at' => now(),
                'resolved_by_user_id' => $userId,
            ]);
        });

        return true;
    }

    private function ignoreReconciliationItem(FinanceReconciliation $item, ?string $notes, ?int $userId): bool
    {
        if ($item->status !== 'pending') {
            return false;
        }

        $item->update([
            'status' => 'ignored',
            'resolution_notes' => $notes,
            'resolved_at' => now(),
            'resolved_by_user_id' => $userId,
        ]);

        return true;
    }

    private function stripBulkIgnoreMarker(string $notes): ?string
    {
        $clean = trim(str_replace('[bulk-ignore]', '', $notes));

        return $clean === '' ? null : $clean;
    }

    private function undoRemainingSeconds(FinanceReconciliation $item): int
    {
        if (! $item->resolved_at) {
            return 0;
        }
        if ($item->status !== 'ignored') {
            return 0;
        }
        if (! str_contains((string) ($item->resolution_notes ?? ''), '[bulk-ignore]')) {
            return 0;
        }

        $elapsed = now()->diffInSeconds($item->resolved_at);
        $remaining = 300 - $elapsed;

        return max(0, $remaining);
    }
}
