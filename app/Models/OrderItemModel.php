<?php
namespace App\Models;
use CodeIgniter\Model;
class OrderItemModel extends Model {
 protected $table='order_items';
 protected $primaryKey='id';
 protected $useAutoIncrement=false;
 protected $returnType='array';
 protected $allowedFields=['id','order_id','product_id','product_name','price','quantity','subtotal'];
}
