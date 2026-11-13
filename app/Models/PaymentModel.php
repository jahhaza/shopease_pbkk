<?php
namespace App\Models;
use CodeIgniter\Model;
class PaymentModel extends Model {
 protected $table='payments';
 protected $primaryKey='id';
 protected $useAutoIncrement=false;
 protected $returnType='array';
 protected $allowedFields=['id','order_id','method','amount','proof_file','payment_status','verified_by','verified_at','reason'];
}
