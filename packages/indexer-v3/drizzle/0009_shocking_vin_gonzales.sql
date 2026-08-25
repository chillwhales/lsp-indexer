-- lsp-indexer-v3: destructive-replay
ALTER TABLE "chillwhales_nfts" ADD COLUMN "claim_check_after_block" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "chillwhales_nfts_claim_poll_idx" ON "chillwhales_nfts" USING btree ("chain_id","address","claim_check_after_block","token_id");--> statement-breakpoint
ALTER TABLE "chillwhales_nfts" ADD CONSTRAINT "chillwhales_nfts_claim_check_check" CHECK ("chillwhales_nfts"."claim_check_after_block" >= 0);--> statement-breakpoint
DO $$
DECLARE
	snapshot_trigger record;
	snapshot_function record;
	snapshot_table record;
BEGIN
	FOR snapshot_trigger IN
		SELECT trigger.tgname AS trigger_name, relation.relname AS table_name
		FROM pg_trigger trigger
		JOIN pg_class relation ON relation.oid = trigger.tgrelid
		JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
		WHERE namespace.nspname = current_schema()
			AND NOT trigger.tgisinternal
			AND trigger.tgname LIKE '%\_snapshot\_trigger' ESCAPE '\'
	LOOP
		EXECUTE format(
			'DROP TRIGGER %I ON %I.%I',
			snapshot_trigger.trigger_name,
			current_schema(),
			snapshot_trigger.table_name
		);
	END LOOP;

	FOR snapshot_function IN
		SELECT routine.proname AS function_name
		FROM pg_proc routine
		JOIN pg_namespace namespace ON namespace.oid = routine.pronamespace
		WHERE namespace.nspname = current_schema()
			AND routine.pronargs = 0
			AND routine.proname LIKE 'maybe\_snapshot\_%' ESCAPE '\'
	LOOP
		EXECUTE format(
			'DROP FUNCTION %I.%I()',
			current_schema(),
			snapshot_function.function_name
		);
	END LOOP;

	FOR snapshot_table IN
		SELECT tablename
		FROM pg_tables
		WHERE schemaname = current_schema()
			AND tablename LIKE '%\_\_snapshots' ESCAPE '\'
	LOOP
		EXECUTE format('DROP TABLE %I.%I', current_schema(), snapshot_table.tablename);
	END LOOP;
END
$$;--> statement-breakpoint
TRUNCATE TABLE
	"sqd_cursor",
	"blocks",
	"event_facts",
	"universal_profiles",
	"digital_assets",
	"nfts",
	"owned_assets",
	"owned_tokens",
	"follower_edges",
	"creators",
	"issued_assets",
	"controllers",
	"chillwhales_nfts",
	"data_values",
	"metadata_revisions",
	"metadata_jobs",
	"indexed_heads"
CASCADE;
