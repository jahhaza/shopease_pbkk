<?php
namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\ProductModel;
use CodeIgniter\Exceptions\PageNotFoundException;

class InventoryController extends BaseController
{
    public function index()
    {
        $tab=(string)$this->request->getGet('tab');
        if(!in_array($tab,['low','empty','all'],true))$tab='low';
        $model=new ProductModel();
        $model->select('products.*,categories.name AS category_name')->join('categories','categories.id=products.category_id');
        if($tab==='low')$model->where('products.stock <=',5)->where('products.stock >',0);
        if($tab==='empty')$model->where('products.stock',0);
        return view('admin/inventory/index',['title'=>'Manajemen Inventori','rows'=>$model->orderBy('products.stock','ASC')->paginate(8),'pager'=>$model->pager,'tab'=>$tab]);
    }
    public function update($id)
    {
        $model=new ProductModel();
        $product=$model->find($id);
        if(!$product)throw PageNotFoundException::forPageNotFound();
        $stock=filter_var($this->request->getPost('stock'),FILTER_VALIDATE_INT,['options'=>['min_range'=>0,'max_range'=>1000000000]]);
        if($stock===false)return redirect()->back()->with('error','Stok harus bilangan bulat nol atau lebih.');
        if($model->update($id,['stock'=>$stock,'status'=>$stock===0?'inactive':$product['status']])===false)
            return redirect()->back()->with('error','Stok produk gagal diperbarui.');
        return redirect()->back()->with('success','Stok produk diperbarui. Produk dengan stok nol dinonaktifkan otomatis.');
    }
}
