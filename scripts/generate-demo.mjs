// Generates demo artwork (public/demo/*.svg) and supabase/seed.sql.
// Demo products and articles are flagged is_demo = true so they can be
// removed in one step before launch (Admin → Settings → Demo data, or
// supabase/demo/remove_demo_data.sql).
//
// Usage: node scripts/generate-demo.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const demoDir = join(root, "public", "demo");
mkdirSync(demoDir, { recursive: true });

// ---------------------------------------------------------------------------
// SVG artwork
// ---------------------------------------------------------------------------
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const patterns = {
  lace: (c) => `
    <pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse">
      <circle cx="30" cy="30" r="14" fill="none" stroke="${shade(c, 60)}" stroke-width="1.4" opacity=".55"/>
      <circle cx="30" cy="30" r="6" fill="none" stroke="${shade(c, 70)}" stroke-width="1" opacity=".6"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="30" cy="12" rx="3" ry="7" transform="rotate(${a} 30 30)" fill="${shade(c, 55)}" opacity=".35"/>`).join("")}
      <circle cx="0" cy="0" r="4" fill="${shade(c, 50)}" opacity=".4"/><circle cx="60" cy="60" r="4" fill="${shade(c, 50)}" opacity=".4"/>
      <circle cx="60" cy="0" r="4" fill="${shade(c, 50)}" opacity=".4"/><circle cx="0" cy="60" r="4" fill="${shade(c, 50)}" opacity=".4"/>
    </pattern>`,
  crystal: (c) => `
    <pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M22 6 L28 22 L22 38 L16 22 Z" fill="#ffffff" opacity=".22"/>
      <path d="M22 14 L25 22 L22 30 L19 22 Z" fill="#ffffff" opacity=".5"/>
      <circle cx="4" cy="4" r="2" fill="#fff" opacity=".7"/><circle cx="40" cy="40" r="1.6" fill="#fff" opacity=".6"/>
      <circle cx="40" cy="6" r="1.2" fill="${shade(c, 80)}" opacity=".8"/>
    </pattern>`,
  beads: (c) => `
    <pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="7" cy="7" r="3.4" fill="${shade(c, 70)}" opacity=".7"/>
      <circle cx="21" cy="21" r="3.4" fill="${shade(c, 70)}" opacity=".7"/>
      <circle cx="6" cy="6" r="1.1" fill="#fff" opacity=".8"/><circle cx="20" cy="20" r="1.1" fill="#fff" opacity=".8"/>
      <path d="M0 14 Q7 10 14 14 T28 14" stroke="${shade(c, 45)}" fill="none" opacity=".4"/>
    </pattern>`,
  panel: (c) => `
    <pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse">
      <rect width="80" height="80" fill="none"/>
      <path d="M40 8 C52 24 52 56 40 72 C28 56 28 24 40 8Z" fill="${shade(c, 50)}" opacity=".35"/>
      <path d="M8 40 C24 28 56 28 72 40 C56 52 24 52 8 40Z" fill="${shade(c, 35)}" opacity=".3"/>
      <circle cx="40" cy="40" r="5" fill="${shade(c, 90)}" opacity=".6"/>
    </pattern>`,
  geometric: (c) => `
    <pattern id="p" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M25 0 L50 25 L25 50 L0 25Z" fill="none" stroke="${shade(c, 60)}" stroke-width="2" opacity=".45"/>
      <path d="M25 12 L38 25 L25 38 L12 25Z" fill="${shade(c, 40)}" opacity=".35"/>
      <circle cx="25" cy="25" r="3" fill="#fff" opacity=".55"/>
    </pattern>`,
  weave: (c) => `
    <pattern id="p" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 3 H12 M0 9 H12" stroke="${shade(c, 25)}" stroke-width="2" opacity=".45"/>
      <path d="M3 0 V12 M9 0 V12" stroke="${shade(c, -20)}" stroke-width="1" opacity=".35"/>
    </pattern>`,
  damask: (c) => `
    <pattern id="p" width="70" height="90" patternUnits="userSpaceOnUse">
      <path d="M35 6 C48 20 48 34 35 45 C22 34 22 20 35 6Z M35 45 C50 55 50 75 35 84 C20 75 20 55 35 45Z" fill="${shade(c, 45)}" opacity=".35"/>
      <path d="M0 45 C10 40 14 30 10 20 M70 45 C60 40 56 30 60 20" stroke="${shade(c, 60)}" fill="none" opacity=".35"/>
    </pattern>`,
  satin: () => `
    <pattern id="p" width="200" height="200" patternUnits="userSpaceOnUse">
      <rect width="200" height="200" fill="none"/>
    </pattern>`,
};

function fabricSvg({ colour, pattern, accent = "#d8b878", label, object }) {
  const c = colour;
  const objectMarkup =
    object === "clutch"
      ? `<g transform="translate(400 520)">
          <ellipse cx="0" cy="190" rx="230" ry="26" fill="#000" opacity=".12"/>
          <path d="M-220 -40 Q-230 160 -200 170 L200 170 Q230 160 220 -40 Z" fill="url(#body)"/>
          <rect x="-220" y="-40" width="440" height="210" rx="40" fill="url(#p)" opacity=".9"/>
          <path d="M-225 -40 Q0 -150 225 -40 Z" fill="${shade(c, -25)}"/>
          <rect x="-36" y="-56" width="72" height="34" rx="10" fill="${accent}"/>
          <circle cx="0" cy="-39" r="9" fill="#fff" opacity=".7"/>
        </g>`
      : object === "jewel"
        ? `<g transform="translate(400 460)" fill="none">
            <path d="M-210 -80 Q0 260 210 -80" stroke="${accent}" stroke-width="10" opacity=".9"/>
            ${Array.from({ length: 15 }, (_, i) => {
              const t = i / 14;
              const x = -210 + 420 * t;
              const y = -80 + 340 * t * (1 - t) * 1.0 + 0;
              return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${14 + (i % 3) * 3}" fill="${c}" stroke="${shade(c, 50)}" stroke-width="3"/>`;
            }).join("")}
            <path d="M0 160 l26 50 l-26 40 l-26 -40z" fill="${accent}"/>
          </g>`
        : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="${label.replace(/"/g, "")}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${shade(c, 35)}"/>
      <stop offset=".5" stop-color="${c}"/>
      <stop offset="1" stop-color="${shade(c, -45)}"/>
    </linearGradient>
    <linearGradient id="fold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset=".18" stop-color="#000" stop-opacity=".18"/>
      <stop offset=".32" stop-color="#fff" stop-opacity=".18"/>
      <stop offset=".5" stop-color="#000" stop-opacity=".12"/>
      <stop offset=".68" stop-color="#fff" stop-opacity=".22"/>
      <stop offset=".84" stop-color="#000" stop-opacity=".2"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".08"/>
    </linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(c, 20)}"/><stop offset="1" stop-color="${shade(c, -40)}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".3" cy=".2" r=".9">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    ${patterns[pattern](c)}
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  ${object ? `<rect width="800" height="1000" fill="#f5efe6" opacity=".55"/>` : `<rect width="800" height="1000" fill="url(#p)"/><rect width="800" height="1000" fill="url(#fold)"/>`}
  <rect width="800" height="1000" fill="url(#glow)"/>
  ${objectMarkup}
</svg>`;
}

