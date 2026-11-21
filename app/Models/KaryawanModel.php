<?php
namespace App\Models;

use CodeIgniter\Model;

class KaryawanModel extends Model
{
    protected $table = 'karyawan';
    protected $primaryKey = 'id_karyawan';
    protected $returnType = 'array';
    protected $allowedFields = ['nip','nama','jabatan','email','telepon','alamat','tanggal_masuk','status'];
    protected $useTimestamps = true;
    protected $validationRules = [
        'id_karyawan' => 'permit_empty|is_natural_no_zero',
        'nip' => 'required|numeric|min_length[8]|max_length[20]|is_unique[karyawan.nip,id_karyawan,{id_karyawan}]',
        'nama' => 'required|min_length[3]|max_length[100]',
        'jabatan' => 'required|in_list[Admin Toko,Staf Gudang,Customer Service,Kurir,Kasir]',
        'email' => 'required|valid_email|is_unique[karyawan.email,id_karyawan,{id_karyawan}]',
        'telepon' => 'required|numeric|min_length[10]|max_length[15]',
        'tanggal_masuk' => 'required|valid_date[Y-m-d]',
        'status' => 'required|in_list[aktif,nonaktif]',
    ];
    protected $validationMessages = [
        'nip'=>['required'=>'NIP wajib diisi.','numeric'=>'NIP hanya boleh angka.','is_unique'=>'NIP sudah dipakai.','min_length'=>'NIP minimal 8 angka.'],
        'nama'=>['required'=>'Nama wajib diisi.','min_length'=>'Nama minimal 3 karakter.'],
        'jabatan'=>['required'=>'Jabatan wajib dipilih.','in_list'=>'Jabatan tidak valid.'],
        'email'=>['required'=>'Email wajib diisi.','valid_email'=>'Format email tidak valid.','is_unique'=>'Email sudah dipakai.'],
        'telepon'=>['required'=>'Telepon wajib diisi.','numeric'=>'Telepon hanya boleh angka.','min_length'=>'Telepon minimal 10 angka.'],
        'tanggal_masuk'=>['required'=>'Tanggal masuk wajib diisi.','valid_date'=>'Tanggal masuk tidak valid.'],
        'status'=>['in_list'=>'Status tidak valid.'],
    ];

    public function search(?string $keyword, ?string $jabatan): self
    {
        if ($keyword) $this->groupStart()->like('nama',$keyword)->orLike('nip',$keyword)->groupEnd();
        if ($jabatan) $this->where('jabatan',$jabatan);
        return $this;
    }
}
