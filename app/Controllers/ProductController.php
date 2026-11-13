<?php

namespace App\Controllers;

class ProductController extends ApiController
{
    public function catalog()
    {
        return $this->respond(fn ($service) => $service->catalog());
    }

    public function managementCatalog()
    {
        return $this->respond(fn ($service) => $service->catalog(true));
    }
}
