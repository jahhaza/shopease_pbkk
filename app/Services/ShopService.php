<?php
namespace App\Services;
use App\Models\{UserModel,ProductModel,CategoryModel};
use RuntimeException;
/** Business layer. All monetary values are integer Rupiah in PHP; persisted as DECIMAL in MySQL. */
class ShopService {
 private $db;
 public function __construct(){ $this->db=\Config\Database::connect(); }
 public static function id():string{return bin2hex(random_bytes(16));}
 public static function now():string{return gmdate('Y-m-d\TH:i:s\Z');}
 private function fail(string $m,int $status=400):never{throw new RuntimeException($m,$status);}
 private function all(string $sql,array $args=[]):array{return $this->db->query($sql,$args)->getResultArray();}
 private function one(string $sql,array $args=[]):?array{return $this->db->query($sql,$args)->getRowArray();}
 private function exec(string $sql,array $args=[]):void{if(!$this->db->query($sql,$args))throw new RuntimeException('Operasi database gagal.',500);}
 private function insert(string $table,array $data):void{if(!$this->db->table($table)->insert($data))throw new RuntimeException('Penyimpanan data gagal.',500);}
 private function update(string $table,array $where,array $data):void{if(!$this->db->table($table)->where($where)->update($data))throw new RuntimeException('Pembaruan data gagal.',500);}
 private function lock():string{return $this->db->DBDriver==='MySQLi'?' FOR UPDATE':'';}
 private function tx(callable $fn):mixed{$this->db->transBegin();try{$result=$fn();if(!$this->db->transStatus())throw new RuntimeException('Transaksi gagal.');$this->db->transCommit();return $result;}catch(\Throwable $e){$this->db->transRollback();throw $e;}}
 private function valid(array $b,array $rules):void{foreach($rules as $k=>$min)if(!isset($b[$k])||!is_string($b[$k])||mb_strlen(trim($b[$k]))<$min||mb_strlen($b[$k])>2000)$this->fail('Periksa kolom '.$k.'.');}
 private function number($v,int $min=0):int{if(filter_var($v,FILTER_VALIDATE_INT)===false||$v<$min||$v>1000000000)$this->fail('Harga, stok, atau kuantitas tidak valid.');return (int)$v;}
 public function current(): ?array
 {
     return (new AuthSession())->current();
 }
 private function user(array $roles=[]):array{$u=$this->current();if(!$u)$this->fail('Silakan masuk terlebih dahulu.',401);if($roles&&!in_array($u['role'],$roles,true))$this->fail('Anda tidak memiliki izin.',403);return $u;}
 public function catalog(bool $admin = false): array
 {
     if ($admin) {
         $this->user(['admin']);
     } elseif (in_array($this->current()['role'] ?? null, ['admin', 'operator'], true)) {
         $this->fail('Katalog belanja tersedia untuk customer.', 403);
     }

     $products = new ProductModel();
     if (!$admin) {
         $products->where('status', 'active');
     }
     return [
         'products' => $products->orderBy('created_at', 'DESC')->orderBy('id')->findAll(),
         'categories' => (new CategoryModel())->findAll(),
     ];
 }
 public function auth(array $input, bool $register = false): array
 {
     $email = is_string($input['email'] ?? null) ? strtolower(trim($input['email'])) : '';
     $password = $input['password'] ?? null;
     $users = new UserModel();
     if ($register) {
         $data = ['email' => $email, 'password' => $password];
         foreach (['name', 'phone', 'address', 'password_confirm'] as $field) {
             $value = $input[$field] ?? '';
             $data[$field] = is_string($value) && $field !== 'password_confirm' ? trim($value) : $value;
         }
         $validation = service('validation');
         $validation->reset();
         $validation->setRules([
             'name' => 'required|min_length[3]|max_length[100]',
             'email' => 'required|valid_email|max_length[100]|is_unique[users.email]',
             'phone' => ['permit_empty', 'regex_match[/^(\+62|62|0)8[0-9]{7,11}$/]'],
             'address' => 'permit_empty|max_length[300]',
             'password' => 'required|min_length[8]|max_length[72]',
             'password_confirm' => 'required|matches[password]',
         ], [
             'name' => ['required' => 'Nama wajib diisi.', 'min_length' => 'Nama minimal 3 karakter.', 'max_length' => 'Nama maksimal 100 karakter.'],
             'email' => ['required' => 'Email wajib diisi.', 'valid_email' => 'Format email tidak valid.', 'max_length' => 'Email maksimal 100 karakter.', 'is_unique' => 'Email sudah terdaftar.'],
             'phone' => ['regex_match' => 'Gunakan nomor HP Indonesia, misalnya 081234567890.'],
             'address' => ['max_length' => 'Alamat maksimal 300 karakter.'],
             'password' => ['required' => 'Password wajib diisi.', 'min_length' => 'Password minimal 8 karakter.', 'max_length' => 'Password maksimal 72 byte.'],
             'password_confirm' => ['required' => 'Konfirmasi password wajib diisi.', 'matches' => 'Konfirmasi password tidak sama.'],
         ]);
         $validation->run($data);
         $errors = $validation->getErrors();
         if (is_string($password) && (strlen($password) > 72 || str_contains($password, chr(0)))) {
             $errors['password'] = 'Password maksimal 72 byte dan tidak boleh mengandung karakter NUL.';
         }
         if ($errors) {
             throw new RegistrationValidationException($errors);
         }

         try {
             $saved = $users->insert([
                 'name' => $data['name'],
                 'email' => $email,
                 'password' => password_hash($password, PASSWORD_DEFAULT),
                 'role' => 'customer',
                 'phone' => $data['phone'] !== '' ? $data['phone'] : null,
                 'address' => $data['address'] !== '' ? $data['address'] : null,
             ]);
         } catch (\CodeIgniter\Database\Exceptions\DatabaseException $error) {
             if ((int) $error->getCode() === 1062 || (int) $error->getCode() === 19) {
                 throw new RegistrationValidationException(['email' => 'Email sudah terdaftar.']);
             }
             throw $error;
         }
         if ($saved === false) {
             $this->fail('Akun belum dapat disimpan.');
         }

         return ['message' => 'Registrasi berhasil. Silakan masuk.'];
     }

     if (strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)
         || !is_string($password) || $password === '' || strlen($password) > 72
         || str_contains($password, chr(0))) {
         $this->fail('Email atau password salah.', 401);
     }

