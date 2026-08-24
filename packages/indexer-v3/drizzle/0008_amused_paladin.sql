CREATE TABLE "chillwhales_nfts" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"address" varchar(42) NOT NULL,
	"token_id" varchar(66) NOT NULL,
	"chill_claimed" boolean DEFAULT false NOT NULL,
	"orbs_claimed" boolean DEFAULT false NOT NULL,
	"level" integer,
	"cooldown_expiry" bigint,
	"faction" text,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "chillwhales_nfts_pk" PRIMARY KEY("chain_id","address","token_id"),
	CONSTRAINT "chillwhales_nfts_address_check" CHECK ("chillwhales_nfts"."address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "chillwhales_nfts_token_id_check" CHECK ("chillwhales_nfts"."token_id" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "chillwhales_nfts_level_check" CHECK ("chillwhales_nfts"."level" IS NULL OR "chillwhales_nfts"."level" >= 0),
	CONSTRAINT "chillwhales_nfts_cooldown_check" CHECK ("chillwhales_nfts"."cooldown_expiry" IS NULL OR "chillwhales_nfts"."cooldown_expiry" >= 0),
	CONSTRAINT "chillwhales_nfts_block_check" CHECK ("chillwhales_nfts"."last_block_number" >= 0),
	CONSTRAINT "chillwhales_nfts_block_hash_check" CHECK ("chillwhales_nfts"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "controllers" ADD COLUMN "array_index" numeric(39, 0);--> statement-breakpoint
ALTER TABLE "creators" ADD COLUMN "interface_id" varchar(10);--> statement-breakpoint
ALTER TABLE "issued_assets" ADD COLUMN "interface_id" varchar(10);--> statement-breakpoint
ALTER TABLE "nfts" ADD COLUMN "formatted_token_id" text;--> statement-breakpoint
ALTER TABLE "nfts" ADD COLUMN "is_minted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nfts" ADD COLUMN "is_burned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chillwhales_nfts" ADD CONSTRAINT "chillwhales_nfts_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chillwhales_nfts" ADD CONSTRAINT "chillwhales_nfts_nft_fk" FOREIGN KEY ("chain_id","address","token_id") REFERENCES "nfts"("chain_id","address","token_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chillwhales_nfts_id_uidx" ON "chillwhales_nfts" USING btree ("id");--> statement-breakpoint
CREATE INDEX "chillwhales_nfts_game_idx" ON "chillwhales_nfts" USING btree ("address","level","cooldown_expiry");--> statement-breakpoint
CREATE UNIQUE INDEX "controllers_array_index_uidx" ON "controllers" USING btree ("chain_id","profile_address","array_index");--> statement-breakpoint
ALTER TABLE "controllers" ADD CONSTRAINT "controllers_array_index_check" CHECK ("controllers"."array_index" IS NULL OR "controllers"."array_index" >= 0);--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_interface_id_check" CHECK ("creators"."interface_id" IS NULL OR "creators"."interface_id" ~ '^0x[0-9a-f]{8}$');--> statement-breakpoint
ALTER TABLE "issued_assets" ADD CONSTRAINT "issued_assets_interface_id_check" CHECK ("issued_assets"."interface_id" IS NULL OR "issued_assets"."interface_id" ~ '^0x[0-9a-f]{8}$');