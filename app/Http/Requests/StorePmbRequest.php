<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePmbRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'prodi_id' => ['nullable', 'exists:prodis,id'],
            'gelombang' => ['required', 'string', 'max:50'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'asal_sekolah' => ['nullable', 'string', 'max:255'],
            'dokumen_ktp' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
            'dokumen_ijazah' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:3072'],
            'dokumen_foto' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }
}
