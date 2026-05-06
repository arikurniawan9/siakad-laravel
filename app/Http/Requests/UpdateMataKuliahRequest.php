<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMataKuliahRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'prodi_id' => ['required', 'exists:prodis,id'],
            'kurikulum_id' => ['nullable', 'exists:kurikulums,id'],
            'kode' => ['required', 'string', 'max:30'],
            'nama' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'integer', 'min:1', 'max:14'],
            'sks' => ['required', 'integer', 'min:1', 'max:8'],
            'jenis' => ['required', 'in:wajib,pilihan'],
        ];
    }
}
