<?php

namespace App\Http\Controllers;

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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

    public function database(): Response
    {
        $logAction = (string) request()->string('log_action', 'all');
        $logStatus = (string) request()->string('log_status', 'all');
        $logLimit = min(max((int) request()->integer('log_limit', 20), 5), 200);

        return Inertia::render('Modules/Settings/Database', [
            'backups' => collect($this->databaseMaintenanceService->listBackups())->map(fn ($backup) => [
                'filename' => $backup['filename'],
                'size' => (int) $backup['size'],
                'last_modified_at' => date('Y-m-d H:i:s', (int) $backup['last_modified']),
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

    public function financePeriodLocks(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $limit = min(max((int) $request->integer('limit', 50), 5), 200);

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
            'tahun_akademik' => ['required', 'string', 'max:20'],
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
            })
            ->latest('created_at')
            ->limit($limit);

        $items = $query->get();

        return Inertia::render('Modules/Settings/FinanceReconciliation', [
            'filters' => [
                'status' => $status,
                'search' => $search,
                'limit' => $limit,
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
                'resolved_at' => optional($item->resolved_at)->toDateTimeString(),
                'resolved_by' => $item->resolvedBy ? [
                    'id' => $item->resolvedBy->id,
                    'name' => $item->resolvedBy->name,
                    'email' => $item->resolvedBy->email,
                ] : null,
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

    public function resolveFinanceReconciliation(Request $request, FinanceReconciliation $item): RedirectResponse
    {
        $data = $request->validate([
            'resolution_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($item->status !== 'pending') {
            return back()->with('error', 'Item rekonsiliasi sudah diproses.');
        }

        DB::transaction(function () use ($request, $item, $data) {
            $notes = filled($data['resolution_notes'] ?? null) ? trim((string) $data['resolution_notes']) : null;

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
                            'created_by_user_id' => $request->user()?->id,
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
                'resolved_by_user_id' => $request->user()?->id,
            ]);
        });

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

        $item->update([
            'status' => 'ignored',
            'resolution_notes' => filled($data['resolution_notes'] ?? null) ? trim((string) $data['resolution_notes']) : null,
            'resolved_at' => now(),
            'resolved_by_user_id' => $request->user()?->id,
        ]);

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

    public function backupDatabase(): RedirectResponse
    {
        try {
            $backup = $this->databaseMaintenanceService->backup();
            $this->logMaintenance(request(), 'backup', 'success', $backup['filename'], 'Backup database berhasil.');

            return back()->with('success', 'Backup database berhasil dibuat: '.$backup['filename']);
        } catch (\Throwable $exception) {
            $this->logMaintenance(request(), 'backup', 'failed', null, $exception->getMessage());

            return back()->withErrors(['backup_file' => $exception->getMessage()]);
        }
    }

    public function restoreDatabase(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'backup_file' => ['required', 'file', 'mimes:sql,txt', 'max:51200'],
        ]);

        try {
            $this->databaseMaintenanceService->restore($data['backup_file']);
            $this->logMaintenance($request, 'restore', 'success', $data['backup_file']->getClientOriginalName(), 'Restore database selesai.');

            return back()->with('success', 'Restore database selesai.');
        } catch (\Throwable $exception) {
            $this->logMaintenance($request, 'restore', 'failed', $data['backup_file']->getClientOriginalName(), $exception->getMessage());

            return back()->withErrors(['backup_file' => $exception->getMessage()]);
        }
    }

    public function resetDatabase(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'confirmation' => ['required', 'string'],
        ]);

        if (trim((string) $data['confirmation']) !== 'RESET DATABASE') {
            return back()->withErrors([
                'confirmation' => 'Ketik tepat: RESET DATABASE',
            ]);
        }

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
        ]);

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
        DatabaseMaintenanceLog::query()->create([
            'user_id' => $request->user()?->id,
            'action' => $action,
            'status' => $status,
            'filename' => $filename,
            'ip_address' => $request->ip(),
            'message' => $message,
            'executed_at' => now(),
        ]);
    }
}
