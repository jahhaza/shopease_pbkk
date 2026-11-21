<?php
namespace App\Controllers\Admin;
use App\Controllers\ApiController;
use App\Models\{CategoryModel,ProductModel};
use App\Services\ShopService;
use CodeIgniter\Exceptions\PageNotFoundException;
class CategoryController extends ApiController {
 public function save(){return $this->respond(fn($s)=>$s->category($this->body()));}
 public function index(){return view('admin/categories/index',['title'=>'Kategori Produk','categories'=>(new CategoryModel())->orderBy('name')->findAll()]);}
 public function create(){return view('admin/categories/form',['title'=>'Tambah Kategori','category'=>[]]);}
 public function edit($id){$c=(new CategoryModel())->find($id);if(!$c)throw PageNotFoundException::forPageNotFound();return view('admin/categories/form',['title'=>'Edit Kategori','category'=>$c]);}
 public function store(){return $this->persist();}
 public function update($id){return $this->persist($id);}
 private function persist($id=null){
  $m=new CategoryModel();if($id&&!$m->find($id))throw PageNotFoundException::forPageNotFound();
  if(!$this->validate(['name'=>'required|min_length[3]|max_length[100]','description'=>'permit_empty|max_length[10000]']))return redirect()->back()->withInput()->with('errors',$this->validator->getErrors());
  $new=$id===null;$id=$id??ShopService::id();$name=trim($this->request->getPost('name'));
  $data=['name'=>$name,'slug'=>url_title($name,'-',true).'-'.$id,'description'=>(string)$this->request->getPost('description')];
  try{$ok=$new?$m->insert(['id'=>$id]+$data):$m->update($id,$data);if($ok===false)throw new \RuntimeException('Save failed');}
  catch(\Throwable $e){return redirect()->back()->withInput()->with('error','Kategori gagal disimpan.');}
  return redirect()->to(site_url('admin/categories'))->with('success','Kategori berhasil disimpan.');
 }
 public function delete($id){
  $m=new CategoryModel();if(!$m->find($id))throw PageNotFoundException::forPageNotFound();
  if((new ProductModel())->where('category_id',$id)->countAllResults())return redirect()->back()->with('error','Kategori masih memiliki produk dan tidak dapat dihapus.');
  try{if(!$m->delete($id))throw new \RuntimeException('Delete failed');}catch(\Throwable $e){return redirect()->back()->with('error','Kategori masih digunakan atau gagal dihapus.');}
  return redirect()->to(site_url('admin/categories'))->with('success','Kategori berhasil dihapus.');
 }
}
