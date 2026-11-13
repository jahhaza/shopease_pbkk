<?php
namespace App\Models;
use CodeIgniter\Model;
class ShipmentModel extends Model {
 protected $table='shipments';
 protected $primaryKey='id';
 protected $useAutoIncrement=false;
 protected $returnType='array';
 protected $allowedFields=['id','order_id','courier','tracking_number','shipment_status','shipped_at','delivered_at'];
}
