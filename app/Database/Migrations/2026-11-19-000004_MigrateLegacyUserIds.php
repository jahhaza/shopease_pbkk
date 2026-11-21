<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class MigrateLegacyUserIds extends Migration
{
    public function up()
    {
        if ($this->db->fieldExists('id_user', 'users')) {
            return;
        }
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Migrasi ID pengguna lama membutuhkan MySQL.');
        }

        // Keep the legacy ID until every referencing row has its numeric replacement.
        $this->db->query('ALTER TABLE users ADD id_user INT NOT NULL AUTO_INCREMENT, ADD UNIQUE KEY id_user (id_user)');

        foreach (['carts', 'addresses', 'orders', 'audit', 'payments'] as $table) {
            $oldColumn = $table === 'payments' ? 'verified_by' : 'user_id';
            $constraints = $this->db->query(
                'SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE '
                . 'WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? '
                . "AND REFERENCED_TABLE_NAME = 'users'",
                [$table, $oldColumn]
            )->getResultArray();
            foreach ($constraints as $constraint) {
                $this->db->query('ALTER TABLE `' . $table . '` DROP FOREIGN KEY `' . $constraint['CONSTRAINT_NAME'] . '`');
            }

            $nullable = $table === 'payments' ? 'NULL' : 'NOT NULL';
            $this->db->query("ALTER TABLE `$table` CHANGE `$oldColumn` `legacy_user_id` VARCHAR(40) $nullable");
            $this->db->query("ALTER TABLE `$table` ADD `$oldColumn` INT NULL");
            $this->db->query("UPDATE `$table` t JOIN users u ON t.legacy_user_id = u.id SET t.`$oldColumn` = u.id_user");
            $unmapped = $this->db->query(
                "SELECT COUNT(*) AS n FROM `$table` WHERE legacy_user_id IS NOT NULL AND `$oldColumn` IS NULL"
            )->getRowArray();
            if ((int) $unmapped['n'] !== 0) {
                throw new RuntimeException("Relasi pengguna pada $table belum terpetakan.");
            }
            if ($table !== 'payments') {
                $this->db->query("ALTER TABLE `$table` MODIFY `$oldColumn` INT NOT NULL");
            }
            $this->db->query("ALTER TABLE `$table` DROP COLUMN legacy_user_id");
            if ($table === 'carts') {
                $this->db->query('ALTER TABLE carts ADD UNIQUE KEY user_id (user_id)');
            }
            $this->db->query("ALTER TABLE `$table` ADD CONSTRAINT `{$table}_user_id_fk` FOREIGN KEY (`$oldColumn`) REFERENCES users(id_user)");
        }

        $this->db->query(
            'ALTER TABLE users DROP PRIMARY KEY, MODIFY id VARCHAR(40) NULL, '
            . 'ADD PRIMARY KEY (id_user), ADD UNIQUE KEY legacy_id (id)'
        );
    }

    public function down()
    {
        // Preserving numeric IDs and dependent records takes precedence over rollback.
    }
}
