<?php
namespace App\Controllers\Admin;
use App\Controllers\ApiController;
use App\Models\{ProductModel,CategoryModel,ProductImageModel};
use App\Services\ShopService;
use CodeIgniter\Exceptions\PageNotFoundException;
class ProductController extends ApiController {
 public function save(){return $this->respond(fn($s)=>$s->product($this->body()));}
 public function index() {
  $this->response->setHeader('Cache-Control','no-store');
  $m=new ProductModel();
  $q=trim((string)$this->request->getGet('q'));
  $category=(string)$this->request->getGet('category');
  $inventory=(string)$this->request->getGet('inventory');
  $m->select('products.*, categories.name AS category_name')->join('categories','categories.id=products.category_id');
  $m->search($q,$category);
  if($inventory==='low') $m->where('stock >',0)->where('stock <=',5);
  if($inventory==='empty') $m->where('stock',0);
  $products=$m->orderBy('products.created_at','DESC')->paginate(8);
  return view('admin/products/index',[
   'title'=>'Daftar Produk','products'=>$products,'pager'=>$m->pager,
   'categories'=>(new CategoryModel())->findAll(),'q'=>$q,'category'=>$category,'inventory'=>$inventory,
   'counts'=>['products'=>(new ProductModel())->countAllResults(),'categories'=>(new CategoryModel())->countAllResults(),
    'available'=>(new ProductModel())->where('status','active')->countAllResults(),
    'unavailable'=>(new ProductModel())->where('status','inactive')->countAllResults()]
  ]);
 }
 private function product($id) {
  $p=(new ProductModel())->find($id);
  if(!$p) throw PageNotFoundException::forPageNotFound();
  return $p;
 }
 public function create(){return $this->form([]);}
 public function edit($id){return $this->form($this->product($id));}
 private function form(array $p){return view('admin/products/form',[
  'title'=>$p?'Edit Produk':'Tambah Produk','product'=>$p,
  'categories'=>(new CategoryModel())->findAll(),
  'images'=>$p?(new ProductImageModel())->where('id_product',$p['id'])->orderBy('is_primary','DESC')->findAll():[]
 ]);}
 public function store(){return $this->persist();}
 public function update($id){return $this->persist($id);}
 private function persist($id=null) {
  $p=$id?$this->product($id):null;
  $rules=['name'=>'required|min_length[3]|max_length[150]',
   'id_category'=>'required|max_length[40]|is_not_unique[categories.id]',
   'price'=>'required|integer|greater_than_equal_to[0]|less_than_equal_to[1000000000]',
   'stock'=>'required|integer|greater_than_equal_to[0]|less_than_equal_to[1000000000]',
   'status'=>'required|in_list[tersedia,tidak_tersedia]','description'=>'permit_empty|max_length[10000]'];
  if(!$this->validate($rules)) return redirect()->back()->withInput()->with('errors',$this->validator->getErrors());
  $files=array_values(array_filter($this->request->getFileMultiple('images')??[],fn($f)=>$f->getError()!==UPLOAD_ERR_NO_FILE));
  $existing=$id?(new ProductImageModel())->where('id_product',$id)->countAllResults():0;
  $errors=[];
  if(count($files)+$existing>5) $errors[]='Maksimal 5 gambar per produk.';
  foreach($files as $file){
   $types=['image/jpeg'=>['jpg','jpeg'],'image/png'=>['png'],'image/webp'=>['webp']];
   $mime=$file->isValid()?$file->getMimeType():'';
   if(!$file->isValid()||$file->hasMoved()||$file->getSize()>2097152||!isset($types[$mime])||!in_array(strtolower($file->getClientExtension()),$types[$mime]??[],true)||!@getimagesize($file->getTempName())) $errors[]='Gambar harus JPG, PNG, atau WEBP yang valid, maksimal 2 MB.';
  }
  if($errors) return redirect()->back()->withInput()->with('errors',$errors);
  $db=db_connect();$m=new ProductModel();$im=new ProductImageModel();$moved=[];
  $id=$id??ShopService::id();
  $data=['category_id'=>$this->request->getPost('id_category'),'name'=>trim($this->request->getPost('name')),
   'description'=>(string)$this->request->getPost('description'),'price'=>(int)$this->request->getPost('price'),
   'stock'=>(int)$this->request->getPost('stock'),'status'=>(int)$this->request->getPost('stock')===0?'inactive':($this->request->getPost('status')==='tersedia'?'active':'inactive')];
  try {
   $db->transException(true)->transBegin();
   if($p && $db->DBDriver==='MySQLi')$db->query('SELECT id FROM products WHERE id=? FOR UPDATE',[$id]);
   if($p){$m->update($id,$data);} else {
    $m->insert(['id'=>$id,'slug'=>url_title($data['name'],'-',true).'-'.$id,'old_price'=>$data['price'],
     'image'=>'/images/placeholder.svg','sold'=>0,'rating'=>'0','created_at'=>ShopService::now()]+$data);
   }
   foreach($files as $i=>$file){
    $dir=FCPATH.'uploads/products/';if(!is_dir($dir)&&!mkdir($dir,0755,true))throw new \RuntimeException('Folder gambar tidak tersedia.');
    $ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$file->getMimeType()];
    $name=bin2hex(random_bytes(16)).'.'.$ext;
    $file->move($dir,$name);$moved[]=$dir.$name;
    $primary=$existing===0&&$i===0;
    $url='/uploads/products/'.$name;
    $im->insert(['id_product'=>$id,'image'=>$url,'is_primary'=>$primary?1:0,'created_at'=>date('Y-m-d H:i:s')]);
    if($primary)$m->update($id,['image'=>$url]);
   }
   if(!$db->transStatus())throw new \RuntimeException('Transaksi produk gagal.');
   $db->transCommit();
  } catch(\Throwable $e){
   $db->transRollback();foreach($moved as $path)if(is_file($path))unlink($path);
   log_message('error','Product management: {message}',['message'=>$e->getMessage()]);
   return redirect()->back()->withInput()->with('errors',['Produk gagal disimpan. Periksa koneksi database dan izin folder gambar.']);
  }
  return redirect()->to(site_url('admin/products/edit/'.$id))->with('success','Produk berhasil disimpan.');
 }
 public function delete($id) {
  $this->product($id);$db=db_connect();$paths=(new ProductImageModel())->where('id_product',$id)->findAll();
  if($db->table('cart_items')->where('product_id',$id)->countAllResults())return redirect()->back()->with('error','Produk masih ada dalam keranjang customer. Ubah status menjadi Tidak Tersedia.');
  try{if(!(new ProductModel())->delete($id))throw new \RuntimeException('Delete failed');}
  catch(\Throwable $e){return redirect()->back()->with('error','Produk masih digunakan atau gagal dihapus.');}
  foreach($paths as $p)$this->removeFile($p['image']);
  return redirect()->to(site_url('admin/products'))->with('success','Produk berhasil dihapus.');
 }
 private function removeFile($url){
  if(preg_match('#^/uploads/products/[a-f0-9]{32}\.(jpg|png|webp)$#',$url)){
   $path=FCPATH.ltrim($url,'/');if(is_file($path))unlink($path);
  }
 }
 public function primary($id,$imageId){return $this->imageAction($id,$imageId,false);}
 public function deleteImage($id,$imageId){return $this->imageAction($id,$imageId,true);}
 private function imageAction($id,$imageId,$delete) {
  $p=$this->product($id);$db=db_connect();$im=new ProductImageModel();$image=$im->where('id_product',$id)->find($imageId);
  if(!$image)throw PageNotFoundException::forPageNotFound();
  try{
   $db->transException(true)->transBegin();
   if($db->DBDriver==='MySQLi')$db->query('SELECT id FROM products WHERE id=? FOR UPDATE',[$id]);
   if($delete)$im->delete($imageId);
   if(!$delete||$image['is_primary']){
    $next=$delete?$im->where('id_product',$id)->orderBy('id_image')->first():$image;
    $im->where('id_product',$id)->set(['is_primary'=>0])->update();
    if($next)$im->update($next['id_image'],['is_primary'=>1]);
    (new ProductModel())->update($id,['image'=>$next['image']??'/images/placeholder.svg']);
   }
   if(!$db->transStatus())throw new \RuntimeException('Image action failed');
   $db->transCommit();
  }catch(\Throwable $e){$db->transRollback();return redirect()->back()->with('error','Perubahan gambar gagal disimpan.');}
  if($delete)$this->removeFile($image['image']);
  return redirect()->back()->with('success','Galeri berhasil diperbarui.');
 }
}