     $ip = service('request')->getIPAddress();
     $throttle = service('throttler');
     if (!$throttle->check('auth-ip-' . hash('sha256', $ip), 30, 60)) {
         $this->fail('Terlalu banyak permintaan. Coba lagi sekitar satu menit.', 429);
     }

     $key = hash('sha256', 'v2|' . $email . '|' . $ip);
     $now = time();
     $attempt = $this->one('SELECT count, expires FROM attempts WHERE id=?', [$key]);
     if ($attempt && (int) $attempt['expires'] > $now && (int) $attempt['count'] >= 5) {
         $this->fail('Terlalu banyak percobaan gagal. Coba lagi sekitar satu menit.', 429);
     }

     $user = $users->cariByEmail($email);
     $dummyHash = '$2y$10$wH.GyMDtyTjBvQ8CkObSIOHBeMRoxnycF9.CBWr5m/3RJ7RIbChjm';
     $matches = password_verify($password, $user['password'] ?? $dummyHash);
     if (!$matches || !$user) {
         $upsert = $this->db->DBDriver === 'SQLite3'
             ? 'ON CONFLICT(id) DO UPDATE SET count = CASE WHEN expires <= ? THEN 1 ELSE count + 1 END, expires = ?'
             : 'ON DUPLICATE KEY UPDATE count = IF(expires <= ?, 1, count + 1), expires = ?';
         $this->exec('INSERT INTO attempts (id, count, expires) VALUES (?, 1, ?) ' . $upsert,
             [$key, $now + 60, $now, $now + 60]);
         log_message('notice', 'ShopEase auth: login ditolak.');
         $this->fail('Email atau password salah.', 401);
     }

