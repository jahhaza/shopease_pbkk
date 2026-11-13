<?php
namespace App\Database\Seeds;
use CodeIgniter\Database\Seeder;
class ShopSeeder extends Seeder {
 public function run(){
  $data=json_decode(file_get_contents(ROOTPATH.'database/seed.json'),true);
  foreach($data['categories'] as $c)if(!$this->db->table('categories')->where('id',$c[0])->countAllResults())$this->db->table('categories')->insert(['id'=>$c[0],'name'=>$c[1],'slug'=>$c[0],'description'=>$c[2]]);
  foreach($data['products'] as $p)if(!$this->db->table('products')->where('id',$p['id'])->countAllResults())$this->db->table('products')->insert($p);
  foreach([['Admin ShopEase','admin','admin'],['Operator ShopEase','operator','operator'],['Nadia Putri','customer','customer'],['Raka Pratama','customer','customer2']] as [$name,$role,$email])if(!$this->db->table('users')->where('email',$email.'@shopease.test')->countAllResults())$this->db->table('users')->insert(['name'=>$name,'email'=>$email.'@shopease.test','role'=>$role,'password'=>password_hash('ShopEase2026!',PASSWORD_DEFAULT),'created_at'=>date('Y-m-d H:i:s')]);
 }
}
