<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicGatewayPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_daftar_pmb_gateway_is_accessible_for_guest(): void
    {
        $this->get(route('public.daftar-pmb'))
            ->assertOk();
    }

    public function test_login_mahasiswa_gateway_is_accessible_for_guest(): void
    {
        $this->get(route('public.login-mahasiswa'))
            ->assertOk();
    }
}