function write(name, svg) {
  writeFileSync(join(demoDir, name), svg);
  return `/demo/${name}`;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const categories = [
  { slug: "luxury-crystal-fabrics", name: "Luxury Crystal Fabrics", pattern: "crystal", colour: "#b79a72", description: "Hand-set crystals and stone-encrusted tulle that catch every light." },
  { slug: "beaded-fabrics", name: "Beaded Fabrics", pattern: "beads", colour: "#7a2333", description: "Intricately hand-beaded laces for statement celebration looks." },
  { slug: "panel-dress-fabrics", name: "Panel Dress Fabrics", pattern: "panel", colour: "#c86b5a", description: "Engineered panel laces designed for sculpted silhouettes." },
  { slug: "bridal-fabrics", name: "Bridal Fabrics", pattern: "lace", colour: "#e9dfcf", description: "Ivory laces, satins and tulles for the bride's most important day." },
  { slug: "owanbe-fabrics", name: "Owanbe Fabrics", pattern: "geometric", colour: "#a8326e", description: "Bold, joyful fabrics made for the party and the dance floor." },
  { slug: "mens-fabrics", name: "Men's Fabrics", pattern: "weave", colour: "#3d4250", description: "Cashmere wools, voiles and brocades for distinguished agbada and senator styles." },
  { slug: "clutch-purses", name: "Clutch Purses", pattern: "beads", colour: "#6d1f2c", object: "clutch", description: "Jewelled clutches to finish every celebration look." },
  { slug: "accessories", name: "Accessories", pattern: "beads", colour: "#c4a46a", object: "jewel", description: "Coral beads, hair combs, fans and gele to complete the ensemble." },
];

const P = (o) => o;
const products = [
  P({ cat: "luxury-crystal-fabrics", name: "Celestine Crystal Tulle", price: 480000, unit: "bundle_4_yard", fabric: "Crystal tulle", flags: ["featured", "new", "best"], sales: 42,
      colours: [["Champagne", "#c9ad7f", 6], ["Silver Mist", "#a9adb5", 4], ["Rose Gold", "#c48f7d", 3]],
      short: "Fine bridal tulle encrusted with hand-set Austrian-cut crystals.",
      desc: "Celestine is our signature crystal tulle: a featherweight net base densely hand-set with precision-cut crystals that shimmer with every movement. It drapes beautifully for reception gowns, trains and statement sleeves.\n\nEach bundle is cut from a single bolt so the crystal density is consistent across all four yards." }),
  P({ cat: "luxury-crystal-fabrics", name: "Aurora Stone-Encrusted Lace", price: 520000, unit: "bundle_5_yard", fabric: "Stone lace", flags: ["featured"], sales: 18,
      colours: [["Ivory", "#ece3d2", 3], ["Emerald", "#1f6b52", 5], ["Wine", "#6e1f2f", 4]],
      short: "Corded lace embellished with heavy stonework and crystal clusters.",
      desc: "Aurora pairs a rich corded lace with heavy stone clusters for an opulent finish worthy of a grand entrance. Ideal for traditional wedding outfits and milestone celebrations." }),
  P({ cat: "luxury-crystal-fabrics", name: "Starlight Crystal Mesh", price: 395000, unit: "bundle_4_yard", fabric: "Crystal mesh", flags: ["new"], sales: 9,
      colours: [["Blush", "#e3b7b0", 5], ["Lilac", "#b6a2c9", 0]],
      short: "Soft stretch mesh scattered with crystal starbursts.",
      desc: "A soft, gently stretching mesh scattered with crystal starbursts. Starlight flatters fitted silhouettes and layers beautifully over satin." }),
  P({ cat: "beaded-fabrics", name: "Adaeze Hand-Beaded Lace", price: 78000, unit: "per_yard", fabric: "Beaded lace", flags: ["best"], sales: 120,
      colours: [["Gold", "#c8a14d", 40], ["Teal", "#1f6e72", 25], ["Burgundy", "#6c1d2c", 30]],
      short: "Floral lace hand-finished with glass beads and bugle beading.",
      desc: "Adaeze is hand-finished by artisans who outline every floral motif with glass seed beads and bugle beading. Sold per yard so you can buy precisely what your design needs." }),
  P({ cat: "beaded-fabrics", name: "Pearl Cascade Beaded Tulle", price: 85000, unit: "per_yard", fabric: "Beaded tulle", flags: ["new", "featured"], sales: 33,
      colours: [["Pearl White", "#f1ede4", 30], ["Champagne", "#d6bf94", 18]],
      short: "Tulle embroidered with cascading pearls and sequin trails.",
      desc: "Cascading freshwater-style pearls and fine sequin trails on a soft bridal tulle. Perfect for bridal overlays, veils and second-look dresses." }),
  P({ cat: "beaded-fabrics", name: "Royal Sequin Embroidered Lace", price: 310000, unit: "bundle_5_yard", fabric: "Sequin lace", flags: [], sales: 21,
      colours: [["Navy", "#1f2a4a", 6], ["Copper", "#a8623a", 4]],
      short: "Embroidered lace with sequin scrolls and beaded borders.",
      desc: "A regal embroidered lace with sequin scrollwork and finished beaded borders — a confident choice for mothers of the couple and guests of honour." }),
  P({ cat: "bridal-fabrics", name: "Premium Bridal Lace", price: 65000, unit: "per_yard", fabric: "Bridal lace", flags: ["best", "featured"], sales: 160,
      colours: [["Ivory", "#efe6d4", 60], ["Off-White", "#f4f1ea", 45]],
      short: "Classic floral bridal lace with scalloped eyelash edges.",
      desc: "Our most-loved bridal lace: a delicate floral net with scalloped eyelash edges on both selvedges. Soft against the skin and easy for your designer to appliqué." }),
  P({ cat: "bridal-fabrics", name: "Chantilly Bridal Lace", price: 72000, unit: "per_yard", fabric: "Chantilly lace", flags: ["new"], sales: 27,
      colours: [["Ivory", "#ede3cf", 35], ["Champagne", "#dcc7a0", 20]],
      short: "Fine Chantilly-style lace with a gossamer-light hand.",
      desc: "A gossamer-light Chantilly-style lace with finely outlined florals. Beautiful for sleeves, illusion necklines and layered skirts." }),
  P({ cat: "bridal-fabrics", name: "Duchess Bridal Satin", price: 38000, unit: "per_yard", fabric: "Duchess satin", flags: [], sales: 54,
      colours: [["Ivory", "#efe7d6", 80], ["Pure White", "#fafafa", 70]],
      short: "Structured duchess satin with a luminous finish.", pattern: "satin",
      desc: "A heavyweight duchess satin with a soft lustre and enough body to hold structured bodices and ball-gown skirts." }),
  P({ cat: "panel-dress-fabrics", name: "Ọ̀ṣun Panel Lace", price: 265000, unit: "bundle_5_yard", fabric: "Panel lace", flags: ["featured", "new"], sales: 15,
      colours: [["Coral", "#d4705e", 5], ["Gold", "#c7a04e", 7]],
      short: "Engineered panel lace with graduated floral placement.",
      desc: "Ọ̀ṣun is engineered as a panel: florals are placed to flow from bodice to hem, so your designer can create a sculpted gown with minimal piecing." }),
  P({ cat: "panel-dress-fabrics", name: "Mosaic 3D Floral Panel", price: 290000, unit: "bundle_5_yard", fabric: "3D floral lace", flags: [], sales: 8,
      colours: [["Sage", "#94a48a", 4], ["Dusty Pink", "#c99a9a", 2]],
      short: "Three-dimensional petals on a placement-printed panel.",
      desc: "Hand-applied three-dimensional petals on a placement panel for a romantic, garden-inspired silhouette." }),
  P({ cat: "owanbe-fabrics", name: "Ẹ̀yẹ Corded Lace", price: 145000, unit: "bundle_5_yard", fabric: "Corded lace", flags: ["best"], sales: 88,
      colours: [["Fuchsia", "#b0306e", 20], ["Royal Blue", "#2546a3", 15], ["Orange", "#e0762f", 12]],
      short: "Vibrant corded lace — the Asoebi favourite.",
      desc: "Bold colour, crisp cording and a generous width make Ẹ̀yẹ the go-to Asoebi lace for large parties. Available in deep stock for group orders." }),
  P({ cat: "owanbe-fabrics", name: "Owambe Organza Sequin", price: 120000, unit: "bundle_5_yard", fabric: "Sequin organza", flags: ["new"], sales: 14,
      colours: [["Gold", "#d2ad55", 14], ["Silver", "#b8bcc4", 10]],
      short: "Crisp organza covered in liquid-shine sequins.", pattern: "crystal",
      desc: "Crisp organza covered edge to edge in liquid-shine sequins — made for the dance floor." }),
  P({ cat: "owanbe-fabrics", name: "Aso-Oke Damask Gele Set", price: 45000, unit: "per_set", fabric: "Aso-oke", flags: ["best"], sales: 75, pattern: "damask",
      colours: [["Wine", "#6e1f2f", 30], ["Emerald", "#1f6b52", 22], ["Gold", "#c8a14d", 26]],
      short: "Hand-woven aso-oke gele and ìpèlé set.",
      desc: "A hand-woven aso-oke set comprising a full-length gele and matching ìpèlé shoulder piece, woven with a subtle damask motif." }),
  P({ cat: "mens-fabrics", name: "Heritage Cashmere Wool", price: 22000, unit: "per_yard", fabric: "Cashmere wool", flags: ["featured"], sales: 65,
      colours: [["Charcoal", "#3a3d44", 60], ["Navy", "#1e2740", 50], ["Cream", "#e5dccb", 40]],
      short: "Soft, fine cashmere-blend wool for kaftans and senators.",
      desc: "A fine cashmere-blend suiting wool with a gentle drape. Ideal for kaftans, senator styles and tailored trousers." }),
  P({ cat: "mens-fabrics", name: "Royal Senator Swiss Voile", price: 28000, unit: "per_yard", fabric: "Swiss voile", flags: ["new"], sales: 31,
      colours: [["White", "#f7f7f5", 50], ["Sky Blue", "#a9c4dd", 30]],
      short: "Breathable Swiss voile with embroidered eyelets.", pattern: "lace",
      desc: "A breathable Swiss voile with delicate embroidered eyelets — a refined choice for celebrations in the heat." }),
  P({ cat: "mens-fabrics", name: "Grand Agbada Brocade", price: 240000, unit: "custom", unitLabel: "10-yard Agbada set", fabric: "Brocade", flags: ["featured"], sales: 12, pattern: "damask",
      colours: [["Ivory", "#e9dfcb", 6], ["Black", "#1d1d1f", 5], ["Burgundy", "#5e1a28", 4]],
      short: "Jacquard brocade cut as a full 10-yard agbada set.",
      desc: "A substantial jacquard brocade cut as a complete ten-yard set, enough for a three-piece agbada with embroidery allowance." }),
  P({ cat: "clutch-purses", name: "Ìfẹ́ Crystal Box Clutch", price: 68000, unit: "per_item", fabric: "Crystal-embellished metal", flags: ["new", "featured"], sales: 40,
      colours: [["Gold", "#c8a14d", 10], ["Silver", "#b8bcc4", 8], ["Black", "#1d1d1f", 6]],
      short: "Hard-case box clutch with full crystal embellishment.",
      desc: "A hard-case box clutch covered in crystals, with a detachable chain strap and satin-lined interior that fits a phone, lipstick and keys." }),
  P({ cat: "clutch-purses", name: "Velvet Pearl Minaudière", price: 55000, unit: "per_item", fabric: "Velvet", flags: [], sales: 19,
      colours: [["Wine", "#6e1f2f", 2], ["Emerald", "#1f6b52", 7]],
      short: "Soft velvet minaudière with a pearl clasp.",
      desc: "A soft velvet minaudière with a pearl-encrusted clasp. An elegant accompaniment for evening receptions." }),
  P({ cat: "clutch-purses", name: "Woven Aso-Oke Envelope Clutch", price: 42000, unit: "per_item", fabric: "Aso-oke", flags: ["best"], sales: 58,
      colours: [["Coral", "#d4705e", 12], ["Gold", "#c8a14d", 15]],
      short: "Envelope clutch hand-woven in aso-oke.",
      desc: "Our envelope clutch is hand-woven in aso-oke, with a magnetic flap and gold-tone hardware — easy to coordinate with your gele." }),
  P({ cat: "accessories", name: "Coral Bead Bridal Set", price: 120000, unit: "per_set", fabric: "Coral beads", flags: ["featured"], sales: 22,
      colours: [["Coral Red", "#c8423a", 8]],
      short: "Traditional coral bead necklace, bracelet and earrings.",
      desc: "A traditional bridal coral bead set: multi-strand necklace, matching bracelet and drop earrings." }),
  P({ cat: "accessories", name: "Pearl Drop Hair Comb", price: 25000, unit: "per_item", fabric: "Pearl and alloy", flags: ["new"], sales: 16,
      colours: [["Pearl", "#efe9df", 20], ["Gold", "#c8a14d", 15]],
      short: "Bridal hair comb with pearl drops.",
      desc: "A delicate bridal comb with cascading pearl drops — beautiful with a veil or a sculpted updo." }),
  P({ cat: "accessories", name: "Ostrich Feather Hand Fan", price: 38000, unit: "per_item", fabric: "Ostrich feather", flags: [], sales: 24,
      colours: [["Ivory", "#efe6d4", 12], ["Black", "#1d1d1f", 9]],
      short: "Luxurious ostrich feather fan for the bridal entrance.",
      desc: "A luxurious ostrich feather hand fan with a lacquered frame — a showpiece for the traditional bridal entrance." }),
  P({ cat: "accessories", name: "Auto-Tie Gele Headwrap", price: 18000, unit: "per_item", fabric: "Damask", flags: ["best"], sales: 140,
      colours: [["Gold", "#c8a14d", 50], ["Silver", "#b8bcc4", 40], ["Wine", "#6e1f2f", 35]],
      short: "Pre-styled gele that sits perfectly in seconds.",
      desc: "Pre-styled and stitched to hold its shape, our auto-tie gele sits perfectly in seconds — a favourite for large Asoebi groups." }),
];

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);