     $this->exec('DELETE FROM attempts WHERE id=?', [$key]);
     if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
         $newHash = password_hash($password, PASSWORD_DEFAULT);
         $this->exec('UPDATE users SET password=?, updated_at=? WHERE id_user=? AND password=?',
             [$newHash, date('Y-m-d H:i:s'), $user['id_user'], $user['password']]);
         if ($this->db->affectedRows() !== 1) {
             $this->fail('Silakan coba masuk kembali.', 401);
         }
         $user['password'] = $newHash;
     }
     $auth = new AuthSession();
     $auth->start($user);
     if (in_array($input['remember'] ?? null, ['1', true, 1], true)) {
         $auth->remember($user);
     } else {
         $auth->clearCookie();
     }
     log_message('notice', 'ShopEase auth: login berhasil untuk pengguna {id}.', ['id' => $user['id_user']]);
     return ['user' => $auth->publicUser($user)];
 }

 public function logout(): array
 {
     (new AuthSession())->end();
     return ['ok' => true];
 }
 private function cartId(array $u):string{$id='cart-'.$u['id_user'];if(!$this->one('SELECT id FROM carts WHERE user_id=?',[$u['id_user']]))$this->insert('carts',['id'=>$id,'user_id'=>$u['id_user']]);return $id;}
 public function cart():array{$u=$this->user(['customer']);$id=$this->cartId($u);return $this->all('SELECT p.*,ci.quantity,ci.id as cart_item_id FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?',[$id]);}
 public function setCart(array $b):array{$u=$this->user(['customer']);$n=$this->number($b['quantity']??-1);$id=$this->cartId($u);if(!$n){$this->exec('DELETE FROM cart_items WHERE cart_id=? AND product_id=?',[$id,$b['product_id']??'']);return $this->cart();}$p=(new ProductModel())->where('status','active')->find($b['product_id']??'');if(!$p||$n>(int)$p['stock'])$this->fail('Jumlah melebihi stok atau produk tidak aktif.');$item=$this->one('SELECT id FROM cart_items WHERE cart_id=? AND product_id=?',[$id,$p['id']]);if($item)$this->update('cart_items',['id'=>$item['id']],['quantity'=>$n]);else $this->insert('cart_items',['id'=>self::id(),'cart_id'=>$id,'product_id'=>$p['id'],'quantity'=>$n]);return $this->cart();}
 public function addresses(?array $b=null):array{$u=$this->user(['customer']);if($b!==null){$this->valid($b,['recipient_name'=>2,'phone'=>8,'address'=>8,'city'=>2,'province'=>2,'postal_code'=>5]);if(!preg_match('/^\d{5}$/',$b['postal_code'])||!preg_match('/^\+?[\d\s-]{8,18}$/',$b['phone']))$this->fail('Nomor telepon atau kode pos tidak valid.');$data=array_intersect_key($b,array_flip(['recipient_name','phone','address','city','province','postal_code']));$this->insert('addresses',$data+['id'=>self::id(),'user_id'=>$u['id_user'],'is_default'=>0]);}return $this->all('SELECT * FROM addresses WHERE user_id=?',[$u['id_user']]);}
 public function checkout(array $b):array{
  $u=$this->user(['customer']);$this->valid($b,['address_id'=>1,'idempotency_key'=>10]);$key=$u['id_user'].':'.$b['idempotency_key'];if(strlen($key)>100)$this->fail('Kunci pesanan tidak valid.');
  $id=$this->tx(function()use($u,$b,$key){
   // Serialize checkouts by customer. Lock product rows in consistent product ID order.
   $this->one('SELECT id_user FROM users WHERE id_user=?'.$this->lock(),[$u['id_user']]);$existing=$this->one('SELECT id FROM orders WHERE idempotency_key=?',[$key]);if($existing)return $existing['id'];
   $address=$this->one('SELECT id FROM addresses WHERE id=? AND user_id=?',[$b['address_id'],$u['id_user']]);if(!$address)$this->fail('Alamat pengiriman tidak valid.');$cid=$this->cartId($u);$items=$this->all('SELECT p.*,ci.quantity FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=? ORDER BY p.id'.$this->lock(),[$cid]);if(!$items)$this->fail('Keranjang masih kosong.');$sum=0;
   foreach($items as $p){$n=$this->number($p['quantity'],1);if($p['status']!=='active'||$n>(int)$p['stock'])$this->fail('Stok tidak mencukupi: '.$p['name']);$sum+=(int)$p['price']*$n;}
   $shipping=($b['courier']??'')==='express'?25000:15000;$id=self::id();$this->insert('orders',['id'=>$id,'user_id'=>$u['id_user'],'address_id'=>$address['id'],'order_number'=>'SE'.gmdate('ymdHis').strtoupper(substr($id,0,4)),'subtotal'=>$sum,'shipping_cost'=>$shipping,'total'=>$sum+$shipping,'order_status'=>'pending_payment','notes'=>mb_substr((string)($b['notes']??''),0,1000),'created_at'=>self::now(),'idempotency_key'=>$key]);
   foreach($items as $p){$this->insert('order_items',['id'=>self::id(),'order_id'=>$id,'product_id'=>$p['id'],'product_name'=>$p['name'],'price'=>(int)$p['price'],'quantity'=>(int)$p['quantity'],'subtotal'=>(int)$p['price']*(int)$p['quantity']]);$this->exec('UPDATE products SET stock=stock-? WHERE id=? AND stock>=? AND status=?',[(int)$p['quantity'],$p['id'],(int)$p['quantity'],'active']);if($this->db->affectedRows()!==1)$this->fail('Stok berubah. Silakan periksa keranjang.');}
   $this->insert('payments',['id'=>self::id(),'order_id'=>$id,'method'=>'Transfer manual','amount'=>$sum+$shipping,'payment_status'=>'unpaid']);$this->insert('shipments',['id'=>self::id(),'order_id'=>$id,'courier'=>($b['courier']??'')==='express'?'Express':'Reguler','shipment_status'=>'pending']);$this->audit($u,$id,'Pesanan dibuat; stok direservasi');$this->exec('DELETE FROM cart_items WHERE cart_id=?',[$cid]);return $id;
  });return $this->order($id);
 }
 public function orders():array{$u=$this->user();return $this->all('SELECT o.*,p.payment_status FROM orders o JOIN payments p ON p.order_id=o.id'.($u['role']==='customer'?' WHERE o.user_id=?':'').' ORDER BY o.created_at DESC',$u['role']==='customer'?[$u['id_user']]:[]);}
 public function order(string $id):array{$u=$this->user();$o=$this->one('SELECT o.*,u.name as customer_name,u.email,a.recipient_name,a.phone,a.address,a.city,a.province,a.postal_code FROM orders o JOIN users u ON u.id_user=o.user_id JOIN addresses a ON a.id=o.address_id WHERE o.id=?',[$id]);if(!$o||($u['role']==='customer'&&(int)$o['user_id'] !== (int)$u['id_user']))$this->fail('Pesanan tidak ditemukan.',404);$o['items']=$this->all('SELECT oi.*,p.image FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?',[$id]);$o['payment']=$this->one('SELECT * FROM payments WHERE order_id=?',[$id]);$o['shipment']=$this->one('SELECT * FROM shipments WHERE order_id=?',[$id]);$o['history']=$this->all('SELECT action,created_at FROM audit WHERE order_id=? ORDER BY created_at',[$id]);return $o;}
 private function audit(array $u,string $id,string $action):void{$this->insert('audit',['id'=>self::id(),'user_id'=>$u['id_user'],'order_id'=>$id,'action'=>mb_substr($action,0,1000),'created_at'=>self::now()]);}
 public function action(array $b):array{
  $u=$this->user();$id=(string)($b['order_id']??'');$this->tx(function()use($u,$id,$b){$this->one('SELECT id FROM orders WHERE id=?'.$this->lock(),[$id]);$o=$this->order($id);$action=$b['action']??'';$target='';
   if($action==='cancel'){if($u['role']==='operator'||!in_array($o['order_status'],['pending_payment','waiting_verification'],true))$this->fail('Pesanan tidak dapat dibatalkan.');$target='cancelled';foreach($o['items'] as $it)$this->exec('UPDATE products SET stock=stock+? WHERE id=?',[(int)$it['quantity'],$it['product_id']]);$this->update('payments',['order_id'=>$id],['payment_status'=>'rejected','reason'=>'Pesanan dibatalkan']);}
   elseif($action==='complete'){if($u['role']==='operator'||$o['order_status']!=='shipped')$this->fail('Pesanan belum dapat diselesaikan.');$target='completed';$this->update('shipments',['order_id'=>$id],['shipment_status'=>'delivered','delivered_at'=>self::now()]);}
   elseif(in_array($action,['approve','reject'],true)){if($u['role']!=='admin'||$o['order_status']!=='waiting_verification'||$o['payment']['payment_status']!=='submitted')$this->fail('Verifikasi tidak diizinkan.',403);if($action==='reject')$this->valid($b,['reason'=>5]);$target=$action==='approve'?'processing':'pending_payment';$this->update('payments',['order_id'=>$id],['payment_status'=>$action==='approve'?'verified':'rejected','verified_by'=>$u['id_user'],'verified_at'=>self::now(),'reason'=>mb_substr((string)($b['reason']??''),0,500)]);}
   elseif($action==='ship'){if(!in_array($u['role'],['admin','operator'],true)||$o['order_status']!=='processing'||$o['payment']['payment_status']!=='verified')$this->fail('Pengiriman tidak diizinkan.',403);$this->valid($b,['courier'=>2,'tracking_number'=>5]);$target='shipped';$this->update('shipments',['order_id'=>$id],['courier'=>$b['courier'],'tracking_number'=>$b['tracking_number'],'shipment_status'=>'shipped','shipped_at'=>self::now()]);}
   else $this->fail('Tindakan tidak dikenal.');$this->update('orders',['id'=>$id],['order_status'=>$target]);$this->audit($u,$id,$action.(!empty($b['reason'])?': '.$b['reason']:''));
  });return $this->order($id);
 }
 public function upload(bool $product=false):array{
  $u=$this->user($product?['admin']:['customer']);$request=service('request');$file=$request->getFile('file');if(!$file||!$file->isValid()||$file->hasMoved()||$file->getSize()>2097152||!in_array(strtolower($file->getClientExtension()),['jpg','jpeg','png','webp'],true)||!in_array($file->getMimeType(),['image/jpeg','image/png','image/webp'],true)||!@getimagesize($file->getTempName()))$this->fail('Gunakan gambar JPG, PNG, atau WebP valid maksimal 2 MB.');
  $key=($product?'product/':'proof/').self::id().'.'.$file->guessExtension();$dir=WRITEPATH.'uploads/'.dirname($key);if(!is_dir($dir))mkdir($dir,0750,true);
  if($product){$file->move($dir,basename($key));return ['image'=>'/api/file/'.$key];}
  $id=(string)$request->getPost('order_id');$this->tx(function()use($id,$u,$file,$dir,$key){$this->one('SELECT id FROM orders WHERE id=?'.$this->lock(),[$id]);$o=$this->order($id);if($o['order_status']!=='pending_payment'||!in_array($o['payment']['payment_status'],['unpaid','rejected'],true))$this->fail('Bukti tidak dapat diunggah pada status ini.');$file->move($dir,basename($key));$this->update('payments',['order_id'=>$id],['proof_file'=>$key,'payment_status'=>'submitted','reason'=>null]);$this->update('orders',['id'=>$id],['order_status'=>'waiting_verification']);$this->audit($u,$id,'Bukti pembayaran diunggah');});return ['image'=>'/api/file/'.$key];
 }
 public function file(string $key):string{if(!preg_match('#^(proof|product)/[a-f0-9]{32}\.(jpg|jpeg|png|webp)$#',$key))$this->fail('File tidak ditemukan.',404);if(str_starts_with($key,'proof/')){$u=$this->user();$o=$this->one('SELECT o.user_id FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.proof_file=?',[$key]);if(!$o||($u['role']==='customer'&&(int)$o['user_id'] !== (int)$u['id_user']))$this->fail('Akses ditolak.',403);}$path=WRITEPATH.'uploads/'.$key;if(!is_file($path))$this->fail('File tidak ditemukan.',404);return $path;}
 public function overview():array{$u=$this->user(['admin','operator']);return ['products'=>$u['role']==='admin'?$this->one('SELECT COUNT(*) as n FROM products'):null,'customers'=>$u['role']==='admin'?$this->all("SELECT id_user AS id,name,email,role,created_at FROM users WHERE role='customer'"):[],'orders'=>$this->all('SELECT o.*,u.name,p.payment_status,s.shipment_status,s.courier,s.tracking_number FROM orders o JOIN users u ON u.id_user=o.user_id JOIN payments p ON p.order_id=o.id LEFT JOIN shipments s ON s.order_id=o.id ORDER BY o.created_at DESC'),'contacts'=>$u['role']==='admin'?$this->all('SELECT * FROM contacts ORDER BY created_at DESC'):[]];}
 public function category(array $b):array{$this->user(['admin']);$m=new CategoryModel();if(($b['action']??'')==='delete'){if((new ProductModel())->where('category_id',$b['id']??'')->first())$this->fail('Kategori masih digunakan produk.');$m->delete($b['id']??'');}else{$this->valid($b,['name'=>2]);$id=$b['id']??self::id();$data=['name'=>trim($b['name']),'slug'=>url_title($b['name'],'-',true),'description'=>mb_substr((string)($b['description']??''),0,1000)];if($m->find($id))$m->update($id,$data);else $m->insert(['id'=>$id]+$data);}return ['ok'=>true];}
 public function product(array $b):array{$this->user(['admin']);$m=new ProductModel();if(($b['action']??'')==='delete'){$m->update($b['id']??'',['status'=>'inactive']);return ['ok'=>true];}$this->valid($b,['name'=>3,'description'=>10,'category_id'=>1,'image'=>5]);if(!(new CategoryModel())->find($b['category_id'])||!in_array($b['status']??'',['active','inactive'],true))$this->fail('Kategori atau status tidak valid.');if(!preg_match('#^/(images/[a-z0-9-]+\.webp|api/file/product/[a-f0-9]{32}\.(jpg|jpeg|png|webp))$#',$b['image']))$this->fail('Unggah gambar produk yang valid.');$id=$b['id']??self::id();$data=['category_id'=>$b['category_id'],'name'=>mb_substr($b['name'],0,150),'description'=>$b['description'],'price'=>$this->number($b['price']??-1),'old_price'=>$this->number($b['old_price']??-1),'stock'=>$this->number($b['stock']??-1),'image'=>$b['image'],'status'=>$b['status']];if($m->find($id))$m->update($id,$data);else $m->insert(['id'=>$id,'slug'=>$id,'sold'=>0,'rating'=>'4.9','created_at'=>self::now()]+$data);return ['ok'=>true];}
 public function contact(array $b):array{$this->valid($b,['name'=>2,'email'=>5,'message'=>10]);if(!filter_var($b['email'],FILTER_VALIDATE_EMAIL))$this->fail('Email tidak valid.');$this->insert('contacts',['id'=>self::id(),'name'=>mb_substr($b['name'],0,100),'email'=>$b['email'],'message'=>$b['message'],'created_at'=>self::now()]);return ['ok'=>true];}
}
