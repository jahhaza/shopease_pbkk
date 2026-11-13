<?php
namespace App\Controllers;
class OrderController extends \App\Controllers\ApiController {
public function index(){return $this->respond(fn($s)=>$s->orders());} public function detail($id){return $this->respond(fn($s)=>$s->order($id));} public function action(){return $this->respond(fn($s)=>$s->action($this->body()));}
}
