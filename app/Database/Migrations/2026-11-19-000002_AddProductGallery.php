<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;
class AddProductGallery extends Migration {
 public function up() {
  if (!$this->db->tableExists('product_images')) {
   $this->forge->addField([
    'id_image'=>['type'=>'INT','auto_increment'=>true],
    'id_product'=>['type'=>'VARCHAR','constraint'=>40],
    'image'=>['type'=>'VARCHAR','constraint'=>255],
    'is_primary'=>['type'=>'TINYINT','default'=>0],
    'created_at'=>['type'=>'DATETIME','null'=>true],
   ]);
   $this->forge->addKey('id_image',true);
   $this->forge->addKey('id_product');
   $this->forge->addForeignKey('id_product','products','id','CASCADE','CASCADE');
   $attributes=[];
   if($this->db->DBDriver==='MySQLi'){
    // Foreign-key string columns must use the same collation as products.id.
    $column=$this->db->query("SHOW FULL COLUMNS FROM products LIKE 'id'")->getRowArray();
    $attributes['CHARSET']=$this->db->charset;
    $attributes['COLLATE']=$column['Collation'] ?: $this->db->DBCollat;
    $attributes['ENGINE']='InnoDB';
   }
   $this->forge->createTable('product_images',false,$attributes);
  }
  // Preserve each existing catalog photo when upgrading from the one-image schema.
  foreach($this->db->table('products')->select('id,image')->get()->getResultArray() as $product){
   if($product['image'] && !$this->db->table('product_images')->where('id_product',$product['id'])->countAllResults()){
    $this->db->table('product_images')->insert([
     'id_product'=>$product['id'],'image'=>$product['image'],'is_primary'=>1,'created_at'=>date('Y-m-d H:i:s')
    ]);
   }
  }
 }
 public function down() { $this->forge->dropTable('product_images',true); }
}
