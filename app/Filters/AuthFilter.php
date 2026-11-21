<?php

namespace App\Filters;

use App\Services\AuthSession;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $user = (new AuthSession())->current();
        $api = str_starts_with(trim($request->getUri()->getRoutePath(), '/'), 'api/');

        if (!$user) {
            if ($api) {
                return service('response')->setStatusCode(401)->setJSON(['error' => 'Silakan masuk terlebih dahulu.']);
            }
            return redirect()->to(site_url('login'))->with('error', 'Silakan login terlebih dahulu.');
        }

        session()->set('role', $user['role']);
        if ($arguments && !in_array($user['role'], $arguments, true)) {
            if ($api) {
                return service('response')->setStatusCode(403)->setJSON(['error' => 'Anda tidak memiliki izin.']);
            }
            return redirect()->to(site_url())->with('access_error', 'Kamu tidak punya akses ke halaman itu.');
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
