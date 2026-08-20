CREATE TABLE "blocks" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"number" bigint NOT NULL,
	"hash" varchar(66) NOT NULL,
	"parent_hash" varchar(66) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	CONSTRAINT "blocks_pk" PRIMARY KEY("chain_id","number"),
	CONSTRAINT "blocks_number_check" CHECK ("blocks"."number" >= 0),
	CONSTRAINT "blocks_hash_check" CHECK ("blocks"."hash" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "blocks_parent_hash_check" CHECK ("blocks"."parent_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "controllers" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"profile_address" varchar(42) NOT NULL,
	"controller_address" varchar(42) NOT NULL,
	"permissions" varchar(66),
	"allowed_calls" jsonb,
	"allowed_data_keys" jsonb,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "controllers_pk" PRIMARY KEY("chain_id","profile_address","controller_address"),
	CONSTRAINT "controllers_profile_check" CHECK ("controllers"."profile_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "controllers_controller_check" CHECK ("controllers"."controller_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "controllers_permissions_check" CHECK ("controllers"."permissions" IS NULL OR "controllers"."permissions" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "controllers_block_check" CHECK ("controllers"."last_block_number" >= 0),
	CONSTRAINT "controllers_block_hash_check" CHECK ("controllers"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"asset_address" varchar(42) NOT NULL,
	"creator_address" varchar(42) NOT NULL,
	"array_index" integer NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "creators_pk" PRIMARY KEY("chain_id","asset_address","creator_address"),
	CONSTRAINT "creators_asset_check" CHECK ("creators"."asset_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "creators_creator_check" CHECK ("creators"."creator_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "creators_array_index_check" CHECK ("creators"."array_index" >= 0),
	CONSTRAINT "creators_block_check" CHECK ("creators"."last_block_number" >= 0),
	CONSTRAINT "creators_block_hash_check" CHECK ("creators"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "data_values" (
	"id" text PRIMARY KEY NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"address" varchar(42) NOT NULL,
	"token_id" varchar(66),
	"data_key" varchar(66) NOT NULL,
	"data_value" text NOT NULL,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "data_values_address_check" CHECK ("data_values"."address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "data_values_token_id_check" CHECK ("data_values"."token_id" IS NULL OR "data_values"."token_id" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "data_values_data_key_check" CHECK ("data_values"."data_key" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "data_values_data_value_check" CHECK ("data_values"."data_value" ~ '^0x([0-9a-f]{2})*$'),
	CONSTRAINT "data_values_block_check" CHECK ("data_values"."last_block_number" >= 0),
	CONSTRAINT "data_values_block_hash_check" CHECK ("data_values"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "digital_assets" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"address" varchar(42) NOT NULL,
	"owner_address" varchar(42),
	"standard" "asset_standard" DEFAULT 'unknown' NOT NULL,
	"token_type" integer,
	"name" text,
	"symbol" text,
	"decimals" integer,
	"total_supply" numeric(78, 0),
	"token_id_format" integer,
	"token_id_reference_contract" varchar(42),
	"base_uri" text,
	"verification" "verification_status" DEFAULT 'unknown' NOT NULL,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "digital_assets_pk" PRIMARY KEY("chain_id","address"),
	CONSTRAINT "digital_assets_address_check" CHECK ("digital_assets"."address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "digital_assets_owner_address_check" CHECK ("digital_assets"."owner_address" IS NULL OR "digital_assets"."owner_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "digital_assets_reference_contract_check" CHECK ("digital_assets"."token_id_reference_contract" IS NULL OR "digital_assets"."token_id_reference_contract" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "digital_assets_decimals_check" CHECK ("digital_assets"."decimals" IS NULL OR ("digital_assets"."decimals" >= 0 AND "digital_assets"."decimals" <= 255)),
	CONSTRAINT "digital_assets_total_supply_check" CHECK ("digital_assets"."total_supply" IS NULL OR "digital_assets"."total_supply" >= 0),
	CONSTRAINT "digital_assets_block_check" CHECK ("digital_assets"."last_block_number" >= 0),
	CONSTRAINT "digital_assets_block_hash_check" CHECK ("digital_assets"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "event_facts" (
	"id" text PRIMARY KEY NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"block_number" bigint NOT NULL,
	"block_hash" varchar(66) NOT NULL,
	"parent_hash" varchar(66) NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"transaction_index" integer NOT NULL,
	"log_index" integer NOT NULL,
	"address" varchar(42) NOT NULL,
	"topic0" varchar(66) NOT NULL,
	"topics" text[] NOT NULL,
	"data" text NOT NULL,
	"event_name" text,
	"event_domain" text,
	"decoded" jsonb,
	CONSTRAINT "event_facts_block_number_check" CHECK ("event_facts"."block_number" >= 0),
	CONSTRAINT "event_facts_transaction_index_check" CHECK ("event_facts"."transaction_index" >= 0),
	CONSTRAINT "event_facts_log_index_check" CHECK ("event_facts"."log_index" >= 0),
	CONSTRAINT "event_facts_block_hash_check" CHECK ("event_facts"."block_hash" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "event_facts_parent_hash_check" CHECK ("event_facts"."parent_hash" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "event_facts_transaction_hash_check" CHECK ("event_facts"."transaction_hash" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "event_facts_address_check" CHECK ("event_facts"."address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "event_facts_topic0_check" CHECK ("event_facts"."topic0" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "event_facts_data_check" CHECK ("event_facts"."data" ~ '^0x([0-9a-f]{2})*$')
);
--> statement-breakpoint
CREATE TABLE "follower_edges" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"follower_address" varchar(42) NOT NULL,
	"followed_address" varchar(42) NOT NULL,
	"is_following" boolean NOT NULL,
	"followed_at" timestamp with time zone,
	"unfollowed_at" timestamp with time zone,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "follower_edges_pk" PRIMARY KEY("chain_id","follower_address","followed_address"),
	CONSTRAINT "follower_edges_follower_check" CHECK ("follower_edges"."follower_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "follower_edges_followed_check" CHECK ("follower_edges"."followed_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "follower_edges_distinct_check" CHECK ("follower_edges"."follower_address" <> "follower_edges"."followed_address"),
	CONSTRAINT "follower_edges_block_check" CHECK ("follower_edges"."last_block_number" >= 0),
	CONSTRAINT "follower_edges_block_hash_check" CHECK ("follower_edges"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "indexed_heads" (
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"block_number" bigint NOT NULL,
	"block_hash" varchar(66) NOT NULL,
	"block_timestamp" timestamp with time zone NOT NULL,
	"finalized_block_number" bigint,
	"finalized_block_hash" varchar(66),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "indexed_heads_pk" PRIMARY KEY("network","chain_id"),
	CONSTRAINT "indexed_heads_block_number_check" CHECK ("indexed_heads"."block_number" >= 0),
	CONSTRAINT "indexed_heads_block_hash_check" CHECK ("indexed_heads"."block_hash" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "indexed_heads_finalized_number_check" CHECK ("indexed_heads"."finalized_block_number" IS NULL OR ("indexed_heads"."finalized_block_number" >= 0 AND "indexed_heads"."finalized_block_number" <= "indexed_heads"."block_number")),
	CONSTRAINT "indexed_heads_finalized_hash_check" CHECK ("indexed_heads"."finalized_block_hash" IS NULL OR "indexed_heads"."finalized_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "issued_assets" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"issuer_address" varchar(42) NOT NULL,
	"asset_address" varchar(42) NOT NULL,
	"array_index" integer NOT NULL,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "issued_assets_pk" PRIMARY KEY("chain_id","issuer_address","asset_address"),
	CONSTRAINT "issued_assets_issuer_check" CHECK ("issued_assets"."issuer_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "issued_assets_asset_check" CHECK ("issued_assets"."asset_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "issued_assets_array_index_check" CHECK ("issued_assets"."array_index" >= 0),
	CONSTRAINT "issued_assets_block_check" CHECK ("issued_assets"."last_block_number" >= 0),
	CONSTRAINT "issued_assets_block_hash_check" CHECK ("issued_assets"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "metadata_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"kind" "metadata_kind" NOT NULL,
	"status" "metadata_job_status" DEFAULT 'pending' NOT NULL,
	"address" varchar(42) NOT NULL,
	"token_id" varchar(66),
	"data_key" varchar(66) NOT NULL,
	"source_revision" text NOT NULL,
	"content_uri" text NOT NULL,
	"content_hash" text,
	"source_block_number" bigint NOT NULL,
	"source_block_hash" varchar(66) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metadata_jobs_address_check" CHECK ("metadata_jobs"."address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "metadata_jobs_token_id_check" CHECK ("metadata_jobs"."token_id" IS NULL OR "metadata_jobs"."token_id" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "metadata_jobs_data_key_check" CHECK ("metadata_jobs"."data_key" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "metadata_jobs_source_block_check" CHECK ("metadata_jobs"."source_block_number" >= 0),
	CONSTRAINT "metadata_jobs_source_hash_check" CHECK ("metadata_jobs"."source_block_hash" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "metadata_jobs_attempts_check" CHECK ("metadata_jobs"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "metadata_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"kind" "metadata_kind" NOT NULL,
	"address" varchar(42) NOT NULL,
	"token_id" varchar(66),
	"data_key" varchar(66) NOT NULL,
	"source_revision" text NOT NULL,
	"content_uri" text NOT NULL,
	"content_hash" text,
	"content" jsonb,
	"content_type" text,
	"content_length" integer,
	"fetched_at" timestamp with time zone,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "metadata_revisions_address_check" CHECK ("metadata_revisions"."address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "metadata_revisions_token_id_check" CHECK ("metadata_revisions"."token_id" IS NULL OR "metadata_revisions"."token_id" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "metadata_revisions_data_key_check" CHECK ("metadata_revisions"."data_key" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "metadata_revisions_content_length_check" CHECK ("metadata_revisions"."content_length" IS NULL OR "metadata_revisions"."content_length" >= 0),
	CONSTRAINT "metadata_revisions_block_check" CHECK ("metadata_revisions"."last_block_number" >= 0),
	CONSTRAINT "metadata_revisions_block_hash_check" CHECK ("metadata_revisions"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "network_config" (
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"schema_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "network_config_pk" PRIMARY KEY("network","chain_id"),
	CONSTRAINT "network_config_network_check" CHECK ("network_config"."network" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "network_config_chain_id_check" CHECK ("network_config"."chain_id" > 0),
	CONSTRAINT "network_config_schema_version_check" CHECK ("network_config"."schema_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "nfts" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"address" varchar(42) NOT NULL,
	"token_id" varchar(66) NOT NULL,
	"owner_address" varchar(42),
	"token_uri" text,
	"verification" "verification_status" DEFAULT 'unknown' NOT NULL,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "nfts_pk" PRIMARY KEY("chain_id","address","token_id"),
	CONSTRAINT "nfts_address_check" CHECK ("nfts"."address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "nfts_token_id_check" CHECK ("nfts"."token_id" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "nfts_owner_address_check" CHECK ("nfts"."owner_address" IS NULL OR "nfts"."owner_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "nfts_block_check" CHECK ("nfts"."last_block_number" >= 0),
	CONSTRAINT "nfts_block_hash_check" CHECK ("nfts"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "owned_assets" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"owner_address" varchar(42) NOT NULL,
	"asset_address" varchar(42) NOT NULL,
	"balance" numeric(78, 0) NOT NULL,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "owned_assets_pk" PRIMARY KEY("chain_id","owner_address","asset_address"),
	CONSTRAINT "owned_assets_owner_check" CHECK ("owned_assets"."owner_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "owned_assets_asset_check" CHECK ("owned_assets"."asset_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "owned_assets_balance_check" CHECK ("owned_assets"."balance" >= 0),
	CONSTRAINT "owned_assets_block_check" CHECK ("owned_assets"."last_block_number" >= 0),
	CONSTRAINT "owned_assets_block_hash_check" CHECK ("owned_assets"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "owned_tokens" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"owner_address" varchar(42) NOT NULL,
	"asset_address" varchar(42) NOT NULL,
	"token_id" varchar(66) NOT NULL,
	"balance" numeric(78, 0) NOT NULL,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "owned_tokens_pk" PRIMARY KEY("chain_id","owner_address","asset_address","token_id"),
	CONSTRAINT "owned_tokens_owner_check" CHECK ("owned_tokens"."owner_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "owned_tokens_asset_check" CHECK ("owned_tokens"."asset_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "owned_tokens_token_id_check" CHECK ("owned_tokens"."token_id" ~ '^0x[0-9a-f]{64}$'),
	CONSTRAINT "owned_tokens_balance_check" CHECK ("owned_tokens"."balance" >= 0),
	CONSTRAINT "owned_tokens_block_check" CHECK ("owned_tokens"."last_block_number" >= 0),
	CONSTRAINT "owned_tokens_block_hash_check" CHECK ("owned_tokens"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "universal_profiles" (
	"id" text NOT NULL,
	"network" text NOT NULL,
	"chain_id" bigint NOT NULL,
	"address" varchar(42) NOT NULL,
	"owner_address" varchar(42),
	"verification" "verification_status" DEFAULT 'unknown' NOT NULL,
	"last_block_number" bigint NOT NULL,
	"last_block_hash" varchar(66) NOT NULL,
	"last_transaction_hash" varchar(66),
	"last_transaction_index" integer,
	"last_log_index" integer,
	CONSTRAINT "universal_profiles_pk" PRIMARY KEY("chain_id","address"),
	CONSTRAINT "universal_profiles_address_check" CHECK ("universal_profiles"."address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "universal_profiles_owner_address_check" CHECK ("universal_profiles"."owner_address" IS NULL OR "universal_profiles"."owner_address" ~ '^0x[0-9a-f]{40}$'),
	CONSTRAINT "universal_profiles_block_check" CHECK ("universal_profiles"."last_block_number" >= 0),
	CONSTRAINT "universal_profiles_block_hash_check" CHECK ("universal_profiles"."last_block_hash" ~ '^0x[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controllers" ADD CONSTRAINT "controllers_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controllers" ADD CONSTRAINT "controllers_profile_fk" FOREIGN KEY ("chain_id","profile_address") REFERENCES "universal_profiles"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_asset_fk" FOREIGN KEY ("chain_id","asset_address") REFERENCES "digital_assets"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_values" ADD CONSTRAINT "data_values_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_assets" ADD CONSTRAINT "digital_assets_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_facts" ADD CONSTRAINT "event_facts_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_facts" ADD CONSTRAINT "event_facts_block_fk" FOREIGN KEY ("chain_id","block_number") REFERENCES "blocks"("chain_id","number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follower_edges" ADD CONSTRAINT "follower_edges_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follower_edges" ADD CONSTRAINT "follower_edges_follower_fk" FOREIGN KEY ("chain_id","follower_address") REFERENCES "universal_profiles"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follower_edges" ADD CONSTRAINT "follower_edges_followed_fk" FOREIGN KEY ("chain_id","followed_address") REFERENCES "universal_profiles"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indexed_heads" ADD CONSTRAINT "indexed_heads_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_assets" ADD CONSTRAINT "issued_assets_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_assets" ADD CONSTRAINT "issued_assets_issuer_fk" FOREIGN KEY ("chain_id","issuer_address") REFERENCES "universal_profiles"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_assets" ADD CONSTRAINT "issued_assets_asset_fk" FOREIGN KEY ("chain_id","asset_address") REFERENCES "digital_assets"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metadata_jobs" ADD CONSTRAINT "metadata_jobs_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metadata_revisions" ADD CONSTRAINT "metadata_revisions_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_asset_fk" FOREIGN KEY ("chain_id","address") REFERENCES "digital_assets"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_assets" ADD CONSTRAINT "owned_assets_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_assets" ADD CONSTRAINT "owned_assets_owner_fk" FOREIGN KEY ("chain_id","owner_address") REFERENCES "universal_profiles"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_assets" ADD CONSTRAINT "owned_assets_asset_fk" FOREIGN KEY ("chain_id","asset_address") REFERENCES "digital_assets"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_tokens" ADD CONSTRAINT "owned_tokens_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_tokens" ADD CONSTRAINT "owned_tokens_owner_fk" FOREIGN KEY ("chain_id","owner_address") REFERENCES "universal_profiles"("chain_id","address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_tokens" ADD CONSTRAINT "owned_tokens_nft_fk" FOREIGN KEY ("chain_id","asset_address","token_id") REFERENCES "nfts"("chain_id","address","token_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universal_profiles" ADD CONSTRAINT "universal_profiles_network_fk" FOREIGN KEY ("network","chain_id") REFERENCES "network_config"("network","chain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blocks_id_uidx" ON "blocks" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "blocks_chain_hash_uidx" ON "blocks" USING btree ("chain_id","hash");--> statement-breakpoint
CREATE UNIQUE INDEX "controllers_id_uidx" ON "controllers" USING btree ("id");--> statement-breakpoint
CREATE INDEX "controllers_controller_idx" ON "controllers" USING btree ("controller_address");--> statement-breakpoint
CREATE UNIQUE INDEX "creators_id_uidx" ON "creators" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "creators_array_index_uidx" ON "creators" USING btree ("chain_id","asset_address","array_index");--> statement-breakpoint
CREATE INDEX "creators_creator_idx" ON "creators" USING btree ("creator_address");--> statement-breakpoint
CREATE UNIQUE INDEX "data_values_scope_uidx" ON "data_values" USING btree ("chain_id","address","token_id","data_key");--> statement-breakpoint
CREATE INDEX "data_values_address_key_idx" ON "data_values" USING btree ("address","data_key");--> statement-breakpoint
CREATE UNIQUE INDEX "digital_assets_id_uidx" ON "digital_assets" USING btree ("id");--> statement-breakpoint
CREATE INDEX "digital_assets_owner_idx" ON "digital_assets" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "digital_assets_standard_idx" ON "digital_assets" USING btree ("standard");--> statement-breakpoint
CREATE UNIQUE INDEX "event_facts_position_uidx" ON "event_facts" USING btree ("chain_id","block_number","transaction_index","log_index");--> statement-breakpoint
CREATE UNIQUE INDEX "event_facts_transaction_log_uidx" ON "event_facts" USING btree ("chain_id","transaction_hash","log_index");--> statement-breakpoint
CREATE INDEX "event_facts_address_block_idx" ON "event_facts" USING btree ("address","block_number");--> statement-breakpoint
CREATE INDEX "event_facts_topic0_block_idx" ON "event_facts" USING btree ("topic0","block_number");--> statement-breakpoint
CREATE UNIQUE INDEX "follower_edges_id_uidx" ON "follower_edges" USING btree ("id");--> statement-breakpoint
CREATE INDEX "follower_edges_followed_idx" ON "follower_edges" USING btree ("followed_address","is_following");--> statement-breakpoint
CREATE UNIQUE INDEX "issued_assets_id_uidx" ON "issued_assets" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "issued_assets_array_index_uidx" ON "issued_assets" USING btree ("chain_id","issuer_address","array_index");--> statement-breakpoint
CREATE INDEX "issued_assets_asset_idx" ON "issued_assets" USING btree ("asset_address");--> statement-breakpoint
CREATE UNIQUE INDEX "metadata_jobs_revision_uidx" ON "metadata_jobs" USING btree ("chain_id","address","token_id","data_key","source_revision");--> statement-breakpoint
CREATE INDEX "metadata_jobs_claim_idx" ON "metadata_jobs" USING btree ("status","next_attempt_at","source_block_number");--> statement-breakpoint
CREATE UNIQUE INDEX "metadata_revisions_natural_uidx" ON "metadata_revisions" USING btree ("chain_id","address","token_id","data_key","source_revision");--> statement-breakpoint
CREATE INDEX "metadata_revisions_current_idx" ON "metadata_revisions" USING btree ("chain_id","address","token_id","data_key","last_block_number");--> statement-breakpoint
CREATE UNIQUE INDEX "network_config_chain_id_uidx" ON "network_config" USING btree ("chain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nfts_id_uidx" ON "nfts" USING btree ("id");--> statement-breakpoint
CREATE INDEX "nfts_owner_idx" ON "nfts" USING btree ("owner_address");--> statement-breakpoint
CREATE UNIQUE INDEX "owned_assets_id_uidx" ON "owned_assets" USING btree ("id");--> statement-breakpoint
CREATE INDEX "owned_assets_asset_idx" ON "owned_assets" USING btree ("asset_address");--> statement-breakpoint
CREATE UNIQUE INDEX "owned_tokens_id_uidx" ON "owned_tokens" USING btree ("id");--> statement-breakpoint
CREATE INDEX "owned_tokens_asset_token_idx" ON "owned_tokens" USING btree ("asset_address","token_id");--> statement-breakpoint
CREATE UNIQUE INDEX "universal_profiles_id_uidx" ON "universal_profiles" USING btree ("id");--> statement-breakpoint
CREATE INDEX "universal_profiles_owner_idx" ON "universal_profiles" USING btree ("owner_address");
