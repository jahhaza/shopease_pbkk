<?php

namespace App\Filters;

use App\Services\AuthSession;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

final class RememberFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        if (strtoupper($request->getMethod()) === 'GET' && $request->getCookie(AuthSession::COOKIE) !== null
            && !(new AuthSession())->current()) {
            (new AuthSession())->restore();
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        if ($response instanceof \CodeIgniter\HTTP\RedirectResponse) {
            $response->withCookies();
        }
    }
}
