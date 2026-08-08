import {
  Grid3x3,
  Frame,
  PenTool,
  Shirt,
  FileText,
  Eraser,
  Sparkles,
  Bug,
  Palette,
  Shrink,
  TrendingUp,
  Calculator,
  Receipt,
  type LucideIcon,
} from "lucide-react";

/**
 * The tool catalogue, mirroring the sidebar of the real app (see MODELAGEM-UI.md).
 * `slug` is the identifier the production app passes as `?tool=<slug>`; we keep it
 * so the two can be cross-referenced, but our own URLs are file-based routes.
 *
 * Tools we haven't built yet are marked `built: false` — the sidebar still lists
 * them, in the real order, so the navigation doesn't silently diverge.
 */
export type Tool = {
  slug: string;
  label: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Plan badge shown on the dashboard card, as on the real landing. */
  badge?: "PRO" | "GRÁTIS" | "NOVO";
  to?: string;
  built: boolean;
};

export const TOOLS: Tool[] = [
  {
    slug: "halftone",
    label: "Halftone DTF/DTG",
    title: "Halftone DTF Pro",
    subtitle: "Crie halftone e tramados para DTF/DTG em poucos cliques.",
    icon: Grid3x3,
    badge: "PRO",
    to: "/ferramentas/halftone",
    built: true,
  },
  {
    slug: "molduras",
    label: "Molduras PRO",
    title: "Molduras Pro",
    subtitle: "Aplique molduras corridas e bordas grunge na arte com PNG transparente.",
    icon: Frame,
    badge: "PRO",
    to: "/ferramentas/molduras",
    built: true,
  },
  {
    slug: "vetorizador",
    label: "Vetorizador PRO",
    title: "Vetorizador PRO",
    subtitle:
      "Converta PNG e JPG em SVG real, limpo e editável, preservando cores, contornos e detalhes.",
    icon: PenTool,
    badge: "NOVO",
    to: "/ferramentas/vetorizar",
    built: true,
  },
  {
    slug: "mockup-studio",
    label: "Mockup Studio",
    title: "Mockup Studio",
    subtitle: "Aplique suas artes em coleções de mockups com frente, costas e variações de cor.",
    icon: Shirt,
    badge: "NOVO",
    to: "/ferramentas/mockup",
    built: true,
  },
  {
    slug: "arquivo-dtf",
    label: "Arquivo DTF",
    title: "Arquivo DTF",
    subtitle: "Monte folhas DTF com medidas, régua e exportação em alta qualidade.",
    icon: FileText,
    badge: "GRÁTIS",
    to: "/ferramentas/arquivo-dtf",
    built: true,
  },
  {
    slug: "removedor-fundo",
    label: "Removedor de Fundo",
    title: "Removedor de Fundo Pro",
    subtitle: "Remova fundos com precisão e recupere cores internas.",
    icon: Eraser,
    badge: "GRÁTIS",
    to: "/ferramentas/remover-fundo",
    built: true,
  },
  {
    slug: "limpador-fundo",
    label: "Limpador de Fundo",
    title: "Limpador de Fundo",
    subtitle: "Limpe restos de fundo e manchas sem comer a arte.",
    icon: Sparkles,
    built: false,
  },
  {
    slug: "pontos-fantasmas",
    label: "Pontos Fantasmas",
    title: "Removedor de Pontos Fantasmas",
    subtitle: "Elimine pontos soltos que aparecem na prensa.",
    icon: Bug,
    built: false,
  },
  {
    slug: "cor-spot",
    label: "Cor Spot PRO",
    title: "Cor Spot Pro",
    subtitle: "Crie chapas spot, spot branco e cores especiais.",
    icon: Palette,
    to: "/ferramentas/cor-spot",
    built: true,
  },
  {
    slug: "contracao-bordas",
    label: "Contração de Bordas",
    title: "Contração de Bordas",
    subtitle: "Reduza a borda da arte para evitar halo branco na prensa.",
    icon: Shrink,
    to: "/ferramentas/contracao-de-bordas",
    built: true,
  },
  {
    slug: "melhorador-pro",
    label: "Melhorador PRO",
    title: "Melhorador de Imagem Pro",
    subtitle: "Aumente a escala e reforce a nitidez de artes em lote.",
    icon: TrendingUp,
    built: false,
  },
  {
    slug: "calculadora",
    label: "Calculadora de Preços",
    title: "Calculadora de Preços",
    subtitle: "Calcule custo, margem e preço de venda por peça.",
    icon: Calculator,
    built: false,
  },
  {
    slug: "orcamento",
    label: "Orçamento PRO",
    title: "Orçamento PRO",
    subtitle: "Monte orçamentos com a sua identidade e envie em PDF ou WhatsApp.",
    icon: Receipt,
    built: false,
  },
];

export const BUILT_TOOLS = TOOLS.filter((t) => t.built);

export function findToolByPath(pathname: string): Tool | undefined {
  return TOOLS.find((t) => t.to === pathname);
}
