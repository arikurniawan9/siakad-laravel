<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PublicGatewayController extends Controller
{
    public function daftarPmb(): Response
    {
        return Inertia::render('Public/DaftarPmbGateway');
    }

    public function loginMahasiswa(): Response
    {
        return Inertia::render('Public/LoginMahasiswaGateway');
    }
}

