CREATE TABLE "sqd_cursor" (
	"id" text NOT NULL,
	"current_number" numeric NOT NULL,
	"current_hash" text NOT NULL,
	"current_timestamp" timestamp with time zone,
	"finalized" jsonb,
	"rollback_chain" jsonb,
	CONSTRAINT "sqd_cursor_pk" PRIMARY KEY("id","current_number")
);
--> statement-breakpoint
DROP INDEX "data_values_scope_uidx";--> statement-breakpoint
DROP INDEX "metadata_jobs_revision_uidx";--> statement-breakpoint
DROP INDEX "metadata_revisions_natural_uidx";--> statement-breakpoint
CREATE INDEX "sqd_cursor_latest_idx" ON "sqd_cursor" USING btree ("id","current_number");--> statement-breakpoint
ALTER TABLE "data_values" ADD CONSTRAINT "data_values_scope_uidx" UNIQUE NULLS NOT DISTINCT("chain_id","address","token_id","data_key");--> statement-breakpoint
ALTER TABLE "metadata_jobs" ADD CONSTRAINT "metadata_jobs_revision_uidx" UNIQUE NULLS NOT DISTINCT("chain_id","address","token_id","data_key","source_revision");--> statement-breakpoint
ALTER TABLE "metadata_revisions" ADD CONSTRAINT "metadata_revisions_natural_uidx" UNIQUE NULLS NOT DISTINCT("chain_id","address","token_id","data_key","source_revision");