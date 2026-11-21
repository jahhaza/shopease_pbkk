<?php
namespace App\Commands;
use CodeIgniter\CLI\{BaseCommand,CLI};
use App\Services\ShopService;
class TestShop extends BaseCommand {
 protected $group='ShopEase';protected $name='shopease:test';protected $description='Run isolated SQLite integration checks; does not change configured database.';
 public function run(array $params){
  session();session_save_path(sys_get_temp_dir());ini_set('session.use_cookies','0');ini_set('session.cache_limiter','');if(session_status()!==PHP_SESSION_ACTIVE)session_start();
  $cfg=config('Database');$cfg->default['DBDriver']='SQLite3';$cfg->default['database']=':memory:';$cfg->default['foreignKeys']=true;
  $db=\Config\Database::connect();foreach(explode(';',file_get_contents(ROOTPATH.'database/schema-sqlite.sql')) as $sql)if(trim($sql))$db->query($sql);\Config\Database::seeder()->call('ShopSeeder');$s=new ShopService();$pass=[];
  $ok=function($name,$value)use(&$pass){if(!$value)throw new \RuntimeException('FAIL '.$name);$pass[]=$name;CLI::write('PASS '.$name);};
  $reject=function($fn,$code=400){try{$fn();return false;}catch(\RuntimeException $e){return $e->getCode()===$code;}};
  $login=fn($role)=>$s->auth(['email'=>$role.'@shopease.test','password'=>'ShopEase2026!']);
  $ok('Katalog 17 produk, 5 kategori',count($s->catalog()['products'])===17&&count($s->catalog()['categories'])===5);
  $ok('Akses tanpa login ditolak',$reject(fn()=>$s->orders(),401));$login('customer');$ok('Login customer',$s->current()['role']==='customer');
  $ok('Password salah ditolak',$reject(fn()=>$s->auth(['email'=>'customer@shopease.test','password'=>'invalid123']),401));
  $ok('Akses admin oleh customer ditolak',$reject(fn()=>$s->overview(),403));
  $ok('Kuantitas melebihi stok ditolak',$reject(fn()=>$s->setCart(['product_id'=>'sony-xm5','quantity'=>999])));
  $ok('Kuantitas pecahan ditolak',$reject(fn()=>$s->setCart(['product_id'=>'sony-xm5','quantity'=>1.5])));
  $s->setCart(['product_id'=>'sony-xm5','quantity'=>2]);$ok('Keranjang tersimpan',(int)$s->cart()[0]['quantity']===2);
  $a=$s->addresses(['recipient_name'=>'Pelanggan Uji','phone'=>'081234560000','address'=>'Jalan Contoh Nomor 1','city'=>'Jakarta','province'=>'DKI Jakarta','postal_code'=>'10110'])[0];$key=ShopService::id();$o=$s->checkout(['address_id'=>$a['id'],'idempotency_key'=>$key,'total'=>1]);$id=$o['id'];
  $ok('Total dihitung ulang server',(int)$o['total']===6613000);$ok('Snapshot harga tersimpan',(int)$o['items'][0]['price']===3299000);$ok('Stok berkurang konsisten',(int)$db->query("SELECT stock FROM products WHERE id='sony-xm5'")->getRow('stock')===22);$again=$s->checkout(['address_id'=>$a['id'],'idempotency_key'=>$key]);$ok('Checkout idempotent',$again['id']===$id);
  $addressInput=['recipient_name'=>'Penerima Baru','phone'=>'081234567891','address'=>'Jalan Contoh Nomor 22','city'=>'Bandung','province'=>'Jawa Barat','postal_code'=>'40111'];
  $spare=$s->addresses($addressInput);$spareId=array_values(array_filter($spare,fn($row)=>$row['id']!==$a['id']))[0]['id'];
  $addressInput['recipient_name']='Penerima Diubah';$updated=$s->updateAddress($spareId,$addressInput);
  $ok('Alamat dapat dibuat dan diubah',count($updated)===2&&current(array_filter($updated,fn($row)=>$row['id']===$spareId))['recipient_name']==='Penerima Diubah');
  $ok('Alamat pesanan tidak dapat diubah',$reject(fn()=>$s->updateAddress($a['id'],$addressInput)));
  $ok('Alamat pesanan tidak dapat dihapus',$reject(fn()=>$s->deleteAddress($a['id'])));
  $ok('Alamat baru dapat dihapus',count($s->deleteAddress($spareId))===1);
  $login('customer2');$ok('Pesanan customer lain tidak terlihat',$reject(fn()=>$s->order($id),404));
  $ok('Alamat customer lain tidak dapat diubah',$reject(fn()=>$s->updateAddress($a['id'],$addressInput),404));
  $ok('Alamat customer lain tidak dapat dihapus',$reject(fn()=>$s->deleteAddress($a['id']),404));
  $login('operator');$ok('Operator tidak dapat memverifikasi',$reject(fn()=>$s->action(['order_id'=>$id,'action'=>'approve']),403));
  $db->table('orders')->where('id',$id)->update(['order_status'=>'waiting_verification']);$db->table('payments')->where('order_id',$id)->update(['payment_status'=>'submitted']);$login('admin');$o=$s->action(['order_id'=>$id,'action'=>'reject','reason'=>'Bukti tidak terbaca']);$ok('Admin menolak bukti',$o['order_status']==='pending_payment'&&$o['payment']['payment_status']==='rejected');
  $db->table('orders')->where('id',$id)->update(['order_status'=>'waiting_verification']);$db->table('payments')->where('order_id',$id)->update(['payment_status'=>'submitted']);$o=$s->action(['order_id'=>$id,'action'=>'approve']);$ok('Admin memverifikasi pembayaran',$o['order_status']==='processing'&&$o['payment']['payment_status']==='verified');
  $login('operator');$o=$s->action(['order_id'=>$id,'action'=>'ship','courier'=>'JNE','tracking_number'=>'TEST123456']);$ok('Operator mengisi resi',$o['order_status']==='shipped'&&$o['shipment']['tracking_number']==='TEST123456');
  $login('customer');$o=$s->action(['order_id'=>$id,'action'=>'complete']);$ok('Customer konfirmasi diterima',$o['order_status']==='completed');$ok('Pesanan selesai tidak dapat dibatalkan',$reject(fn()=>$s->action(['order_id'=>$id,'action'=>'cancel'])));
  $s->setCart(['product_id'=>'pebble','quantity'=>1]);$o=$s->checkout(['address_id'=>$a['id'],'idempotency_key'=>ShopService::id()]);$s->action(['order_id'=>$o['id'],'action'=>'cancel']);$ok('Pembatalan mengembalikan stok',(int)$db->query("SELECT stock FROM products WHERE id='pebble'")->getRow('stock')===46);$ok('Pembatalan berulang ditolak',$reject(fn()=>$s->action(['order_id'=>$o['id'],'action'=>'cancel'])));
  $s->setCart(['product_id'=>'pebble','quantity'=>10]);$db->table('products')->where('id','pebble')->update(['stock'=>1]);$before=$db->table('orders')->countAllResults();$ok('Checkout stok berubah ditolak',$reject(fn()=>$s->checkout(['address_id'=>$a['id'],'idempotency_key'=>ShopService::id()])));$ok('Rollback tanpa order parsial',$db->table('orders')->countAllResults()===$before);
  $login('admin');$ok('Kategori berelasi tidak dapat dihapus',$reject(fn()=>$s->category(['id'=>'elektronik','action'=>'delete'])));$s->product(['id'=>'pebble','action'=>'delete']);
  $login('customer');$ok('Produk nonaktif tidak tampil',!in_array('pebble',array_column($s->catalog()['products'],'id'),true));
  $s->setCart(['product_id'=>'pebble','quantity'=>0]);$ok('Produk nonaktif dapat dihapus dari keranjang',count($s->cart())===0);
  session()->remove(['isLoggedIn','id_user','user_id','name','email','role']);$s->auth(['name'=>'Pengguna Baru','email'=>'baru@example.test','password'=>'Password123!','password_confirm'=>'Password123!','role'=>'admin'],true);$ok('Registrasi belum membuat session',$s->current()===null);$s->auth(['email'=>'baru@example.test','password'=>'Password123!']);$ok('Registrasi selalu customer',$s->current()['role']==='customer');$hash=$db->table('users')->where('email','baru@example.test')->get()->getRow('password');$ok('Password hash aman',password_verify('Password123!',$hash)&&$hash!=='Password123!');$s->logout();$ok('Logout menghapus akses',$s->current()===null);
  file_put_contents(ROOTPATH.'docs/ci4-test-results.json',json_encode(['passed'=>count($pass),'checks'=>$pass,'runtime'=>PHP_VERSION,'database'=>'isolated SQLite3','date'=>ShopService::now(),'note'=>'Payment-upload transport uses fixture in this service suite; hosted API covers actual file upload.'],JSON_PRETTY_PRINT));CLI::write(count($pass).' checks passed.','green');
 }
}
