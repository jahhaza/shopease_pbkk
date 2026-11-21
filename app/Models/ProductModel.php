<?php
namespace App\Models;
use CodeIgniter\Model;
class ProductModel extends Model {
 protected $table='products';
 protected $primaryKey='id';
 protected $useAutoIncrement=false;
 protected $returnType='array';
 protected $allowedFields=['id','category_id','name','slug','description','price','old_price','stock','image','status','sold','rating','created_at'];
 public function search(?string $keyword, ?string $categoryId=null): self {
  if($keyword)$this->like('products.name',$keyword);
  if($categoryId)$this->where('products.category_id',$categoryId);
  return $this;
 }
}
