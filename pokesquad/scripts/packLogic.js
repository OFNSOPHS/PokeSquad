export const RARITIES = ["common", "uncommon", "rare", "legendary"];

export const ODDS_TIERS = {
  bench: { common: 0.6, uncommon: 0.26, rare: 0.11, legendary: 0.03 },
  starterNonFavorite: { common: 0.42, uncommon: 0.3, rare: 0.2, legendary: 0.08 },
  starterFavorite: { common: 0.2, uncommon: 0.28, rare: 0.34, legendary: 0.18 },
};

export const TYPE_WEIGHT_MULTIPLIER = 2.5;
export const SHINY_CHANCE = 1 / 100;
export const RARITY_VALUES = { common: 1, uncommon: 2, rare: 3, legendary: 5 };
export const SHINY_SCORE_BONUS = 2;

export function rollRarity(tier) {
  const odds = ODDS_TIERS[tier];
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of RARITIES) {
    cumulative += odds[rarity];
    if (roll < cumulative) return rarity;
  }
  return RARITIES[RARITIES.length - 1];
}

function weightedRandom(entries, weightFn) {
  const weights = entries.map(weightFn);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < entries.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return entries[i];
  }
  return entries[entries.length - 1];
}

/**
 * Rolls a single card. `type`, when set, biases the pick toward that type
 * within its rarity tier without excluding other types entirely.
 */
export function rollCard({ pool, tier, type = null }) {
  const rarity = rollRarity(tier);
  const candidates = pool.filter((p) => p.rarity === rarity);
  const pokemon = type
    ? weightedRandom(candidates, (p) => (p.type.includes(type) ? TYPE_WEIGHT_MULTIPLIER : 1))
    : candidates[Math.floor(Math.random() * candidates.length)];
  const shiny = Math.random() < SHINY_CHANCE;
  return { pokemon, rarity, shiny };
}

export function rollPackOptions({ pool, tier, type = null, count = 5 }) {
  return Array.from({ length: count }, () => rollCard({ pool, tier, type }));
}

export function scoreCard(card) {
  return RARITY_VALUES[card.rarity] + (card.shiny ? SHINY_SCORE_BONUS : 0);
}
