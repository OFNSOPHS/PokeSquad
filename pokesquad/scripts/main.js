import { rollPackOptions, scoreCard } from "./packLogic.js";

const POOL_URL = "data/pokemon.json";
const REVEAL_COUNT = 5;
const REVEAL_STAGGER_MS = 90;
const CHOSEN_HOLD_MS = 450;
const OVERLAY_FADE_MS = 200;

let pool = [];
let squadScore = 0;
const collectedTypes = new Set();
let activePack = null;

const revealOverlay = document.getElementById("revealOverlay");
const revealCardsEl = document.getElementById("revealCards");
const squadScoreEl = document.getElementById("squadScoreValue");
const typesCollectedEl = document.getElementById("typesCollected");

function getTierForPack(pack) {
  if (pack.classList.contains("pack--bench")) return "bench";
  return pack.classList.contains("is-favorite") ? "starterFavorite" : "starterNonFavorite";
}

function openPack(pack) {
  if (pack.classList.contains("is-opened") || pack.classList.contains("is-opening")) return;

  const tier = getTierForPack(pack);
  const type = pack.classList.contains("pack--starter") ? pack.dataset.type : null;
  const options = rollPackOptions({ pool, tier, type, count: REVEAL_COUNT });

  activePack = pack;
  pack.classList.add("is-opening");
  showReveal(options);
}

function showReveal(options) {
  revealCardsEl.innerHTML = "";

  options.forEach((card, index) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "reveal-card";
    el.dataset.type = card.pokemon.type[0];
    el.style.setProperty("--reveal-delay", `${index * REVEAL_STAGGER_MS}ms`);
    el.innerHTML = `
      <span class="reveal-card__rarity">${card.rarity}</span>
      <span class="reveal-card__name">${card.pokemon.name}</span>
      ${card.shiny ? '<span class="reveal-card__shiny">✨ Shiny</span>' : ""}
    `;
    el.addEventListener("click", () => chooseCard(card, el));
    revealCardsEl.appendChild(el);
  });

  revealOverlay.hidden = false;
  requestAnimationFrame(() => {
    revealOverlay.classList.add("is-visible");
  });
}

function chooseCard(card, chosenEl) {
  [...revealCardsEl.children].forEach((el) => {
    el.disabled = true;
  });
  chosenEl.classList.add("is-chosen");
  setTimeout(() => finalizePick(card), CHOSEN_HOLD_MS);
}

function finalizePick(card) {
  revealOverlay.classList.remove("is-visible");
  setTimeout(() => {
    revealOverlay.hidden = true;
    applyCardToPack(activePack, card);
    activePack.classList.remove("is-opening");
    activePack = null;
  }, OVERLAY_FADE_MS);
}

function applyCardToPack(pack, card) {
  pack.classList.add("is-opened");
  pack.dataset.type = card.pokemon.type[0];
  pack.disabled = true;
  pack.innerHTML = `
    <span class="pack__art"></span>
    <span class="pack__result-rarity">${card.rarity}</span>
    <span class="pack__result-name">${card.pokemon.name}</span>
    ${card.shiny ? '<span class="pack__result-shiny">✨</span>' : ""}
  `;

  squadScore += scoreCard(card);
  squadScoreEl.textContent = squadScore;

  card.pokemon.type.forEach((t) => collectedTypes.add(t));
  renderCollectedTypes();
}

function renderCollectedTypes() {
  typesCollectedEl.innerHTML = "";
  [...collectedTypes].forEach((type) => {
    const li = document.createElement("li");
    li.textContent = type;
    typesCollectedEl.appendChild(li);
  });
}

async function init() {
  const res = await fetch(POOL_URL);
  pool = await res.json();

  document.querySelectorAll(".pack").forEach((pack) => {
    pack.addEventListener("click", () => openPack(pack));
  });
}

init();
