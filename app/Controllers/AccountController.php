<?php

namespace App\Controllers;

final class AccountController extends BaseController
{
    public function profil(): string
    {
        return $this->page('Akun Saya', 'profile');
    }

    public function admin(): string
    {
        return $this->page('Dashboard Admin', 'admin');
    }

    public function operator(): string
    {
        return $this->page('Dashboard Operator', 'admin');
    }

    private function page(string $title, string $page): string
    {
        $this->response->setHeader('Cache-Control', 'no-store');
        return view('frontend/home', ['title' => $title . ' | ShopEase', 'initialPage' => $page]);
    }
}
