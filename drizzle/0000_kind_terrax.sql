CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_date" date NOT NULL,
	"premarket_plan" text DEFAULT '' NOT NULL,
	"market_context" text DEFAULT '' NOT NULL,
	"mindset" text DEFAULT '' NOT NULL,
	"review" text DEFAULT '' NOT NULL,
	"day_grade" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_entry_date_unique" UNIQUE("entry_date")
);
--> statement-breakpoint
CREATE TABLE "screenshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"trade_id" integer NOT NULL,
	"url" text NOT NULL,
	"chart_type" text DEFAULT 'Other' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"rules" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"trade_date" date NOT NULL,
	"instrument" text NOT NULL,
	"direction" text NOT NULL,
	"contracts" integer,
	"entry_price" double precision,
	"exit_price" double precision,
	"stop_price" double precision,
	"target_price" double precision,
	"pnl" double precision DEFAULT 0 NOT NULL,
	"pnl_points" double precision,
	"planned_r" double precision,
	"realized_r" double precision,
	"setup_id" integer,
	"no_label" boolean DEFAULT false NOT NULL,
	"location" text DEFAULT 'unsure' NOT NULL,
	"emotion_before" text,
	"emotion_during" text,
	"emotion_after" text,
	"conviction" integer,
	"followed_rules" boolean,
	"accepted_risk" boolean,
	"execution_grade" text,
	"narrative" text DEFAULT '' NOT NULL,
	"what_went_well" text DEFAULT '' NOT NULL,
	"what_to_improve" text DEFAULT '' NOT NULL,
	"youtube_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_setup_id_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."setups"("id") ON DELETE no action ON UPDATE no action;