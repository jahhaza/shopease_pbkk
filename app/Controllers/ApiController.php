<?php
namespace App\Controllers;
use App\Services\ShopService;
class ApiController extends BaseController {
 protected function respond(callable $fn){try{return $this->response->setHeader('Cache-Control','no-store')->setJSON($this->normalize($fn(new ShopService())));}catch(\App\Services\RegistrationValidationException $e){return $this->response->setStatusCode(400)->setJSON(['error'=>$e->getMessage(),'fields'=>$e->errors]);}catch(\Throwable $e){$code=$e->getCode();$known=in_array($code,[400,401,403,404,429],true);log_message('error','ShopEase API: {message}',['message'=>$e->getMessage()]);return $this->response->setStatusCode($known?$code:400)->setJSON(['error'=>$known?$e->getMessage():'Permintaan gagal. Periksa data dan coba kembali.']);}}
 private function normalize($data){if(!is_array($data))return $data;foreach($data as $key=>$value){if(is_array($value))$data[$key]=$this->normalize($value);elseif(in_array($key,['price','old_price','stock','sold','quantity','subtotal','shipping_cost','total','amount','n','is_default'],true)&&is_numeric($value))$data[$key]=(int)$value;}return $data;}
 protected function body():array{return $this->request->getJSON(true)??[];}
 public function session(){return $this->respond(fn($s)=>['user'=>$s->current(),'csrf'=>csrf_hash(),'rememberAvailable'=>strlen((string) config('Encryption')->key) >= 32]);}
 public function contact(){return $this->respond(fn($s)=>$s->contact($this->body()));}
 public function upload($type='proof'){return $this->respond(fn($s)=>$s->upload($type==='product'));}
 public function file($key){try{$path=(new ShopService())->file($key);return $this->response->setHeader('Cache-Control',str_starts_with($key,'proof/')?'private, no-store':'public, max-age=86400')->setHeader('X-Content-Type-Options','nosniff')->setContentType(mime_content_type($path))->setBody(file_get_contents($path));}catch(\Throwable $e){return $this->response->setStatusCode(in_array($e->getCode(),[401,403,404],true)?$e->getCode():400)->setJSON(['error'=>'File tidak ditemukan atau akses ditolak.']);}}
}
