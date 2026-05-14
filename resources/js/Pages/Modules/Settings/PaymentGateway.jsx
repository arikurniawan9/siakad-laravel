import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const providerCards = [
    { key: 'midtrans', label: 'Midtrans', description: 'Paling cocok untuk flow Snap yang sudah ada di sistem saat ini.' },
    { key: 'xendit', label: 'Xendit', description: 'Unified API yang rapi untuk ekspansi payment method multi-channel.' },
    { key: 'duitku', label: 'Duitku', description: 'Alternatif lokal dengan flow callback sederhana dan setup cepat.' },
    { key: 'manual', label: 'Manual', description: 'Tanpa gateway online, pencatatan transaksi dilakukan internal.' },
];

function ConfigBadge({ ready }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {ready ? 'Configured' : 'Belum Lengkap'}
        </span>
    );
}

export default function PaymentGatewayPage({ auth, gatewaySettings, callbackUrls = {} }) {
    const { menu, flash } = usePage().props;
    const [copiedKey, setCopiedKey] = useState('');
    const form = useForm({
        active_provider: gatewaySettings?.active_provider || 'midtrans',
        is_production: !!gatewaySettings?.is_production,
        midtrans_server_key: gatewaySettings?.providers?.midtrans?.server_key || '',
        midtrans_client_key: gatewaySettings?.providers?.midtrans?.client_key || '',
        xendit_secret_key: gatewaySettings?.providers?.xendit?.secret_key || '',
        xendit_public_key: gatewaySettings?.providers?.xendit?.public_key || '',
        xendit_callback_token: gatewaySettings?.providers?.xendit?.callback_token || '',
        duitku_merchant_code: gatewaySettings?.providers?.duitku?.merchant_code || '',
        duitku_api_key: gatewaySettings?.providers?.duitku?.api_key || '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.put(route('settings.payment-gateway.update'), { preserveScroll: true });
    };

    const copyUrl = async (key, value) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(''), 1500);
        } catch {
            setCopiedKey('');
        }
    };

    const midtransModeWarning = useMemo(() => {
        const server = (form.data.midtrans_server_key || '').trim();
        const client = (form.data.midtrans_client_key || '').trim();
        if (!server && !client) return '';

        const serverLooksServer = server.toLowerCase().includes('server');
        const clientLooksClient = client.toLowerCase().includes('client');
        if (!serverLooksServer || !clientLooksClient) {
            return 'Server key/client key terindikasi tertukar atau tidak valid. Pastikan kolom server berisi Mid-server/SB-Mid-server dan kolom client berisi Mid-client/SB-Mid-client.';
        }

        const serverSandbox = server.startsWith('SB-');
        const clientSandbox = client.startsWith('SB-');

        if (form.data.is_production && (serverSandbox || clientSandbox)) {
            return 'Mode production aktif, tapi key masih sandbox (SB-).';
        }
        if (!form.data.is_production && (!serverSandbox || !clientSandbox)) {
            return 'Mode sandbox aktif, tapi key terlihat production (non SB-).';
        }
        return '';
    }, [form.data.is_production, form.data.midtrans_server_key, form.data.midtrans_client_key]);

    return (
        <AuthenticatedLayout user={auth.user} menu={menu}>
            <Head title="Pengaturan Payment Gateway" />

            <div className="space-y-5">
                    <section className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_52%),linear-gradient(140deg,_#ffffff,_#f8fafc)] p-5 shadow-sm sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Finance Integration</p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">Koneksi Payment Gateway</h3>
                    <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-600">Pilih provider utama dan simpan kredensial agar modul keuangan/PMB bisa membuat transaksi online dengan callback otomatis.</p>
                    {flash?.success && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{flash.success}</div>}
                    {flash?.error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{flash.error}</div>}
                </section>

                <form onSubmit={submit} className="space-y-4">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                        <p className="font-bold text-slate-800">Callback URL</p>
                        <div className="mt-2 space-y-2">
                            {[
                                { key: 'midtrans', label: 'Midtrans', value: callbackUrls?.midtrans || '' },
                                { key: 'xendit', label: 'Xendit', value: callbackUrls?.xendit || '' },
                                { key: 'duitku', label: 'Duitku', value: callbackUrls?.duitku || '' },
                            ].map((item) => (
                                <div key={item.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                    <p className="min-w-20 font-semibold text-slate-700">{item.label}</p>
                                    <span className="flex-1 font-mono text-[11px] text-slate-600">{item.value || '-'}</span>
                                    <button
                                        type="button"
                                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100"
                                        onClick={() => copyUrl(item.key, item.value)}
                                    >
                                        {copiedKey === item.key ? 'Tersalin' : 'Copy'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {providerCards.map((provider) => (
                                <button
                                    key={provider.key}
                                    type="button"
                                    onClick={() => form.setData('active_provider', provider.key)}
                                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                                        form.data.active_provider === provider.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <p className="text-xs font-extrabold uppercase tracking-[0.14em]">{provider.label}</p>
                                    <p className={`mt-2 text-xs leading-5 ${form.data.active_provider === provider.key ? 'text-slate-200' : 'text-slate-500'}`}>{provider.description}</p>
                                </button>
                            ))}
                        </div>

                        <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={!!form.data.is_production} onChange={(e) => form.setData('is_production', e.target.checked)} />
                            Production mode (jika nonaktif maka sandbox/test mode)
                        </label>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-3">
                        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-black text-slate-900">Midtrans</h4>
                                <ConfigBadge ready={!!gatewaySettings?.providers?.midtrans?.is_configured} />
                            </div>
                            <div className="mt-3 space-y-2">
                                <input className="form-input" placeholder="Server Key" value={form.data.midtrans_server_key} onChange={(e) => form.setData('midtrans_server_key', e.target.value)} />
                                <input className="form-input" placeholder="Client Key" value={form.data.midtrans_client_key} onChange={(e) => form.setData('midtrans_client_key', e.target.value)} />
                                {midtransModeWarning ? (
                                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">{midtransModeWarning}</p>
                                ) : null}
                                {form.errors.midtrans_server_key ? (
                                    <p className="text-[11px] font-semibold text-rose-600">{form.errors.midtrans_server_key}</p>
                                ) : null}
                            </div>
                        </article>

                        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-black text-slate-900">Xendit</h4>
                                <ConfigBadge ready={!!gatewaySettings?.providers?.xendit?.is_configured} />
                            </div>
                            <div className="mt-3 space-y-2">
                                <input className="form-input" placeholder="Secret Key" value={form.data.xendit_secret_key} onChange={(e) => form.setData('xendit_secret_key', e.target.value)} />
                                <input className="form-input" placeholder="Public Key (optional)" value={form.data.xendit_public_key} onChange={(e) => form.setData('xendit_public_key', e.target.value)} />
                                <input className="form-input" placeholder="Callback Token" value={form.data.xendit_callback_token} onChange={(e) => form.setData('xendit_callback_token', e.target.value)} />
                            </div>
                        </article>

                        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-black text-slate-900">Duitku</h4>
                                <ConfigBadge ready={!!gatewaySettings?.providers?.duitku?.is_configured} />
                            </div>
                            <div className="mt-3 space-y-2">
                                <input className="form-input" placeholder="Merchant Code" value={form.data.duitku_merchant_code} onChange={(e) => form.setData('duitku_merchant_code', e.target.value)} />
                                <input className="form-input" placeholder="API Key" value={form.data.duitku_api_key} onChange={(e) => form.setData('duitku_api_key', e.target.value)} />
                            </div>
                        </article>
                    </section>

                    <div className="flex justify-end">
                        <div className="flex gap-2">
                            <button
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-700 transition hover:bg-slate-100"
                                type="button"
                                onClick={() => router.post(route('settings.payment-gateway.test'), { provider: form.data.active_provider }, { preserveScroll: true })}
                            >
                                Test Konfigurasi
                            </button>
                            <button className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_-14px_rgba(2,132,199,0.9)] transition hover:brightness-105 disabled:opacity-60" disabled={form.processing} type="submit">
                                {form.processing ? 'Menyimpan...' : 'Simpan Konfigurasi Gateway'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
