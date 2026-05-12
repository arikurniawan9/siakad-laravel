<?php

namespace Tests\Feature;

use App\Models\FinanceReconciliation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FinanceReconciliationBulkTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsSuperAdmin(): User
    {
        Role::findOrCreate('super-admin', 'web');
        $user = User::factory()->create();
        $user->assignRole('super-admin');
        $this->actingAs($user);

        return $user;
    }

    public function test_bulk_ignore_updates_pending_items(): void
    {
        $this->actingAsSuperAdmin();

        $a = FinanceReconciliation::query()->create([
            'provider' => 'midtrans',
            'order_id' => 'ORD-BULK-001',
            'amount' => 100000,
            'status' => 'pending',
            'created_at' => now(),
        ]);
        $b = FinanceReconciliation::query()->create([
            'provider' => 'xendit',
            'order_id' => 'ORD-BULK-002',
            'amount' => 150000,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        $this->patch(route('settings.finance-reconciliation.bulk'), [
            'action' => 'ignore',
            'item_ids' => [$a->id, $b->id],
            'resolution_notes' => 'bulk ops',
        ])->assertSessionHasNoErrors();

        $this->assertSame('ignored', $a->fresh()->status);
        $this->assertSame('ignored', $b->fresh()->status);
        $this->assertStringContainsString('[bulk-ignore]', (string) $a->fresh()->resolution_notes);
    }

    public function test_undo_ignore_restores_pending_within_five_minutes(): void
    {
        $this->actingAsSuperAdmin();

        $item = FinanceReconciliation::query()->create([
            'provider' => 'duitku',
            'order_id' => 'ORD-UNDO-001',
            'amount' => 200000,
            'status' => 'ignored',
            'resolution_notes' => 'bulk ops [bulk-ignore]',
            'created_at' => now()->subHour(),
            'resolved_at' => now()->subMinutes(3),
        ]);

        $this->patch(route('settings.finance-reconciliation.undoIgnore', $item->id), [])
            ->assertSessionHasNoErrors();

        $fresh = $item->fresh();
        $this->assertSame('pending', $fresh->status);
        $this->assertNull($fresh->resolved_at);
        $this->assertSame('bulk ops', (string) $fresh->resolution_notes);
    }
}
