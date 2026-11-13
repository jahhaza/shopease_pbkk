<?php
namespace App\Controllers\Admin;
class ProductController extends \App\Controllers\ApiController {
public function save(){return $this->respond(fn($s)=>$s->product($this->body()));}
}
