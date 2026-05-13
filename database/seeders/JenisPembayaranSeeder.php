<?php

namespace Database\Seeders;

use App\Models\JenisPembayaran;
use Illuminate\Database\Seeder;

class JenisPembayaranSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'kode' => 'CASH',
                'nama' => 'Pembayaran Tunai',
                'provider' => 'manual',
                'payment_type' => 'cash',
                'keterangan' => 'Pembayaran langsung di loket kampus',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'kode' => 'TRANSFER_MANUAL',
                'nama' => 'Transfer Manual (Upload Bukti)',
                'provider' => 'manual',
                'payment_type' => 'bank_transfer',
                'keterangan' => 'Transfer antar bank yang diverifikasi manual',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'kode' => 'VA_BCA',
                'nama' => 'Virtual Account BCA',
                'provider' => 'midtrans',
                'payment_type' => 'bank_transfer',
                'keterangan' => 'Pembayaran via VA BCA',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'kode' => 'VA_BNI',
                'nama' => 'Virtual Account BNI',
                'provider' => 'midtrans',
                'payment_type' => 'bank_transfer',
                'keterangan' => 'Pembayaran via VA BNI',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'kode' => 'VA_BRI',
                'nama' => 'Virtual Account BRI',
                'provider' => 'midtrans',
                'payment_type' => 'bank_transfer',
                'keterangan' => 'Pembayaran via VA BRI',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'kode' => 'VA_MANDIRI',
                'nama' => 'Virtual Account Mandiri',
                'provider' => 'midtrans',
                'payment_type' => 'echannel',
                'keterangan' => 'Pembayaran via Mandiri Bill Payment',
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'kode' => 'QRIS',
                'nama' => 'QRIS',
                'provider' => 'midtrans',
                'payment_type' => 'qris',
                'keterangan' => 'Pembayaran via QRIS',
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'kode' => 'GOPAY',
                'nama' => 'GoPay',
                'provider' => 'midtrans',
                'payment_type' => 'gopay',
                'keterangan' => 'Pembayaran via e-wallet GoPay',
                'is_active' => true,
                'sort_order' => 8,
            ],
            [
                'kode' => 'SHOPEEPAY',
                'nama' => 'ShopeePay',
                'provider' => 'midtrans',
                'payment_type' => 'shopeepay',
                'keterangan' => 'Pembayaran via e-wallet ShopeePay',
                'is_active' => true,
                'sort_order' => 9,
            ],
        ];

        foreach ($rows as $row) {
            JenisPembayaran::query()->updateOrCreate(
                ['kode' => $row['kode']],
                $row
            );
        }
    }
}

