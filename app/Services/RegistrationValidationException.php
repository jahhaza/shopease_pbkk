<?php

namespace App\Services;

final class RegistrationValidationException extends \RuntimeException
{
    public function __construct(public readonly array $errors)
    {
        parent::__construct((string) reset($errors), 400);
    }
}
