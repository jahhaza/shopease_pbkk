<?php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class PaymentSender extends Migration
{
    public function up()
    {
        if(!$this->db->fieldExists('sender_name','payments')){
            $this->forge->addColumn('payments',['sender_name'=>['type'=>'VARCHAR','constraint'=>100,'null'=>true]]);
        }
    }
    public function down(){}
}
