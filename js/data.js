/* ==========================================================================
   AIET Stationery Hub — Seed Catalog, SVG Artwork & UI Helpers
   ========================================================================== */
window.AIET = window.AIET || {};

AIET.DEFAULT_SETTINGS = {
  instituteName: "Alva's Institute of Engineering and Technology",
  merchantUpi: "aiet.stationery@okicici",
  shopSecretCode: "AIET2026"
};

AIET.SEED_ITEMS = [
  {
    id: "item-blue-book",
    name: "Blue Book (Exam & Lab)",
    category: "Exam & Record Books",
    unit: "Book",
    price: 15,
    stock: 250,
    theme: "blue",
    badge: "Exam Essential",
    desc: "Official 24-page ruled internal assessment & laboratory blue book with AIET header format."
  },
  {
    id: "item-yellow-book",
    name: "Yellow Book (Assignment)",
    category: "Exam & Record Books",
    unit: "Book",
    price: 25,
    stock: 180,
    theme: "yellow",
    badge: "Popular",
    desc: "40-page heavy cover yellow assignment and practical record book for engineering courses."
  },
  {
    id: "item-graph-book",
    name: "Engineering Graph Book",
    category: "Sheets & Graph",
    unit: "Book",
    price: 35,
    stock: 120,
    theme: "graph",
    badge: "1mm Grid",
    desc: "32-page high-precision millimeter & centimeter engineering graph book for labs and math."
  },
  {
    id: "item-a4-single",
    name: "A4 Sheet (75 GSM Crisp)",
    category: "Sheets & Graph",
    unit: "Sheet",
    price: 2,
    stock: 2000,
    theme: "a4",
    badge: "Any Qty",
    desc: "Bright white 75 GSM A4 sheet for assignments, printouts, and project drafts. Order any quantity."
  },
  {
    id: "item-a4-pack",
    name: "A4 Sheet Bundle (100 Sheets)",
    category: "Sheets & Graph",
    unit: "Pack",
    price: 160,
    stock: 65,
    theme: "a4",
    badge: "Value Pack",
    desc: "Sealed 100-sheet A4 copier bundle (75 GSM) ideal for semester reports and seminar handouts."
  },
  {
    id: "item-rough-a4",
    name: "Rough Book (A4 Unruled 200p)",
    category: "Notebooks",
    unit: "Book",
    price: 45,
    stock: 160,
    theme: "rough",
    badge: "Bestseller",
    desc: "200-page unruled rough practice notebook with sturdy kraft cover for problem solving."
  },
  {
    id: "item-rough-ruled",
    name: "Rough Book (King Size Ruled)",
    category: "Notebooks",
    unit: "Book",
    price: 40,
    stock: 140,
    theme: "rough",
    badge: "180 Pages",
    desc: "Everyday king-size ruled rough notebook for classroom lecture notes and derivations."
  },
  {
    id: "item-ed-sheet",
    name: "Engineering Drawing Sheet (A2)",
    category: "Sheets & Graph",
    unit: "Sheet",
    price: 12,
    stock: 300,
    theme: "indigo",
    badge: "ED Lab",
    desc: "130 GSM cartridge drawing sheet for Engineering Graphics & CAD manual drafting."
  },
  {
    id: "item-blue-observation",
    name: "Lab Observation Record (Hardbound)",
    category: "Exam & Record Books",
    unit: "Book",
    price: 60,
    stock: 90,
    theme: "blue",
    badge: "Hardbound",
    desc: "120-page index-ready observation & circuit record book for CSE, ECE, and Mech labs."
  },
  {
    id: "item-pen-pack",
    name: "Exam Gel & Ball Pen Set (5 Pens)",
    category: "Writing & Tools",
    unit: "Pack",
    price: 50,
    stock: 110,
    theme: "indigo",
    badge: "0.7mm Smooth",
    desc: "Smudge-free waterproof blue and black exam pen combo pack (5 pens per pack)."
  }
];

