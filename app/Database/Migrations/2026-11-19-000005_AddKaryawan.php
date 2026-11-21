<?php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddKaryawan extends Migration
{
    public function up()
    {
        if ($this->db->tableExists('karyawan')) return;
        $this->forge->addField([
            'id_karyawan' => ['type'=>'INT','constraint'=>11,'unsigned'=>true,'auto_increment'=>true],
            'nip' => ['type'=>'VARCHAR','constraint'=>20],
            'nama' => ['type'=>'VARCHAR','constraint'=>100],
            'jabatan' => ['type'=>'VARCHAR','constraint'=>50],
            'email' => ['type'=>'VARCHAR','constraint'=>100],
            'telepon' => ['type'=>'VARCHAR','constraint'=>20],
            'alamat' => ['type'=>'TEXT','null'=>true],
            'tanggal_masuk' => ['type'=>'DATE'],
            'status' => ['type'=>'VARCHAR','constraint'=>10,'default'=>'aktif'],
            'created_at' => ['type'=>'DATETIME','null'=>true],
            'updated_at' => ['type'=>'DATETIME','null'=>true],
        ]);
        $this->forge->addKey('id_karyawan',true);
        $this->forge->addUniqueKey('nip');
        $this->forge->addUniqueKey('email');
        $this->forge->createTable('karyawan');
        $this->db->table('karyawan')->insertBatch([
            ['nip'=>'20260001','nama'=>'Sinta Maharani','jabatan'=>'Staf Gudang','email'=>'sinta.staf@shopease.test','telepon'=>'081234560001','alamat'=>'Surabaya','tanggal_masuk'=>'2026-01-10','status'=>'aktif'],
            ['nip'=>'20260002','nama'=>'Budi Santoso','jabatan'=>'Admin Toko','email'=>'budi.staf@shopease.test','telepon'=>'081234560002','alamat'=>'Surabaya','tanggal_masuk'=>'2026-02-12','status'=>'aktif'],
            ['nip'=>'20260003','nama'=>'Dewi Anggraini','jabatan'=>'Customer Service','email'=>'dewi.staf@shopease.test','telepon'=>'081234560003','alamat'=>'Malang','tanggal_masuk'=>'2026-03-03','status'=>'aktif'],
            ['nip'=>'20260004','nama'=>'Fajar Nugroho','jabatan'=>'Kurir','email'=>'fajar.staf@shopease.test','telepon'=>'081234560004','alamat'=>'Surabaya','tanggal_masuk'=>'2026-04-15','status'=>'aktif'],
            ['nip'=>'20260005','nama'=>'Rina Permata','jabatan'=>'Kasir','email'=>'rina.staf@shopease.test','telepon'=>'081234560005','alamat'=>'Sidoarjo','tanggal_masuk'=>'2026-05-09','status'=>'aktif'],
        ]);
    }

    public function down()
    {
        $this->forge->dropTable('karyawan',true);
    }
}
