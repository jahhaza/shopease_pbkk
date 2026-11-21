<?php
namespace App\Controllers;
class CheckoutController extends \App\Controllers\ApiController {
public function index(){return $this->respond(fn($s)=>$s->checkout($this->body()));}
public function addresses(){return $this->respond(fn($s)=>$s->addresses(strtolower($this->request->getMethod())==='post'?$this->body():null));}
public function updateAddress($id){return $this->respond(fn($s)=>$s->updateAddress($id,$this->body()));}
public function deleteAddress($id){return $this->respond(fn($s)=>$s->deleteAddress($id));}
}