AIET.renderProductSVG = function (theme) {
  switch (theme) {
    case "blue":
      return `
        <svg viewBox="0 0 120 120" fill="none">
          <rect x="24" y="14" width="72" height="92" rx="8" fill="#1D4ED8"/>
          <rect x="24" y="14" width="12" height="92" rx="4" fill="#1E3A8A"/>
          <rect x="44" y="28" width="42" height="22" rx="4" fill="#EFF6FF"/>
          <line x1="49" y1="36" x2="80" y2="36" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/>
          <line x1="49" y1="43" x2="72" y2="43" stroke="#93C5FD" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="65" cy="76" r="14" fill="rgba(255,255,255,0.16)"/>
          <path d="M58 76l5 5 10-10" stroke="#FBBF24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    case "yellow":
      return `
        <svg viewBox="0 0 120 120" fill="none">
          <rect x="24" y="14" width="72" height="92" rx="8" fill="#EAB308"/>
          <rect x="24" y="14" width="12" height="92" rx="4" fill="#CA8A04"/>
          <rect x="44" y="28" width="42" height="24" rx="4" fill="#FEFCE8"/>
          <line x1="49" y1="36" x2="80" y2="36" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>
          <line x1="49" y1="44" x2="74" y2="44" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="45" y="64" width="40" height="26" rx="4" fill="rgba(255,255,255,0.35)"/>
          <line x1="51" y1="73" x2="78" y2="73" stroke="#78350F" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="51" y1="81" x2="70" y2="81" stroke="#78350F" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`;
    case "graph":
      return `
        <svg viewBox="0 0 120 120" fill="none">
          <rect x="20" y="16" width="80" height="88" rx="8" fill="#ECFDF5" stroke="#059669" stroke-width="3"/>
          <g stroke="#6EE7B7" stroke-width="1.4">
            <line x1="36" y1="18" x2="36" y2="102"/><line x1="52" y1="18" x2="52" y2="102"/>
            <line x1="68" y1="18" x2="68" y2="102"/><line x1="84" y1="18" x2="84" y2="102"/>
            <line x1="22" y1="34" x2="98" y2="34"/><line x1="22" y1="50" x2="98" y2="50"/>
            <line x1="22" y1="66" x2="98" y2="66"/><line x1="22" y1="82" x2="98" y2="82"/>
          </g>
          <path d="M28 84 Q 50 40, 66 60 T 92 28" stroke="#047857" stroke-width="3.5" fill="none" stroke-linecap="round"/>
          <circle cx="66" cy="60" r="4" fill="#F59E0B"/>
          <circle cx="92" cy="28" r="4" fill="#F59E0B"/>
        </svg>`;
    case "a4":
      return `
        <svg viewBox="0 0 120 120" fill="none">
          <rect x="30" y="12" width="64" height="86" rx="5" fill="#CBD5E1"/>
          <rect x="24" y="18" width="64" height="86" rx="5" fill="#E2E8F0"/>
          <rect x="18" y="24" width="64" height="86" rx="6" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
          <line x1="28" y1="42" x2="72" y2="42" stroke="#1E3A8A" stroke-width="3" stroke-linecap="round"/>
          <line x1="28" y1="54" x2="72" y2="54" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="28" y1="64" x2="64" y2="64" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="28" y1="74" x2="70" y2="74" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="52" y="84" width="20" height="14" rx="3" fill="#2563EB"/>
        </svg>`;
    case "rough":
      return `
        <svg viewBox="0 0 120 120" fill="none">
          <rect x="26" y="14" width="70" height="92" rx="8" fill="#B45309"/>
          <rect x="26" y="14" width="11" height="92" rx="4" fill="#78350F"/>
          <g fill="#FDE68A">
            <circle cx="26" cy="28" r="3.5"/><circle cx="26" cy="44" r="3.5"/>
            <circle cx="26" cy="60" r="3.5"/><circle cx="26" cy="76" r="3.5"/>
            <circle cx="26" cy="92" r="3.5"/>
          </g>
          <rect x="46" y="30" width="40" height="22" rx="4" fill="#FFFBEB"/>
          <line x1="52" y1="41" x2="80" y2="41" stroke="#92400E" stroke-width="3" stroke-linecap="round"/>
          <path d="M50 78l18-18 8 8-18 18H50v-8z" fill="#FBBF24"/>
        </svg>`;
    default:
      return `
        <svg viewBox="0 0 120 120" fill="none">
          <rect x="22" y="18" width="76" height="84" rx="10" fill="#312E81"/>
          <path d="M36 84L84 36" stroke="#FBBF24" stroke-width="7" stroke-linecap="round"/>
          <path d="M84 36l6 6-48 48-9 3 3-9 48-48z" fill="#FDE68A"/>
          <circle cx="42" cy="42" r="10" fill="rgba(255,255,255,0.16)"/>
        </svg>`;
  }
};

AIET.sound = {
  enabled: true,
  ctx: null,
  play(type) {
    if (!this.enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) this.ctx = new AudioCtx();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === "pop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(860, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === "success") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.09);
        osc.frequency.setValueAtTime(783.99, now + 0.18);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (_) {
      /* Ignore audio restriction errors */
    }
  }
};

AIET.toast = function (message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(24px)";
    el.style.transition = "all 0.25s ease";
    setTimeout(() => el.remove(), 260);
  }, 3200);
};
