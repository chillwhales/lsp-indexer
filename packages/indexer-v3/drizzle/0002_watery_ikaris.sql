ALTER TABLE "event_facts" DROP CONSTRAINT "event_facts_block_fk";
--> statement-breakpoint
CREATE UNIQUE INDEX "blocks_chain_number_hash_uidx" ON "blocks" USING btree ("chain_id","number","hash");--> statement-breakpoint
ALTER TABLE "event_facts" ADD CONSTRAINT "event_facts_block_fk" FOREIGN KEY ("chain_id","block_number","block_hash") REFERENCES "blocks"("chain_id","number","hash") ON DELETE cascade ON UPDATE no action;
