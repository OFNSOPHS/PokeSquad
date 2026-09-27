import { rollPackOptions, scoreCard } from "./packLogic.js";

const POOL_URL = "data/pokemon.json";
const REVEAL_COUNT = 5;
const REVEAL_STAGGER_MS = 90;
const CHOSEN_HOLD_MS = 450;
const OVERLAY_FADE_MS = 200;
const SHAKE_MS = 600;
const CRACK_MS = 250;
const RIP_MS = 500;

let pool = [];
let squadScore = 0;
const collectedTypes = new Set();
let activePack = null;

const revealOverlay = document.getElementById("revealOverlay");
const revealParticlesEl = document.getElementById("revealParticles");
const openingPack = document.getElementById("openingPack");
const revealTitle = document.getElementById("revealTitle");
const revealCardsEl = document.getElementById("revealCards");
const flipAllBtn = document.getElementById("flipAllBtn");
const revealControlsHint = document.getElementById("revealControlsHint");
const squadScoreEl = document.getElementById("squadScoreValue");
const typesCollectedEl = document.getElementById("typesCollected");

const PARTICLE_COUNT = 24;

function getTierForPack(pack) {
  if (pack.classList.contains("pack--bench")) return "bench";
  return pack.classList.contains("is-favorite") ? "starterFavorite" : "starterNonFavorite";
}

function openPack(pack) {
  if (pack.classList.contains("is-opened") || !revealOverlay.hidden) return;

  activePack = pack;
  const tier = getTierForPack(pack);
  const type = pack.classList.contains("pack--starter") ? pack.dataset.type : null;

  // Configure the big centered clone to match the clicked pack's colors/foil.
  openingPack.classList.toggle("pack--starter", pack.classList.contains("pack--starter"));
  openingPack.classList.toggle("pack--bench", pack.classList.contains("pack--bench"));
  if (type) {
    openingPack.dataset.type = type;
  } else {
    delete openingPack.dataset.type;
  }

  openingPack.hidden = false;
  revealTitle.hidden = true;
  revealCardsEl.hidden = true;
  revealCardsEl.innerHTML = "";
  flipAllBtn.hidden = true;
  revealControlsHint.hidden = true;

  revealOverlay.hidden = false;
  requestAnimationFrame(() => {
    revealOverlay.classList.add("is-visible");
  });

  openingPack.classList.add("is-shaking");

  setTimeout(() => {
    openingPack.classList.remove("is-shaking");
    openingPack.classList.add("is-cracking");

    setTimeout(() => {
      openingPack.classList.add("is-ripping");

      setTimeout(() => {
        openingPack.hidden = true;
        openingPack.classList.remove("is-cracking", "is-ripping");
        revealTitle.hidden = false;
        revealCardsEl.hidden = false;

        const options = rollPackOptions({ pool, tier, type, count: REVEAL_COUNT });
        showReveal(options);
      }, RIP_MS);
    }, CRACK_MS);
  }, SHAKE_MS);
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
      <span class="reveal-card__inner">
        <span class="reveal-card__face reveal-card__face--back">
          <span class="reveal-card__logo">PS</span>
        </span>
        <span class="reveal-card__face reveal-card__face--front">
          <span class="reveal-card__rarity">${card.rarity}</span>
          <span class="reveal-card__name">${card.pokemon.name}</span>
          ${card.shiny ? '<span class="reveal-card__shiny">✨ Shiny</span>' : ""}
        </span>
      </span>
    `;
    el.addEventListener("click", () => handleCardClick(card, el));
    revealCardsEl.appendChild(el);
  });

  flipAllBtn.hidden = false;
  revealControlsHint.hidden = false;

  revealOverlay.hidden = false;
  requestAnimationFrame(() => {
    revealOverlay.classList.add("is-visible");
  });
}

function handleCardClick(card, el) {
  if (!el.classList.contains("is-flipped")) {
    el.classList.add("is-flipped");
    return;
  }
  chooseCard(card, el);
}

function flipAllCards() {
  [...revealCardsEl.children].forEach((el) => el.classList.add("is-flipped"));
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
    activePack = null;
  }, OVERLAY_FADE_MS);
}

function applyCardToPack(pack, card) {
  pack.classList.add("is-opened");
  pack.dataset.type = card.pokemon.type[0];
  pack.disabled = true;
  pack.innerHTML = `
    <span class="pack__art"></span>
    <span class="pack__reveal">
      <span class="pack__result-rarity">${card.rarity}</span>
      <span class="pack__result-name">${card.pokemon.name}</span>
      ${card.shiny ? '<span class="pack__result-shiny">✨</span>' : ""}
    </span>
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

function renderParticles() {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const span = document.createElement("span");
    span.className = "reveal-overlay__particle";
    span.style.setProperty("--x", `${Math.random() * 100}%`);
    span.style.setProperty("--y", `${Math.random() * 100}%`);
    span.style.setProperty("--delay", `${(Math.random() * 7).toFixed(2)}s`);
    revealParticlesEl.appendChild(span);
  }
}

async function init() {
  const res = await fetch(POOL_URL);
  pool = await res.json();

  document.querySelectorAll(".starter-packs .pack, .bench-packs .pack").forEach((pack) => {
    pack.addEventListener("click", () => openPack(pack));
  });

  flipAllBtn.addEventListener("click", flipAllCards);

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !revealOverlay.hidden && !flipAllBtn.hidden && !event.repeat) {
      event.preventDefault();
      flipAllCards();
    }
  });

  renderParticles();
}

init();
