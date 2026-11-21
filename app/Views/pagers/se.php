<?php $pager->setSurroundCount(2); ?>
<nav aria-label="Halaman data"><ul class="pagination justify-content-center mt-4">
<?php if($pager->hasPrevious()): ?><li class="page-item"><a class="page-link" href="<?= $pager->getPrevious() ?>">Sebelumnya</a></li><?php endif ?>
<?php foreach($pager->links() as $link): ?><li class="page-item <?= $link['active']?'active':'' ?>"><a class="page-link" href="<?= $link['uri'] ?>"><?= $link['title'] ?></a></li><?php endforeach ?>
<?php if($pager->hasNext()): ?><li class="page-item"><a class="page-link" href="<?= $pager->getNext() ?>">Berikutnya</a></li><?php endif ?>
</ul></nav>
