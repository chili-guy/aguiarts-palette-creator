export interface MockupTemplate {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
  /** The recommended print area, in the template's own pixel coordinates. */
  printArea: { x: number; y: number; width: number; height: number };
}

/**
 * Garment templates are hand-drawn SVG flats rather than downloaded photo
 * mockups: stock mockup photography almost always carries a restrictive licence
 * that we can't verify or redistribute in a commercial product, and vectors
 * stay sharp at any export size.
 *
 * All garments share an 800x900 canvas so the print areas are comparable; the
 * print area is the front chest placement, sized off a 28cm-wide DTF transfer.
 */
export const MOCKUP_TEMPLATES: MockupTemplate[] = [
  {
    id: "tshirt",
    label: "Camiseta",
    src: "/mockup-templates/tshirt.svg",
    width: 800,
    height: 900,
    printArea: { x: 300, y: 330, width: 200, height: 290 },
  },
  {
    id: "tshirt-oversized",
    label: "Oversized",
    src: "/mockup-templates/tshirt-oversized.svg",
    width: 800,
    height: 900,
    printArea: { x: 296, y: 340, width: 208, height: 280 },
  },
  {
    id: "baby-look",
    label: "Baby look",
    src: "/mockup-templates/baby-look.svg",
    width: 800,
    height: 900,
    printArea: { x: 310, y: 330, width: 180, height: 270 },
  },
  {
    id: "regata",
    label: "Regata",
    src: "/mockup-templates/regata.svg",
    width: 800,
    height: 900,
    printArea: { x: 306, y: 320, width: 188, height: 290 },
  },
  {
    id: "manga-longa",
    label: "Manga longa",
    src: "/mockup-templates/manga-longa.svg",
    width: 800,
    height: 900,
    printArea: { x: 300, y: 345, width: 200, height: 280 },
  },
  {
    // The kangaroo pocket starts at y=546, so the placement stops short of it.
    id: "moletom",
    label: "Moletom",
    src: "/mockup-templates/moletom.svg",
    width: 800,
    height: 900,
    printArea: { x: 306, y: 330, width: 188, height: 200 },
  },
  {
    id: "mug",
    label: "Caneca",
    src: "/mockup-templates/mug.svg",
    width: 800,
    height: 600,
    printArea: { x: 260, y: 180, width: 230, height: 230 },
  },
  {
    id: "tote",
    label: "Ecobag",
    src: "/mockup-templates/tote.svg",
    width: 800,
    height: 900,
    printArea: { x: 280, y: 380, width: 240, height: 300 },
  },
];
