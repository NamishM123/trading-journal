import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  doublePrecision,
  timestamp,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const setups = pgTable("setups", {
  id: serial("id").primaryKey(),
  // Nullable so rows from the single-user era stay valid but invisible.
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  rules: text("rules").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  isSample: boolean("is_sample").notNull().default(false),
  tradeDate: date("trade_date").notNull(),
  entryTime: text("entry_time"), // "HH:MM" 24h, drives time-of-day stats
  instrument: text("instrument").notNull(),
  direction: text("direction").notNull(), // long | short
  contracts: integer("contracts"),
  entryPrice: doublePrecision("entry_price"),
  exitPrice: doublePrecision("exit_price"),
  stopPrice: doublePrecision("stop_price"),
  targetPrice: doublePrecision("target_price"),
  pnl: doublePrecision("pnl").notNull().default(0),
  pnlPoints: doublePrecision("pnl_points"),
  plannedR: doublePrecision("planned_r"),
  realizedR: doublePrecision("realized_r"),

  // The Label Rule
  setupId: integer("setup_id").references(() => setups.id),
  noLabel: boolean("no_label").notNull().default(false),

  // Taper or monkey?
  location: text("location").notNull().default("unsure"), // taper | monkey | unsure

  // Trading in the Zone
  emotionBefore: text("emotion_before"),
  emotionDuring: text("emotion_during"),
  emotionAfter: text("emotion_after"),
  conviction: integer("conviction"), // 1-5
  followedRules: boolean("followed_rules"),
  acceptedRisk: boolean("accepted_risk"),
  executionGrade: text("execution_grade"), // A-F, process only

  // Execution timing
  executionTiming: text("execution_timing"), // early | onTime | late | chased | hesitated | beforeTrigger | afterTrigger

  // Risk acceptance after entry
  riskAcceptanceAfterEntry: text("risk_acceptance_after_entry"), // yes | no | moved | froze | cutEarly | addedEmotionally | hoped

  // Management mistakes
  managementMistake: text("management_mistake"), // none | stopWider | stopTight | cutWinnerEarly | didNotPayMyself | heldAfterFailed | addedWithoutPlan | exitedScared | ignoredReversal

  // Edge vs prediction vs impulse vs revenge
  edgeType: text("edge_type"), // edge | prediction | impulse | revenge

  // Narrative
  narrative: text("narrative").notNull().default(""),
  whatWentWell: text("what_went_well").notNull().default(""),
  whatToImprove: text("what_to_improve").notNull().default(""),

  youtubeUrl: text("youtube_url"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id")
    .notNull()
    .references(() => trades.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  chartType: text("chart_type").notNull().default("Other"),
  caption: text("caption").notNull().default(""),
  evidenceTag: text("evidence_tag"), // entry | absorption | reload | pullLiquidity | failedBreakout | deltaDivergence | footprintImbalance | domFlip | exitReason | mistakeEvidence
  sortOrder: integer("sort_order").notNull().default(0),
});

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    isSample: boolean("is_sample").notNull().default(false),
    entryDate: date("entry_date").notNull(),
    premarketPlan: text("premarket_plan").notNull().default(""),
    marketContext: text("market_context").notNull().default(""),
    mindset: text("mindset").notNull().default(""),
    review: text("review").notNull().default(""),
    dayGrade: text("day_grade"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("journal_entries_user_date").on(t.userId, t.entryDate)]
);

export const setupsRelations = relations(setups, ({ many }) => ({
  trades: many(trades),
}));

export const tradesRelations = relations(trades, ({ one, many }) => ({
  setup: one(setups, { fields: [trades.setupId], references: [setups.id] }),
  screenshots: many(screenshots),
}));

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
  trade: one(trades, { fields: [screenshots.tradeId], references: [trades.id] }),
}));

export type User = typeof users.$inferSelect;
export type Setup = typeof setups.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Screenshot = typeof screenshots.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;

export type TradeWithRelations = Trade & {
  setup: Setup | null;
  screenshots: Screenshot[];
};
