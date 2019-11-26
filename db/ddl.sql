-- DROP SEQUENCE inventory.inventory_id_seq;

CREATE SEQUENCE inventory.inventory_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	CACHE 1
	NO CYCLE;
    
-- Drop table

-- DROP TABLE inventory.amazon_inventory;

CREATE TABLE inventory.amazon_inventory (
	id numeric NOT NULL DEFAULT nextval('inventory.inventory_id_seq'::regclass),
	item_sku text NULL,
	external_product_id text NOT NULL,
	external_product_id_type text NOT NULL,
	lead_time_to_ship int4 NULL,
	standard_price money NOT NULL,
	quantity int4 NOT NULL,
	condition_type varchar(50) NULL,
	sale_price money NULL,
	sale_start_date date NULL,
	sale_end_date date NULL,
	create_date timestamp NULL,
	update_date timestamp NULL,
	description text NULL,
	title text NULL,
	currency varchar(3) NULL,
	stock_info text NULL,
	CONSTRAINT amazon_inventory_pk PRIMARY KEY (id)
);
