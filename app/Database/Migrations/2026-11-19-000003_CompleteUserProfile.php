<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class CompleteUserProfile extends Migration {
 public function up(){
  foreach(['phone'=>['type'=>'VARCHAR','constraint'=>20,'null'=>true], 'address'=>['type'=>'TEXT','null'=>true]] as $field=>$definition){
   if(!$this->db->fieldExists($field,'users'))$this->forge->addColumn('users',[$field=>$definition]);
  }
 }
 public function down(){ /* Data-preserving: profile columns may predate this migration. */ }
}
