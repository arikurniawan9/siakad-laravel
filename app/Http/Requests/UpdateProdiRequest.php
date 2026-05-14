<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProdiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $prodiId = $this->route('prodi')?->id;

        return [
            'jurusan_id' => ['required', 'exists:jurusans,id'],
            'kode' => ['required', 'string', 'max:50', Rule::unique('prodis', 'kode')->ignore($prodiId)],
            'nama' => ['required', 'string', 'max:255'],
            'jenjang' => ['required', 'string', 'max:10'],
            'semester_total' => ['required', 'integer', 'min:1', 'max:14'],
            'sks_lulus' => ['nullable', 'integer', 'min:0', 'max:200'],
        ];
    }
}
