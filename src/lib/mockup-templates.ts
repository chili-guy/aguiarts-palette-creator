export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MockupView {
  label: string;
  src: string;
  /** The source file's own viewBox size, needed to place the crop. */
  sourceWidth: number;
  sourceHeight: number;
  /**
   * Region of the source file this view shows, in the file's own units.
   *
   * Some sheets carry the front and the back side by side; cropping lets one
   * file supply both views instead of splitting it into two assets. The crop
   * also trims labels drawn into the artwork.
   */
  crop: Rect;
  /** Print placement, in coordinates relative to the crop. */
  printArea: Rect;
}

export type MockupCategory = "Camiseta" | "Oversized" | "Acessório";

export interface MockupTemplate {
  id: string;
  label: string;
  category: MockupCategory;
  /**
   * Whether the garment can be recoloured. Flat silhouettes tint cleanly by
   * compositing; artwork with baked-in seams, prints or multiple colours does
   * not, and is offered in its own colour only.
   */
  tintable: boolean;
  /** Base colour of the artwork as drawn, so tinting knows what it is replacing. */
  baseColor: string;
  views: MockupView[];
  /** Where the file came from. Empty for artwork we drew ourselves. */
  source?: string;
}

/**
 * Garment catalogue.
 *
 * The `cc0/` files are third-party artwork from freesvg.org, published under
 * Creative Commons Zero — see `public/mockup-templates/cc0/PROVENANCE.md` for
 * the per-file record and for the provenance caveat that comes with any
 * user-submitted CC0 library. The rest are ours.
 *
 * Every print area was measured rather than guessed: each garment was
 * rasterised, its alpha bounding box computed, and the chest placement derived
 * from that box — centred horizontally, starting at 26% of the body height and
 * running 46% wide by 42% tall, which is roughly a 28 cm transfer on a 50 cm
 * body. Guessing put the area on the collar.
 */
export const MOCKUP_TEMPLATES: MockupTemplate[] = [
  {
    id: "tshirt-basica",
    label: "Camiseta básica",
    category: "Camiseta",
    tintable: true,
    baseColor: "#7f7f7f",
    source: "freesvg.org · CC0",
    views: [
      {
        label: "Frente",
        src: "/mockup-templates/cc0/tshirt-basica.svg",
        sourceWidth: 512,
        sourceHeight: 512,
        crop: { x: 0, y: 0, width: 512, height: 512 },
        printArea: { x: 145, y: 155.5, width: 220.8, height: 174.7 },
      },
    ],
  },
  {
    id: "tshirt-oversized",
    label: "Oversized",
    category: "Oversized",
    tintable: true,
    baseColor: "#000000",
    source: "freesvg.org · CC0",
    views: [
      {
        label: "Frente",
        src: "/mockup-templates/cc0/tshirt-oversized.svg",
        sourceWidth: 357.08,
        sourceHeight: 379.82,
        crop: { x: 0, y: 0, width: 357.08, height: 379.82 },
        printArea: { x: 96.2, y: 98.4, width: 163.8, height: 159 },
      },
    ],
  },
  {
    id: "tshirt-contorno",
    label: "Contorno",
    category: "Camiseta",
    tintable: true,
    baseColor: "#333333",
    source: "freesvg.org · CC0",
    views: [
      {
        label: "Frente",
        src: "/mockup-templates/cc0/tshirt-contorno.svg",
        sourceWidth: 178.31,
        sourceHeight: 193.66,
        crop: { x: 0, y: 0, width: 178.31, height: 193.66 },
        printArea: { x: 48, y: 50.2, width: 81.8, height: 81.1 },
      },
    ],
  },
  {
    id: "tshirt-sombreada",
    label: "Com sombreado",
    category: "Camiseta",
    // Shading is painted into the artwork, so a flat tint would erase it.
    tintable: false,
    baseColor: "#f2f2f2",
    source: "freesvg.org · CC0",
    views: [
      {
        label: "Frente",
        src: "/mockup-templates/cc0/tshirt-sombreada.svg",
        sourceWidth: 220.71,
        sourceHeight: 210.36,
        crop: { x: 0, y: 0, width: 220.71, height: 210.36 },
        printArea: { x: 59.4, y: 54.5, width: 101.3, height: 88.1 },
      },
    ],
  },
  {
    id: "tshirt-frente-costas",
    label: "Frente e costas",
    category: "Camiseta",
    tintable: true,
    baseColor: "#373435",
    source: "freesvg.org · CC0",
    views: [
      {
        label: "Frente",
        src: "/mockup-templates/cc0/tshirt-frente-costas.svg",
        sourceWidth: 11000,
        sourceHeight: 8500,
        // y starts below the "FRONT"/"BACK" lettering drawn into the sheet.
        crop: { x: 0, y: 950, width: 5450, height: 7550 },
        printArea: { x: 1503, y: 1435, width: 2337, height: 2838 },
      },
      {
        label: "Costas",
        src: "/mockup-templates/cc0/tshirt-frente-costas.svg",
        sourceWidth: 11000,
        sourceHeight: 8500,
        crop: { x: 5450, y: 950, width: 5550, height: 7550 },
        printArea: { x: 1746, y: 1435, width: 2349, height: 2838 },
      },
    ],
  },
  {
    id: "caneca",
    label: "Caneca",
    category: "Acessório",
    tintable: true,
    baseColor: "#d8d8e0",
    views: [
      {
        label: "Frente",
        src: "/mockup-templates/mug.svg",
        sourceWidth: 800,
        sourceHeight: 900,
        crop: { x: 0, y: 0, width: 800, height: 900 },
        printArea: { x: 250, y: 330, width: 300, height: 240 },
      },
    ],
  },
  {
    id: "tote",
    label: "Ecobag",
    category: "Acessório",
    tintable: true,
    baseColor: "#d8d8e0",
    views: [
      {
        label: "Frente",
        src: "/mockup-templates/tote.svg",
        sourceWidth: 800,
        sourceHeight: 900,
        crop: { x: 0, y: 0, width: 800, height: 900 },
        printArea: { x: 280, y: 380, width: 240, height: 300 },
      },
    ],
  },
];

export const MOCKUP_CATEGORIES: MockupCategory[] = ["Camiseta", "Oversized", "Acessório"];

/** Garment colours offered in the picker, as swatches. */
export const GARMENT_COLORS = [
  "#ffffff",
  "#111111",
  "#3f3f46",
  "#8b1a1a",
  "#1e3a8a",
  "#166534",
  "#b45309",
  "#be185d",
  "#6d28d9",
  "#e5e7eb",
];
