<?php
namespace App\Controllers\Admin;
class DashboardController extends \App\Controllers\ApiController {
public function index(){return $this->respond(fn($s)=>$s->overview());}
}
