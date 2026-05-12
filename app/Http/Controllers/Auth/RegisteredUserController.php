<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        $prodis = Prodi::query()
            ->where('is_active', true)
            ->orderBy('nama')
            ->get(['id', 'kode', 'nama', 'jenjang']);

        return Inertia::render('Auth/Register', [
            'prodis' => $prodis,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => 'nullable|string|max:20',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],

            // Mahasiswa fields
            'prodi_id' => 'required|integer|exists:prodis,id',
            // If empty, NIM will be generated from "angkatan" + running number (e.g. 20260001).
            'nim' => 'nullable|string|max:50|unique:'.Mahasiswa::class,
            'nisn' => 'nullable|string|max:50|unique:'.Mahasiswa::class,
            'jenis_kelamin' => 'required|string|in:L,P',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'alamat' => 'nullable|string|max:2000',

            // Confirmation
            'confirm_data' => 'accepted',
        ]);

        /** @var User $user */
        $user = DB::transaction(function () use ($request) {
            $prodi = Prodi::query()->findOrFail((int) $request->prodi_id);
            $angkatan = (string) Carbon::now()->year;

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
            ]);

            // Default all self-registrations to role "mahasiswa"
            Role::firstOrCreate(['name' => 'mahasiswa', 'guard_name' => 'web']);
            $user->assignRole('mahasiswa');

            $nim = $request->nim ?: $this->generateNim($angkatan, (string) $prodi->kode);

            $user->mahasiswa()->create([
                'prodi_id' => (int) $request->prodi_id,
                'nim' => $nim,
                'nisn' => $request->nisn,
                'nama' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'jenis_kelamin' => $request->jenis_kelamin,
                'tempat_lahir' => $request->tempat_lahir,
                'tanggal_lahir' => $request->tanggal_lahir,
                'alamat' => $request->alamat,
                'angkatan' => $angkatan,
                'status_mahasiswa' => 'aktif',
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return redirect()
            ->route('pmb.index')
            ->with('success', 'Akun berhasil dibuat. Lanjutkan pengisian data PMB Anda.');
    }

    private function generateNim(string $angkatan, string $kodeProdi): string
    {
        $angkatanDigits = preg_replace('/\D+/', '', $angkatan) ?: $angkatan;
        $kodeProdiClean = strtoupper(preg_replace('/[^A-Za-z0-9]+/', '', $kodeProdi) ?: $kodeProdi);

        // Default NIM format: {angkatan}{kode_prodi}{0001..}
        $prefix = $angkatanDigits.$kodeProdiClean;
        $latest = Mahasiswa::query()
            ->where('nim', 'like', $prefix.'%')
            ->lockForUpdate()
            ->max('nim');

        $next = 1;
        if (is_string($latest) && preg_match('/^'.preg_quote($prefix, '/').'(\d{4})$/', $latest, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
