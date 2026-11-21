<?php
use CodeIgniter\Router\RouteCollection;
/** @var RouteCollection $routes */
$routes->setAutoRoute(false);
$routes->get('/', 'HomeController::index');
$routes->get('about','HomeController::about');
$routes->get('contact','HomeController::contact');
$routes->get('catalog', 'HomeController::catalog');
$routes->get('products', 'HomeController::catalog');
$routes->get('wishlist', 'HomeController::wishlist');
foreach (['cart', 'checkout'] as $page) {
    $routes->get($page, static fn () => redirect()->to(site_url() . '#' . $page), ['filter' => 'auth:customer']);
}
$routes->get('orders', static fn () => redirect()->to(site_url() . '#orders'), ['filter' => 'auth:customer']);
$routes->get('seller', static fn () => redirect()->to(site_url(session('role'))), ['filter' => 'auth:admin,operator']);
$routes->get('register', 'AuthController::register');
$routes->post('register', 'AuthController::store');
$routes->get('login', 'AuthController::login');
$routes->post('login', 'AuthController::authenticate');
$routes->post('logout', 'AuthController::logout');
$routes->get('profil', 'AccountController::profil', ['filter' => 'auth']);
$routes->get('dashboard','AccountController::customer',['filter'=>'auth:customer']);
$routes->get('admin', 'AccountController::admin', ['filter' => 'auth:admin']);
$routes->get('operator', 'AccountController::operator', ['filter' => 'auth:operator']);
$routes->get('api/session','ApiController::session');
$routes->get('api/catalog','ProductController::catalog');
$routes->post('api/auth/login','AuthController::apiLogin');
$routes->post('api/auth/register','AuthController::apiRegister');
$routes->post('api/logout','AuthController::apiLogout');
$routes->post('api/contact','ApiController::contact');
$routes->get('api/file/(:any)','ApiController::file/$1');
$routes->group('api',['filter'=>'auth:customer,admin,operator'],static function($routes){
 $routes->get('orders','OrderController::index');
 $routes->get('orders/(:segment)','OrderController::detail/$1');
 $routes->post('order-action','OrderController::action');
});
$routes->group('api',['filter'=>'auth:customer'],static function($routes){
 $routes->post('profile','ApiController::profile');
 $routes->get('cart','CartController::index');
 $routes->post('cart','CartController::update');
 $routes->match(['GET','POST'],'addresses','CheckoutController::addresses');
 $routes->post('addresses/(:segment)/update','CheckoutController::updateAddress/$1');
 $routes->post('addresses/(:segment)/delete','CheckoutController::deleteAddress/$1');
 $routes->post('checkout','CheckoutController::index');
 $routes->post('upload/proof','ApiController::upload/proof');
});
$routes->get('api/admin/overview','Admin\DashboardController::index',['filter'=>'auth:admin,operator']);
$routes->group('api',['filter'=>'auth:admin'],static function($routes){
 $routes->get('admin/catalog','ProductController::managementCatalog');
 $routes->post('admin/category','Admin\CategoryController::save');
 $routes->post('admin/product','Admin\ProductController::save');
 $routes->post('upload/product','ApiController::upload/product');
});

$routes->group('admin', ['filter'=>'auth:admin,operator'], static function($routes){
 foreach(['products'=>'ProductController','categories'=>'CategoryController'] as $path=>$controller){
  $routes->get($path, 'Admin\\'.$controller.'::index');
  $routes->get($path.'/create', 'Admin\\'.$controller.'::create');
  $routes->post($path.'/store', 'Admin\\'.$controller.'::store');
  $routes->get($path.'/edit/(:segment)', 'Admin\\'.$controller.'::edit/$1');
  $routes->post($path.'/update/(:segment)', 'Admin\\'.$controller.'::update/$1');
  $routes->post($path.'/delete/(:segment)', 'Admin\\'.$controller.'::delete/$1');
 }
 $routes->post('products/(:segment)/images/(:num)/primary','Admin\ProductController::primary/$1/$2');
 $routes->post('products/(:segment)/images/(:num)/delete','Admin\ProductController::deleteImage/$1/$2');
 $routes->get('inventory','Admin\InventoryController::index');
 $routes->post('inventory/update/(:segment)','Admin\InventoryController::update/$1');
});
$routes->group('admin/karyawan',['filter'=>'auth:admin'],static function($routes){
 $routes->get('/','Admin\KaryawanController::index');
 $routes->get('create','Admin\KaryawanController::create');
 $routes->post('store','Admin\KaryawanController::store');
 $routes->get('edit/(:num)','Admin\KaryawanController::edit/$1');
 $routes->post('update/(:num)','Admin\KaryawanController::update/$1');
 $routes->post('delete/(:num)','Admin\KaryawanController::delete/$1');
});
