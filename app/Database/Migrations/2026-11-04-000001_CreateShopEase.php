<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class CreateShopEase extends Migration {
 public function up(){
  $sqlite=$this->db->DBDriver==='SQLite3';$sql=file_get_contents(ROOTPATH.'database/'.($sqlite?'schema-sqlite.sql':'schema.sql'));
  foreach(explode(';',$sql) as $statement){$statement=preg_replace('/^--.*$/m','',$statement);$statement=trim($statement);if(!$statement||preg_match('/^(CREATE DATABASE|USE )/i',$statement))continue;$this->db->query($statement);}
 }
 public function down(){foreach(['audit','shipments','payments','order_items','orders','addresses','cart_items','carts','products','categories','contacts','attempts','sessions','users'] as $table)$this->forge->dropTable($table,true);}
}
