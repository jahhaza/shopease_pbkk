CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`recipient_name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`province` text NOT NULL,
	`postal_code` text NOT NULL,
	`is_default` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);

CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`order_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `cart_product` ON `cart_items` (`cart_id`,`product_id`);
CREATE TABLE `carts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `carts_user_id_unique` ON `carts` (`user_id`);
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT ''
);

CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);

CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`subtotal` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`address_id` text NOT NULL,
	`order_number` text NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping_cost` integer NOT NULL,
	`total` integer NOT NULL,
	`order_status` text DEFAULT 'pending_payment' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`idempotency_key` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);
CREATE UNIQUE INDEX `orders_idempotency_key_unique` ON `orders` (`idempotency_key`);
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`method` text DEFAULT 'Transfer manual' NOT NULL,
	`amount` integer NOT NULL,
	`proof_file` text,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`verified_by` integer,
	`verified_at` text,
	`reason` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id_user`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `payments_order_id_unique` ON `payments` (`order_id`);
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`price` integer NOT NULL,
	`old_price` integer NOT NULL,
	`stock` integer NOT NULL,
	`image` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sold` integer DEFAULT 0 NOT NULL,
	`rating` text DEFAULT '4.9' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`courier` text,
	`tracking_number` text,
	`shipment_status` text DEFAULT 'pending' NOT NULL,
	`shipped_at` text,
	`delivered_at` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `shipments_order_id_unique` ON `shipments` (`order_id`);
CREATE TABLE `users` (
    `id_user` integer PRIMARY KEY AUTOINCREMENT,
    `name` text NOT NULL,
    `email` text NOT NULL COLLATE NOCASE,
    `password` text NOT NULL,
    `role` text NOT NULL DEFAULT 'customer' CHECK (`role` IN ('customer', 'admin', 'operator')),
    `phone` text,
    `address` text,
    `created_at` text,
    `updated_at` text
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);