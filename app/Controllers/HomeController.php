<?php

namespace App\Controllers;

use App\Services\AuthSession;

class HomeController extends BaseController
{
    public function index()
    {
        return $this->storefront();
    }

    public function catalog()
    {
        return $this->storefront('catalog');
    }

    public function wishlist()
    {
        return $this->storefront('wishlist');
    }

    public function about()
    {
        return $this->storefront('about');
    }

    public function contact()
    {
        return $this->storefront('contact');
    }

    private function storefront(string $page = 'home')
    {
        $this->response->setHeader('Cache-Control', 'no-store');
        $role = (new AuthSession())->current()['role'] ?? null;
        if (in_array($role, ['admin', 'operator'], true)) {
            return redirect()->to(site_url($role))->withCookies();
        }
        return view('frontend/home', ['title' => 'ShopEase', 'initialPage' => $page]);
    }
}
