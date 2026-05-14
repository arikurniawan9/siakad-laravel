import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function PaymentAutomationPage({ auth, automationSettings }) {
    const { menu, flash } = usePage().props;
    const form = useForm({
        auto_post_gateway_payment: !!automationSettings?.auto_post_gateway_payment,
        allow_auto_reconcile_bank_mutation: !!automationSettings?.allow_auto_reconcile_bank_mutation,
        bank_mutation_provider: automationSettings?.bank_mutation_provider || 'none',
        match_strategy: automationSettings?.match_strategy || 'order_id_and_amount',
        min_confidence_percent: Number(automationSettings?.min_confidence_percent || 95),
        auto_mark_paid_on_match: !!automationSettings?.auto_mark_paid_on_match,
        notes: automationSettings?.notes || '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.put(route('settings.payment-automation.update'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Otomasi Pembayaran" />

            <div className="space-y-5">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payment Automation</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">Pengaturan Otomasi Pembayaran</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600">Atur kapan sistem menandai pembayaran secara otomatis dari callback gateway dan hasil rekonsiliasi mutasi bank.</p>
                    {flash?.success ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</div> : null}
                </section>

                <form onSubmit={submit} className="space-y-4">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="text-sm font-black text-slate-900">Webhook Gateway</h4>
                        <div className="mt-3 space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <input type="checkbox" checked={!!form.data.auto_post_gateway_payment} onChange={(e) => form.setData('auto_post_gateway_payment', e.target.checked)} />
                                Otomatis catat pembayaran saat callback gateway sukses
                            </label>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h4 className="text-sm font-black text-slate-900">Rekonsiliasi Mutasi Bank</h4>
                        <div className="mt-3 space-y-3">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={!!form.data.allow_auto_reconcile_bank_mutation}
                                    onChange={(e) => form.setData('allow_auto_reconcile_bank_mutation', e.target.checked)}
                                />
                                Aktifkan auto-rekonsiliasi dari mutasi bank
                            </label>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Provider Mutasi</label>
                                    <select className="form-input mt-1" value={form.data.bank_mutation_provider} onChange={(e) => form.setData('bank_mutation_provider', e.target.value)}>
                                        <option value="none">Belum dipilih</option>
                                        <option value="bca">BCA</option>
                                        <option value="bni">BNI</option>
                                        <option value="bri">BRI</option>
                                        <option value="mandiri">Mandiri</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Strategi Matching</label>
                                    <select className="form-input mt-1" value={form.data.match_strategy} onChange={(e) => form.setData('match_strategy', e.target.value)}>
                                        <option value="order_id_and_amount">Order ID + Nominal</option>
                                        <option value="amount_and_name">Nominal + Nama</option>
                                        <option value="amount_only">Nominal saja</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Minimum Confidence (%)</label>
                                    <input
                                        type="number"
                                        min="50"
                                        max="100"
                                        className="form-input mt-1"
                                        value={form.data.min_confidence_percent}
                                        onChange={(e) => form.setData('min_confidence_percent', Number(e.target.value || 95))}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <input type="checkbox" checked={!!form.data.auto_mark_paid_on_match} onChange={(e) => form.setData('auto_mark_paid_on_match', e.target.checked)} />
                                Otomatis tandai lunas jika match memenuhi confidence
                            </label>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <label className="block text-xs font-bold text-slate-700">Catatan Operasional</label>
                        <textarea className="form-input mt-1 min-h-[90px]" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} placeholder="Contoh: Auto mark paid hanya aktif di jam operasional 08.00-17.00." />
                    </section>

                    <div className="flex justify-end">
                        <button className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white disabled:opacity-60" disabled={form.processing} type="submit">
                            {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

