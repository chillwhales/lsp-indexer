ALTER TABLE "event_facts" ADD CONSTRAINT "event_facts_topics_check" CHECK (array_ndims("event_facts"."topics") = 1
        AND array_lower("event_facts"."topics", 1) = 1
        AND cardinality("event_facts"."topics") > 0
        AND "event_facts"."topics"[1] = "event_facts"."topic0"
        AND array_position("event_facts"."topics", NULL) IS NULL
        AND array_to_string("event_facts"."topics", ',') ~ '^0x[0-9a-f]{64}(,0x[0-9a-f]{64})*$');