<?php
$role = (string) session('role');
$current = uri_string();
$navigation = [
    ['path' => $role === 'operator' ? 'operator' : 'admin', 'label' => 'Dashboard'],
    ['path' => 'admin/products', 'label' => 'Produk'],
    ['path' => 'admin/categories', 'label' => 'Kategori'],
    ['path' => 'admin/inventory', 'label' => 'Inventori'],
];
if ($role === 'admin') $navigation[] = ['path' => 'admin/karyawan', 'label' => 'Data Karyawan'];
?>
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= esc($title) ?> | ShopEase</title>
    <link rel="stylesheet" href="<?= base_url('assets/bootstrap.min.css') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/management.css') ?>">
</head>
<body>
<div class="manage-shell">
    <aside class="manage-sidebar">
        <a class="logo" href="<?= site_url() ?>" aria-label="ShopEase, kembali ke beranda">Shop<span>Ease</span><b>.</b><small>Online Store</small></a>
        <p class="sidebar-label">PUSAT PENGELOLAAN</p>
        <nav class="manage-nav" aria-label="Menu pengelolaan">
            <?php foreach ($navigation as $item):
                $active = $current === $item['path'] || (!in_array($item['path'], ['admin', 'operator'], true) && str_starts_with($current, $item['path'] . '/'));
            ?>
                <a href="<?= site_url($item['path']) ?>" <?= $active ? 'class="active" aria-current="page"' : '' ?>><?= esc($item['label']) ?></a>
            <?php endforeach ?>
            <a href="<?= site_url('profil') ?>">Profil Saya</a>
            <a href="<?= site_url() ?>">Kembali ke Beranda</a>
        </nav>
        <form method="post" action="<?= site_url('logout') ?>">
            <?= csrf_field() ?>
            <button class="logout" type="submit">Keluar</button>
        </form>
    </aside>
    <div class="workspace">
        <header class="manage-header">
            <span>ShopEase <span class="header-separator">/</span> Pusat Pengelolaan</span>
            <span class="account-label"><?= esc(session('name')) ?> <span class="header-separator">·</span> <?= esc(ucfirst($role)) ?></span>
        </header>
        <main>
            <div class="heading">
                <p class="eyebrow">KELOLA TOKO DENGAN MUDAH</p>
                <h1><?= esc($title) ?></h1>
            </div>
            <?php foreach (['success', 'error'] as $type): ?>
                <?php if ($message = session()->getFlashdata($type)): ?>
                    <div role="status" class="alert alert-<?= $type === 'success' ? 'success' : 'danger' ?>"><?= esc($message) ?></div>
                <?php endif ?>
            <?php endforeach ?>
            <?php if ($errors = session()->getFlashdata('errors')): ?>
                <div class="alert alert-danger" role="alert"><ul>
                    <?php foreach ($errors as $error): ?><li><?= esc($error) ?></li><?php endforeach ?>
                </ul></div>
            <?php endif ?>
            <?= $this->renderSection('content') ?>
        </main>
        <footer>© 2026 ShopEase · Belanja Mudah & Aman</footer>
    </div>
</div>
</body>
</html>