// Artwork
const catImages = {};
for (const c of categories) {
  catImages[c.slug] = write(`category-${c.slug}.svg`, fabricSvg({ colour: c.colour, pattern: c.pattern, label: c.name, object: c.object }));
}

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000" role="img" aria-label="Draped wine and champagne luxury fabrics">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a0f19"/><stop offset=".55" stop-color="#6e1f2f"/><stop offset="1" stop-color="#2a0a12"/></linearGradient>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6cf9f"/><stop offset=".5" stop-color="#c9a865"/><stop offset="1" stop-color="#8f7038"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".25" stop-color="#fff" stop-opacity=".12"/>
      <stop offset=".45" stop-color="#000" stop-opacity=".22"/><stop offset=".7" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".3"/>
    </linearGradient>
    ${patterns.lace("#c9a865").replace('id="p"', 'id="lace"')}
    ${patterns.crystal("#6e1f2f").replace('id="p"', 'id="cr"')}
  </defs>
  <rect width="1600" height="1000" fill="url(#a)"/>
  <rect width="1600" height="1000" fill="url(#cr)" opacity=".5"/>
  <path d="M760 0 C880 220 820 420 960 620 C1080 790 1020 900 1080 1000 L1600 1000 L1600 0Z" fill="url(#b)"/>
  <path d="M760 0 C880 220 820 420 960 620 C1080 790 1020 900 1080 1000 L1600 1000 L1600 0Z" fill="url(#lace)" opacity=".8"/>
  <path d="M1100 0 C1180 260 1120 520 1260 700 C1340 820 1320 920 1360 1000 L1600 1000 L1600 0Z" fill="#f3e9d6" opacity=".55"/>
  <rect width="1600" height="1000" fill="url(#f)"/>
