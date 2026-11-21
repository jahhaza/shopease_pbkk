<?php

namespace App\Controllers;

use App\Services\ShopService;
use App\Services\RegistrationValidationException;
use RuntimeException;

class AuthController extends ApiController
{
    public function register()
    {
        $this->response->setHeader('Cache-Control', 'no-store');
        return $this->authPage('register', ['values' => [], 'error' => null]);
    }

    public function store()
    {
        $this->response->setHeader('Cache-Control', 'no-store');
        $values = $this->request->getPost(['name', 'email', 'phone', 'address']);
        try {
            (new ShopService())->auth($values + $this->request->getPost(['password', 'password_confirm']), true);
        } catch (RegistrationValidationException $error) {
            return $this->authPage('register', ['values' => $values, 'error' => null, 'errors' => $error->errors]);
        } catch (RuntimeException $error) {
            if ($error->getCode() !== 400) {
                throw $error;
            }
            return $this->authPage('register', ['values' => $values, 'error' => $error->getMessage()]);
        }

        return redirect()->to(site_url('login'))->with('success', 'Registrasi berhasil. Silakan login.')
            ->with('registered_email', strtolower(trim($values['email'])));
    }

    public function login()
    {
        $this->response->setHeader('Cache-Control', 'no-store');
        return $this->authPage('login', ['values' => ['email' => session()->getFlashdata('registered_email')], 'error' => null]);
    }

    public function authenticate()
    {
        $this->response->setHeader('Cache-Control', 'no-store');
        $values = $this->request->getPost(['email']);
        try {
            $result = (new ShopService())->auth($values + $this->request->getPost(['password', 'remember']));
        } catch (RuntimeException $error) {
            if (!in_array($error->getCode(), [400, 401, 429], true)) {
                throw $error;
            }
            if ($error->getCode() === 429) {
                $this->response->setStatusCode(429);
            }
            return $this->authPage('login', ['values' => $values, 'error' => $error->getMessage()]);
        }

        $destination = match ($result['user']['role']) {
            'admin' => 'admin',
            'operator' => 'operator',
            default => 'dashboard',
        };
        return redirect()->to(site_url($destination))->withCookies()
            ->with('success', 'Halo, ' . $result['user']['name'] . '. Kamu berhasil masuk.');
    }

    public function logout()
    {
        (new ShopService())->logout();
        return redirect()->to(site_url('login') . '?keluar=1')->withCookies();
    }

    private function authPage(string $mode, array $data): string
    {
        $values = array_intersect_key($data['values'], array_flip(['name', 'email', 'phone', 'address']));
        return view('auth/' . $mode, [
            'title' => ($mode === 'login' ? 'Masuk' : 'Daftar') . ' | ShopEase',
            'values' => $values,
            'error' => $data['error'] ?? null,
            'errors' => $data['errors'] ?? [],
        ]);
    }

    public function apiLogin()
    {
        return $this->respond(fn (ShopService $service) => $service->auth($this->body()));
    }

    public function apiRegister()
    {
        return $this->respond(fn (ShopService $service) => $service->auth($this->body(), true));
    }

    public function apiLogout()
    {
        return $this->respond(fn (ShopService $service) => $service->logout());
    }
}
