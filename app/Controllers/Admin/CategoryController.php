<?php
namespace App\Controllers\Admin;
class CategoryController extends \App\Controllers\ApiController {
public function save(){return $this->respond(fn($s)=>$s->category($this->body()));}
}
