export interface MockupTemplate {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
  /** The recommended print area, in the template's own pixel coordinates. */
  printArea: { x: number; y: number; width: number; height: number };
}

export const MOCKUP_TEMPLATES: MockupTemplate[] = [
  {
    id: "tshirt",
    label: "Camiseta",
    src: "/mockup-templates/tshirt.svg",
    width: 800,
    height: 900,
    printArea: { x: 280, y: 300, width: 240, height: 340 },
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
