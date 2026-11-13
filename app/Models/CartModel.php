<?php
namespace App\Models;
use CodeIgniter\Model;
class CartModel extends Model {
 protected $table='carts';
 protected $primaryKey='id';
 protected $useAutoIncrement=false;
 protected $returnType='array';
 protected $allowedFields=['id','user_id'];
}
