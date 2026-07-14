export const DEFAULT_SETUPS = [
  {
    name: "Re-bid / Re-offer",
    description:
      "Bids or offers get pulled and immediately reload at the same price, showing a participant unwilling to let price through.",
  },
  {
    name: "Trapped Buyers",
    description:
      "Late buyers stuck above value as price rejects. Their liquidation fuels the move down.",
  },
  {
    name: "Trapped Sellers",
    description:
      "Late sellers stuck below value as price rejects. Their covering fuels the move up.",
  },
  {
    name: "Absorption",
    description:
      "Aggressive market orders hit the book but price refuses to move. A passive player is absorbing everything.",
  },
  {
    name: "Large Buyer/Seller Defending Price",
    description:
      "A size player repeatedly defends a specific level, refreshing and holding it against pressure.",
  },
  {
    name: "Impulse High/Low of Trapped Distribution",
    description:
      "Trading the impulse high and low of an entire trapped distribution once the trapped side gives up.",
  },
];

export const EMOTIONS = [
  "Calm",
  "Confident",
  "Anxious",
  "FOMO",
  "Revenge",
  "Hesitant",
  "Overconfident",
  "Bored",
  "Tilted",
] as const;

export const GRADES = ["A", "B", "C", "D", "F"] as const;

export const CHART_TYPES = [
  "Delta",
  "Footprint",
  "DOM",
  "Volume Profile",
  "Market Structure",
  "Other",
] as const;

export const INSTRUMENTS = ["ES", "MES", "NQ", "MNQ", "YM", "RTY", "CL", "GC"];

export const LOCATIONS = [
  { value: "taper", label: "Taper, traded the edge or excess" },
  { value: "monkey", label: "Monkey, traded in balance" },
  { value: "unsure", label: "Unsure" },
] as const;

export const DIRECTIONS = [
  { value: "long", label: "Long" },
  { value: "short", label: "Short" },
] as const;

export const EXECUTION_TIMINGS = [
  "Early",
  "On time",
  "Late",
  "Chased",
  "Hesitated then entered worse",
  "Entered before trigger",
  "Entered after trigger was gone",
] as const;

export const RISK_ACCEPTANCE_AFTER_ENTRY = [
  "Yes",
  "No",
  "I moved it",
  "I froze",
  "I cut early from fear",
  "I added emotionally",
  "I hoped",
] as const;

export const MANAGEMENT_MISTAKES = [
  "None",
  "Moved stop wider",
  "Moved stop too tight",
  "Cut winner early",
  "Did not pay myself",
  "Held after absorption failed",
  "Added without plan",
  "Exited because scared",
  "Ignored reversal on DOM",
] as const;

export const EDGE_TYPES = [
  { value: "edge", label: "Edge, repeatable behavior at a meaningful location" },
  { value: "prediction", label: "Prediction, thought price should go there" },
  { value: "impulse", label: "Impulse, clicked before information" },
  { value: "revenge", label: "Revenge, wanted money back" },
] as const;

export const EVIDENCE_TAGS = [
  "Entry moment",
  "Absorption",
  "Reload",
  "Pulling liquidity",
  "Failed breakout",
  "Delta divergence",
  "Footprint imbalance",
  "DOM flip",
  "Exit reason",
  "Mistake evidence",
] as const;

// Mark Douglas, Trading in the Zone
export const FIVE_TRUTHS = [
  "Anything can happen.",
  "You don't need to know what is going to happen next in order to make money.",
  "There is a random distribution between wins and losses for any given set of variables that define an edge.",
  "An edge is nothing more than an indication of a higher probability of one thing happening over another.",
  "Every moment in the market is unique.",
];

export const DOUGLAS_QUOTES = [
  ...FIVE_TRUTHS,
  "The consistency you seek is in your mind, not in the markets.",
  "Trading is a probability game. You don't have to be right on this trade. You have to execute your edge.",
  "When you really believe that trading is simply a probability game, concepts like right and wrong or win and lose no longer have the same significance.",
  "I predefine my risk, and I completely accept it before I put on a trade.",
];

export const SAMPLE_SIZE_TARGET = 20;

// Pages using these render dynamically per-request; rotate by day.
export function quoteOfTheDay(): string {
  return DOUGLAS_QUOTES[Math.floor(Date.now() / 86_400_000) % DOUGLAS_QUOTES.length];
}

export function truthOfTheDay(): string {
  return FIVE_TRUTHS[Math.floor(Date.now() / 86_400_000) % FIVE_TRUTHS.length];
}
