<?php
namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\KaryawanModel;
use CodeIgniter\Exceptions\PageNotFoundException;

class KaryawanController extends BaseController
{
    private function findOrFail($id): array
    {
        return (new KaryawanModel())->find($id) ?? throw PageNotFoundException::forPageNotFound();
    }
    public function index()
    {
        $q=trim((string)$this->request->getGet('q'));
        $jabatan=trim((string)$this->request->getGet('jabatan'));
        $model=new KaryawanModel();
        return view('admin/karyawan/index',['title'=>'Data Karyawan','rows'=>$model->search($q,$jabatan)->orderBy('nama')->paginate(8),'pager'=>$model->pager,'q'=>$q,'jabatan'=>$jabatan]);
    }
    public function create(){return $this->form([]);}
    public function edit($id){return $this->form($this->findOrFail($id));}
    private function form(array $row){return view('admin/karyawan/form',['title'=>$row?'Ubah Karyawan':'Tambah Karyawan','row'=>$row]);}
    private function formData(): array
    {
        $data=[];
        foreach(['nip','nama','jabatan','email','telepon','alamat','tanggal_masuk','status'] as $field)$data[$field]=trim((string)$this->request->getPost($field));
        return $data;
    }
    public function store()
    {
        $model=new KaryawanModel();
        if($model->insert($this->formData())===false)return redirect()->back()->withInput()->with('errors',$model->errors());
        return redirect()->to(site_url('admin/karyawan'))->with('success','Data karyawan berhasil ditambahkan.');
    }
    public function update($id)
    {
        $this->findOrFail($id);$model=new KaryawanModel();
        if($model->save(['id_karyawan'=>(int)$id]+$this->formData())===false)return redirect()->back()->withInput()->with('errors',$model->errors());
        return redirect()->to(site_url('admin/karyawan'))->with('success','Data karyawan berhasil diperbarui.');
    }
    public function delete($id)
    {
        $this->findOrFail($id);(new KaryawanModel())->delete($id);
        return redirect()->to(site_url('admin/karyawan'))->with('success','Data karyawan berhasil dihapus.');
    }
}
