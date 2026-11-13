<?php
namespace App\Controllers;
class CartController extends \App\Controllers\ApiController {
public function index(){return $this->respond(fn($s)=>$s->cart());} public function update(){return $this->respond(fn($s)=>$s->setCart($this->body()));}
}
