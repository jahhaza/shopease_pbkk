<?php
namespace App\Models;
use CodeIgniter\Model;
class OrderModel extends Model {
 protected $table='orders';
 protected $primaryKey='id';
 protected $useAutoIncrement=false;
 protected $returnType='array';
 protected $allowedFields=['id','user_id','address_id','order_number','subtotal','shipping_cost','total','order_status','notes','created_at','idempotency_key'];
}
