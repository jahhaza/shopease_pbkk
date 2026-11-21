<?php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class KeepOrderItemsAfterProductDelete extends Migration
{
    public function up()
    {
        if($this->db->DBDriver!=='MySQLi')return;
        $fks=$this->db->query("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='order_items' AND COLUMN_NAME='product_id' AND REFERENCED_TABLE_NAME='products'")->getResultArray();
        foreach($fks as $fk)$this->db->query('ALTER TABLE order_items DROP FOREIGN KEY `'.$fk['CONSTRAINT_NAME'].'`');
        $this->db->query('ALTER TABLE order_items MODIFY product_id VARCHAR(40) NULL');
        $this->db->query('ALTER TABLE order_items ADD CONSTRAINT order_items_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL');
    }
    public function down(){}
}
