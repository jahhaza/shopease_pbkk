<?php

namespace App\Services;

use App\Models\UserModel;

final class AuthSession
{
    public const COOKIE = 'remember_me';
    private const REMEMBER_SECONDS = 2592000;
    private const IDLE_SECONDS = 1800;
    private const MAX_SECONDS = 28800;
    private const KEYS = ['isLoggedIn', 'id_user', 'user_id', 'name', 'email', 'role', 'auth_started', 'auth_seen', 'auth_stamp'];

    public function current(): ?array
    {
        $session = session();
        $id = $session->get('id_user');
        if (!$id || !$session->get('isLoggedIn')) {
            return null;
        }

        $now = time();
        if ($now - (int) $session->get('auth_seen') >= self::IDLE_SECONDS
            || $now - (int) $session->get('auth_started') >= self::MAX_SECONDS) {
            $session->remove(self::KEYS);
            return null;
        }

        $user = (new UserModel())->find($id);
        if (!$user || !hash_equals((string) $session->get('auth_stamp'), $this->stamp($user))) {
            $session->remove(self::KEYS);
            $this->clearCookie();
            return null;
        }

        $session->set(['auth_seen' => $now, 'role' => $user['role']]);
        return $this->publicUser($user);
    }

    public function start(array $user): void
    {
        session()->regenerate(true);
        session()->set([
            'isLoggedIn' => true,
            'id_user' => (int) $user['id_user'],
            'user_id' => (int) $user['id_user'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'auth_started' => time(),
            'auth_seen' => time(),
            'auth_stamp' => $this->stamp($user),
        ]);
    }

    public function publicUser(array $user): array
    {
        unset($user['password']);
        $user['id'] = (int) $user['id_user'];
        return $user;
    }

    public function remember(array $user): void
    {
        $key = $this->key();
        if ($user['role'] !== 'customer' || $key === '') {
            $this->clearCookie();
            return;
        }
        $payload = $user['id_user'] . '.' . (time() + self::REMEMBER_SECONDS);
        $token = $payload . '.' . $this->signature($payload, $user, $key);
        service('response')->setCookie(
            self::COOKIE, $token, self::REMEMBER_SECONDS, '', '/', '',
            config('Cookie')->secure, true, 'Lax'
        );
    }

    public function restore(): void
    {
        $token = service('request')->getCookie(self::COOKIE);
        if (!is_string($token) || $token === '') {
            return;
        }
        $key = $this->key();
        if ($key === '' || !preg_match('/\A([1-9][0-9]{0,9})\.([0-9]{10})\.([a-f0-9]{64})\z/', $token, $parts)
            || (int) $parts[2] <= time()) {
            $this->clearCookie();
            return;
        }
        $user = (new UserModel())->find((int) $parts[1]);
        if (!$user || $user['role'] !== 'customer'
            || !hash_equals($this->signature($parts[1] . '.' . $parts[2], $user, $key), $parts[3])) {
            $this->clearCookie();
            return;
        }
        $this->start($user);
    }

    public function clearCookie(): void
    {
        service('response')->deleteCookie(self::COOKIE);
    }

    public function end(): void
    {
        $this->clearCookie();
        session()->remove(self::KEYS);
        session()->regenerate(true);
        service('response')->deleteCookie(config('Session')->cookieName);
    }

    private function stamp(array $user): string
    {
        return hash('sha256', $user['password'] . '|' . $user['role']);
    }

    private function key(): string
    {
        $key = (string) config('Encryption')->key;
        return strlen($key) >= 32 ? $key : '';
    }

    private function signature(string $payload, array $user, string $key): string
    {
        return hash_hmac('sha256', 'shopease.remember.v1|' . $payload . '|' . $this->stamp($user), $key);
    }
}
