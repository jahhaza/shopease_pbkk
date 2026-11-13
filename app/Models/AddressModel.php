<?php
namespace App\Models;
use CodeIgniter\Model;
class AddressModel extends Model {
 protected $table='addresses';
 protected $primaryKey='id';
 protected $useAutoIncrement=false;
 protected $returnType='array';
 protected $allowedFields=['id','user_id','recipient_name','phone','address','city','province','postal_code','is_default'];
}