</svg>`;
write("hero.svg", heroSvg);

const collections = [
  { slug: "the-bridal-edit", title: "The Bridal Edit", subtitle: "For the bride, from first fitting to final dance", colour: "#e9dfcf", pattern: "lace", products: ["Premium Bridal Lace", "Chantilly Bridal Lace", "Duchess Bridal Satin", "Pearl Cascade Beaded Tulle", "Pearl Drop Hair Comb", "Coral Bead Bridal Set"] },
  { slug: "the-wedding-guest-collection", title: "The Wedding Guest Collection", subtitle: "Arrive beautifully, celebrate fully", colour: "#a8326e", pattern: "geometric", products: ["Ẹ̀yẹ Corded Lace", "Owambe Organza Sequin", "Adaeze Hand-Beaded Lace", "Ìfẹ́ Crystal Box Clutch", "Auto-Tie Gele Headwrap"] },
  { slug: "the-asoebi-collection", title: "The Asoebi Collection", subtitle: "Deep stock, perfectly matched for your group", colour: "#6e1f2f", pattern: "damask", products: ["Ẹ̀yẹ Corded Lace", "Aso-Oke Damask Gele Set", "Auto-Tie Gele Headwrap", "Adaeze Hand-Beaded Lace", "Woven Aso-Oke Envelope Clutch"] },
  { slug: "the-luxury-crystal-collection", title: "The Luxury Crystal Collection", subtitle: "Light-catching pieces for unforgettable entrances", colour: "#b79a72", pattern: "crystal", products: ["Celestine Crystal Tulle", "Aurora Stone-Encrusted Lace", "Starlight Crystal Mesh", "Ìfẹ́ Crystal Box Clutch"] },
  { slug: "the-mens-collection", title: "The Men's Collection", subtitle: "Distinguished fabrics for agbada, kaftan and senator", colour: "#3d4250", pattern: "weave", products: ["Heritage Cashmere Wool", "Royal Senator Swiss Voile", "Grand Agbada Brocade"] },
];
for (const c of collections) c.image = write(`collection-${c.slug}.svg`, fabricSvg({ colour: c.colour, pattern: c.pattern, label: c.title }));

// Blog categories are created by migrations; listed here for reference.
export const blogCats = [
  ["Fabric Guides", "fabric-guides"], ["Bridal Inspiration", "bridal-inspiration"], ["Asoebi Planning", "asoebi-planning"],
  ["Wedding Fashion", "wedding-fashion"], ["Style Inspiration", "style-inspiration"], ["Fabric Care", "fabric-care"], ["Fashion Trends", "fashion-trends"],
];

const posts = [
  { title: "How Many Yards Do You Really Need? A Lace Buying Guide", cat: "fabric-guides", colour: "#c9ad7f", pattern: "lace",
    excerpt: "From mermaid gowns to iro and buba, here is how to estimate yardage before you buy.",
    content: `Buying the right amount of fabric saves money and avoids the stress of trying to match a second bolt later. Use this guide as a starting point, then confirm with your designer.\n\n## Typical yardage by style\n\n| Style | Approximate yardage |\n| --- | --- |\n| Fitted mermaid gown | 4–5 yards |\n| Iro and buba | 5 yards |\n| Ball gown with train | 7–10 yards |\n| Men's agbada (3-piece) | 10 yards |\n| Kaftan or senator | 4–5 yards |\n\n## Why bundles matter\n\nMany of our luxury laces are sold as **four- or five-yard bundles** cut from a single bolt. This guarantees consistent colour and embellishment density across your whole outfit.\n\n## Tips before you buy\n\n- Share your style inspiration with your designer first.\n- Add half a yard for pattern matching on large motifs.\n- For Asoebi groups, order from one dye lot — ask us to reserve stock.` },
  { title: "Planning Asoebi for 200 Guests Without the Stress", cat: "asoebi-planning", colour: "#6e1f2f", pattern: "damask",
    excerpt: "A timeline and checklist for coordinators managing large Asoebi groups.",
    content: `Coordinating Asoebi for a large celebration is a project in its own right. Here is the timeline we recommend to couples and coordinators.\n\n## 12 weeks before\n\n- Choose your colour story and fabric shortlist.\n- Request a quotation with your estimated guest count.\n\n## 10 weeks before\n\n- Confirm fabric and reserve stock from a single dye lot.\n- Share your event page link with guests so each person can pay individually.\n\n## 6 weeks before\n\n- Close orders and confirm final quantities.\n- Arrange delivery — individual or collective.\n\n## Why use an event page?\n\nAn event page lets every guest select, pay and track their own Asoebi, while you monitor paid and unpaid orders in one place.` },
  { title: "Caring for Beaded and Crystal Fabrics", cat: "fabric-care", colour: "#b79a72", pattern: "crystal",
    excerpt: "Keep your embellished fabrics sparkling for years with these simple care rules.",
    content: `Embellished fabrics are investments. A little care keeps them looking new.\n\n## Storage\n\n- Store flat or rolled around a tube — never folded sharply.\n- Wrap in acid-free tissue and keep away from direct sunlight.\n\n## Cleaning\n\n- **Dry clean only** with a cleaner experienced in embellished garments.\n- Never wring, twist or tumble dry.\n\n## Pressing\n\nPress from the reverse side on a low setting with a pressing cloth, avoiding direct heat on beads and crystals.` },
  { title: "Five Bridal Lace Looks for the Modern Nigerian Bride", cat: "bridal-inspiration", colour: "#e9dfcf", pattern: "lace",
    excerpt: "From illusion sleeves to sculpted corsetry — bridal looks we love this season.",
    content: `Bridal lace is endlessly versatile. These are the looks our brides are loving.\n\n1. **Illusion sleeves** in Chantilly-style lace.\n2. **Corseted bodices** in structured duchess satin with lace appliqué.\n3. **Cathedral trains** edged with scalloped eyelash lace.\n4. **Second-look mini dresses** in pearl-beaded tulle.\n5. **Traditional reception** looks in stone-encrusted lace with coral beads.\n\nVisit our Bridal Edit to explore fabrics for each look.` },
];
for (const p of posts) {
  p.slug = slugify(p.title);
  p.image = write(`journal-${p.slug}.svg`, fabricSvg({ colour: p.colour, pattern: p.pattern, label: p.title }));
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------
const out = [];
out.push(`-- GENERATED by scripts/generate-demo.mjs — demo data for Lobaloba Deluxe.
-- Products and journal articles below are flagged is_demo = true.
-- Remove them before launch with supabase/demo/remove_demo_data.sql or
-- Admin → Settings → Demo data.
begin;
`);

out.push(`-- Category imagery (categories themselves are created by migrations)`);
for (const c of categories) out.push(`update public.categories set image_url = ${q(catImages[c.slug])} where slug = ${q(c.slug)} and image_url is null;`);

out.push(`\n-- Demo products`);
products.forEach((p, idx) => {
  const slug = slugify(p.name);
  const cat = categories.find((c) => c.slug === p.cat);
  const pattern = p.pattern ?? cat.pattern;
  const flags = new Set(p.flags);
  const sku = `LBF-${String(idx + 1).padStart(3, "0")}`;
  out.push(`
with prod as (
  insert into public.products (name, slug, sku, category_id, short_description, description, care_instructions, fabric_type,
    price, compare_at_price, purchase_unit, unit_label, is_featured, is_new_arrival, is_bestseller, sales_count, tags, faqs, is_demo, seo_description, created_at)
  values (${q(p.name)}, ${q(slug)}, ${q(sku)}, (select id from public.categories where slug = ${q(p.cat)}),
    ${q(p.short)}, ${q(p.desc)},
    ${q(cat.object ? "Store in the dust bag provided. Wipe gently with a soft dry cloth. Keep away from moisture and perfume." : "Dry clean only. Store rolled or flat, wrapped in tissue, away from direct sunlight. Press on the reverse at low heat with a pressing cloth.")},
    ${q(p.fabric)}, ${p.price}, ${idx % 5 === 1 ? Math.round(p.price * 1.15) : "null"}, ${q(p.unit)}, ${q(p.unitLabel ?? null)},
    ${flags.has("featured")}, ${flags.has("new")}, ${flags.has("best")}, ${p.sales},
    array[${q(p.fabric.toLowerCase())}, ${q(cat.name.toLowerCase())}]::text[],
    '[{"question":"Can I order a sample before buying?","answer":"Yes. Use Request a Sample on this page and our team will arrange a swatch."},{"question":"Is the colour exactly as shown?","answer":"We photograph in natural light, but screens vary. Ask our stylists on WhatsApp for a live video of the fabric."}]'::jsonb,
    true, ${q(p.short)}, now() - interval '${(idx * 2) % 40} days')
  returning id
)`);
  const colourValues = p.colours.map(([n, h], i) => `(${q(n)}, ${q(h)}, ${i})`).join(", ");
  out.push(`, cols as (
  insert into public.product_colours (product_id, name, hex, sort_order)
  select prod.id, v.name, v.hex, v.ord from prod, (values ${colourValues}) as v(name, hex, ord)
  returning id, product_id, name, sort_order
)`);
  const imgs = [];
  p.colours.forEach(([n, h], i) => {
    const file = write(`product-${slug}-${slugify(n)}.svg`, fabricSvg({ colour: h, pattern, label: `${p.name} in ${n}`, object: cat.object }));
    imgs.push(`(${q(n)}, ${q(file)}, ${q(`${p.name} in ${n}`)}, ${i})`);
  });
  out.push(`, imgs as (
  insert into public.product_images (product_id, colour_id, url, alt, sort_order)
  select cols.product_id, cols.id, v.url, v.alt, v.ord from cols join (values ${imgs.join(", ")}) as v(colour, url, alt, ord) on v.colour = cols.name
  returning id
)`);
  const stockValues = p.colours.map(([n, , s], i) => `(${q(n)}, ${s}, ${q(`${sku}-${String(i + 1).padStart(2, "0")}`)})`).join(", ");
  out.push(`, vars as (
  insert into public.product_variants (product_id, colour_id, name, sku, sort_order)
  select cols.product_id, cols.id, cols.name, v.sku, cols.sort_order from cols join (values ${stockValues}) as v(colour, stock, sku) on v.colour = cols.name
  returning id, sku
)
insert into public.inventory (variant_id, quantity)
select vars.id, v.stock from vars join (values ${stockValues}) as v(colour, stock, sku) on v.sku = vars.sku;`);
});

out.push(`\n-- Collections (curated groupings; real business data, imagery is demo)`);
collections.forEach((c, i) => {
  out.push(`insert into public.collections (title, slug, subtitle, description, image_url, sort_order) values (${q(c.title)}, ${q(c.slug)}, ${q(c.subtitle)}, ${q(c.subtitle + ".")}, ${q(c.image)}, ${i}) on conflict (slug) do nothing;`);
  c.products.forEach((name, j) => {
    out.push(`insert into public.collection_products (collection_id, product_id, sort_order) select c.id, p.id, ${j} from public.collections c, public.products p where c.slug = ${q(c.slug)} and p.slug = ${q(slugify(name))} on conflict do nothing;`);
  });
});

out.push(`\n-- Demo reviews`);
const reviewSeeds = [
  ["Premium Bridal Lace", "Temitope A.", 5, "Absolutely stunning", "The lace was even more beautiful in person. My designer loved working with it."],
  ["Premium Bridal Lace", "Chiamaka O.", 5, "Perfect for my white wedding", "Soft, elegant and the scalloped edges saved my tailor so much time."],
  ["Celestine Crystal Tulle", "Funke B.", 5, "Worth every naira", "The crystals catch the light beautifully. I got so many compliments at my reception."],
  ["Ẹ̀yẹ Corded Lace", "Ngozi E.", 4, "Great for our Asoebi", "We ordered for 60 guests and every bundle matched. Delivery was on time."],
  ["Auto-Tie Gele Headwrap", "Bisola K.", 5, "So convenient", "Sits perfectly every time. Ordered for my whole family."],
];
for (const [name, author, rating, title, body] of reviewSeeds) {
  const slug = slugify(name);
  out.push(`insert into public.reviews (product_id, author_name, rating, title, body, is_approved, is_verified_purchase) select id, ${q(author)}, ${rating}, ${q(title)}, ${q(body)}, true, true from public.products where slug = ${q(slug)};`);
}

out.push(`\n-- Demo journal articles`);
posts.forEach((p, i) => {
  const words = p.content.split(/\s+/).length;
  out.push(`insert into public.blog_posts (title, slug, excerpt, content, cover_image_url, category_id, author_name, author_bio, status, published_at, reading_minutes, is_demo)
values (${q(p.title)}, ${q(p.slug)}, ${q(p.excerpt)}, ${q(p.content)}, ${q(p.image)}, (select id from public.blog_categories where slug = ${q(p.cat)}),
  'Lobaloba Editorial', 'Fabric specialists and stylists at Lobaloba Deluxe.', 'published', now() - interval '${i * 6 + 1} days', ${Math.max(1, Math.round(words / 200))}, true);`);
});

out.push(`\n-- Hero artwork default (admin can replace)
update public.site_settings set value = jsonb_set(value, '{image_url}', to_jsonb('/demo/hero.svg'::text)) where key = 'hero' and coalesce(value->>'image_url', '') = '';

commit;
`);

const seedPath = join(root, "supabase", "seed.sql");
mkdirSync(dirname(seedPath), { recursive: true });
writeFileSync(seedPath, out.join("\n"));
console.log(`Wrote ${products.length} demo products, ${posts.length} articles, artwork to public/demo and supabase/seed.sql`);
