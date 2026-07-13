ALTER TABLE "screenshots" ADD COLUMN "evidence_tag" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "execution_timing" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "risk_acceptance_after_entry" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "management_mistake" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "edge_type" text;