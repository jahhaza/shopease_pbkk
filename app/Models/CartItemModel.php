<?php
namespace App\Models;
use CodeIgniter\Model;
class CartItemModel extends Model {
 protected $table='cart_items';
 protected $primaryKey='id';
 protected $useAutoIncrement=false;
 protected $returnType='array';
 protected $allowedFields=['id','cart_id','product_id','quantity'];
}
