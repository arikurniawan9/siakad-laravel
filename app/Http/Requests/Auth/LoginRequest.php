<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'captcha' => [
                'required',
                'string',
                'size:6',
                'regex:/^[A-Z0-9]{6}$/',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $captchaSession = session('login_captcha');

                    if (! is_array($captchaSession)) {
                        $this->logSecurityEvent('captcha_missing', 'Captcha session tidak ditemukan atau tidak cocok', [
                            'session_id' => session()->getId(),
                        ]);
                        $fail('Sesi captcha tidak valid. Muat ulang halaman login.');
                        return;
                    }

                    if (RateLimiter::tooManyAttempts($this->captchaThrottleKey(), 3)) {
                        $seconds = RateLimiter::availableIn($this->captchaThrottleKey());
                        $this->logSecurityEvent('captcha_locked', "Lockout {$seconds} detik", [
                            'remaining_seconds' => $seconds,
                        ]);
                        $fail("Terlalu banyak percobaan captcha. Coba lagi dalam {$seconds} detik.");
                        return;
                    }

                    $expectedAnswer = (string) ($captchaSession['answer_hash'] ?? '');
                    $providedAnswer = hash('sha256', strtoupper((string) $value));

                    if ($expectedAnswer === '' || ! hash_equals($expectedAnswer, $providedAnswer)) {
                        RateLimiter::hit($this->captchaThrottleKey(), 60);
                        $attempts = RateLimiter::attempts($this->captchaThrottleKey());
                        $remaining = RateLimiter::availableIn($this->captchaThrottleKey());
                        $this->logSecurityEvent('captcha_failed', 'Captcha tidak valid', [
                            'attempts' => $attempts,
                            'remaining_seconds' => $remaining,
                        ]);
                        session()->forget('login_captcha');
                        $fail('Captcha tidak valid. Silakan coba lagi.');
                        return;
                    }

                    session()->put('login_captcha_verified', [
                        'captcha' => strtoupper((string) $value),
                        'verified_at' => now()->toIso8601String(),
                        'session_id' => session()->getId(),
                        'email' => (string) $this->string('email'),
                    ]);
                    RateLimiter::clear($this->captchaThrottleKey());
                },
            ],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());
            session()->forget('login_captcha');
            session()->forget('login_captcha_verified');

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        if (! (Auth::user()?->is_active ?? false)) {
            Auth::guard('web')->logout();
            RateLimiter::hit($this->throttleKey());
            session()->forget('login_captcha');
            session()->forget('login_captcha_verified');
            $this->logSecurityEvent('inactive_user', 'Percobaan login ke akun nonaktif');

            throw ValidationException::withMessages([
                'email' => 'Akun Anda nonaktif. Hubungi superadmin untuk mengaktifkan kembali akses login.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
        session()->forget('login_captcha');
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }

    private function captchaThrottleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|captcha|'.$this->ip());
    }

    private function logSecurityEvent(string $event, string $message, array $meta = []): void
    {
        try {
            DB::table('login_security_logs')->insert([
                'email' => (string) $this->string('email'),
                'ip_address' => $this->ip(),
                'event' => $event,
                'message' => $message,
                'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (Throwable) {
            // Jangan blokir proses login jika tabel log belum tersedia.
        }
    }
}
