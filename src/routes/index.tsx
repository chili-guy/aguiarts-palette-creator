import { BeforeAfter } from "@/components/before-after";
import exHalftoneBefore from "@/assets/ex-halftone-before.jpg";
import exHalftoneAfter from "@/assets/ex-halftone-after.jpg";
import exBgBefore from "@/assets/ex-bg-before.jpg";
import exBgAfter from "@/assets/ex-bg-after.png";
import exVectorBefore from "@/assets/ex-vector-before.jpg";
import exVectorAfter from "@/assets/ex-vector-after.jpg";
import exMockupBefore from "@/assets/ex-mockup-before.jpg";
import exMockupAfter from "@/assets/ex-mockup-after.jpg";
import exFrameBefore from "@/assets/ex-frame-before.jpg";
import exFrameAfter from "@/assets/ex-frame-after.jpg";
import exDtfBefore from "@/assets/ex-dtf-before.jpg";
import exDtfAfter from "@/assets/ex-dtf-after.jpg";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Eraser,
  Frame,
  Grid3x3,
  LayoutGrid,
  Palette,
  PenTool,
  Shirt,
  Shrink,
  Check,
  Printer,
  Store,
  Truck,
  PackageCheck,
} from "lucide-react";
import { Hero } from "@/components/hero";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printzy | Serviços de pré-impressão para gráficas" },
      {
        name: "description",
        content:
          "Serviços digitais para gráficas: tratamento de arte, halftone, vetorização, remoção de fundo, mockups e montagem de folha DTF prontos para produção.",
      },
      { property: "og:title", content: "Printzy | Serviços de pré-impressão para gráficas" },
      {
        property: "og:description",
        content:
          "Sua gráfica entrega mais pedidos por dia: arte tratada, vetorizada e encaixada na folha DTF sem gargalo no setor de criação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tools = [
  {
    icon: Grid3x3,
    name: "Halftone DTF/DTG",
    desc: "Transforme imagens degradê em retículas prontas para impressão.",
    href: "/ferramentas/halftone",
  },
  {
    icon: Eraser,
    name: "Limpador de Fundo",
    desc: "Remova fundos de forma rápida e precisa.",
    href: "/ferramentas/remover-fundo",
  },
  {
    icon: PenTool,
    tag: "NOVO",
    name: "Vetorizador PRO",
    desc: "Transforme imagens em arquivos vetoriais editáveis.",
    href: "/ferramentas/vetorizar",
  },
  {
    icon: Shirt,
    tag: "NOVO",
    name: "Mockup Studio",
    desc: "Apresente sua arte aplicada antes mesmo de produzir.",
    href: "/ferramentas/mockup",
  },
  {
    icon: Frame,
    name: "Molduras PRO",
    desc: "Adicione acabamentos e elementos finais à composição.",
    href: "/ferramentas/molduras",
  },
  {
    icon: Palette,
    name: "Cor Spot PRO",
    desc: "Prepare cores especiais para processos de impressão.",
    href: "/ferramentas/cor-spot",
  },
  {
    icon: Shrink,
    name: "Contração de Bordas",
    desc: "Remova contornos e evite problemas na aplicação.",
    href: "/ferramentas/contracao-de-bordas",
  },
  {
    icon: LayoutGrid,
    name: "Arquivo DTF",
    desc: "Monte a folha com encaixe otimizado, régua e sangria — aproveite cada metro de filme.",
    href: "/ferramentas/arquivo-dtf",
  },
];

const offerings = [
  {
    icon: Shirt,
    tag: "NOVO",
    name: "Camisetas lisas 100% algodão",
    desc: "Compre camisetas lisas em malha 100% algodão com preço de atacado.",
  },
  {
    icon: Shirt,
    tag: "NOVO",
    name: "Camisetas lisas Dryfit",
    desc: "Compre camisetas lisas em dryfit com preço de atacado.",
  },
  {
    icon: Printer,
    tag: "NOVO",
    name: "Impressão DTF",
    desc: "Imprima suas folhas de DTF com qualidade premium e preço de atacado.",
  },
  {
    icon: Store,
    tag: "BREVE",
    name: "Site/loja própria",
    desc: "Crie sua marca e receba sua loja pronta e configurada para vender em todo o Brasil.",
  },
  {
    icon: Truck,
    tag: "BREVE",
    name: "Dropshipping",
    desc: "Tenha acesso ao nosso catálogo com mais de 5 mil produtos e venda em todos os marketplaces nacionais.",
  },
  {
    icon: PackageCheck,
    tag: "BREVE",
    name: "Print on Demand",
    desc: "Compre camisetas prontas já estampadas e envie direto para o seu cliente.",
  },
];

const steps = [
  {
    n: "01",
    title: "Envie o arquivo do cliente",
    desc: "JPG, PNG ou PDF direto do navegador — sem instalar nada no setor de arte.",
  },
  {
    n: "02",
    title: "Ajuste na ferramenta certa",
    desc: "Cada ferramenta tem os controles do seu fluxo: ângulo de tela, raio de contração, paleta de cores.",
  },
  {
    n: "03",
    title: "Baixe pronto pra prensa",
    desc: "PNG, SVG ou PDF na resolução e no DPI certos para RIP, DTF ou serigrafia.",
  },
];

const examples = [
  {
    name: "Halftone DTF/DTG",
    desc: "A arte com efeito de retícula calibrada: economize tinta e ganhe sofisticação e leveza na camiseta.",
    before: exHalftoneBefore,
    after: exHalftoneAfter,
    beforeAlt: "Ilustração de lobo geométrico colorida antes do halftone",
    afterAlt: "Mesma ilustração convertida em retícula halftone pronta para impressão",
  },
  {
    name: "Limpador de Fundo",
    desc: "Recorte pronto para catálogo, mockup e impressão sem passar pelo designer.",
    before: exBgBefore,
    after: exBgAfter,
    beforeAlt: "Foto de pessoa com fundo bagunçado antes da remoção",
    afterAlt: "Mesma foto com fundo removido e recorte limpo",
    checkered: true,
  },
  {
    tag: "NOVO",
    name: "Vetorizador PRO",
    desc: "Logo em baixa resolução vira vetor pronto para qualquer formato de impressão.",
    before: exVectorBefore,
    after: exVectorAfter,
    beforeAlt: "Logo de foguete pixelado e borrado antes da vetorização",
    afterAlt: "Mesmo logo vetorizado com bordas nítidas",
  },
  {
    tag: "NOVO",
    name: "Mockup Studio",
    desc: "Prova visual para aprovar antes de publicar ou rodar o pedido.",
    before: exMockupBefore,
    after: exMockupAfter,
    beforeAlt: "Arte de foguete isolada em fundo branco",
    afterAlt: "Mesma arte aplicada em mockup de camiseta preta",
  },
  {
    name: "Molduras PRO",
    desc: "Acabamento que agrega valor ao pedido sem tempo extra no setor de criação.",
    before: exFrameBefore,
    after: exFrameAfter,
    beforeAlt: "Ilustração de caveira com asas sem moldura",
    afterAlt: "Mesma ilustração com moldura circular grunge aplicada",
  },
  {
    name: "Arquivo DTF",
    desc: "Vários pedidos encaixados na mesma folha: mais peças por metro de filme.",
    before: exDtfBefore,
    after: exDtfAfter,
    beforeAlt: "Artes espalhadas na folha com muito espaço vazio",
    afterAlt: "Folha DTF com artes encaixadas em grade otimizada e régua",
  },
];

const benefits = [
  {
    kicker: "100% ONLINE",
    title: "Trabalhe de qualquer lugar",
    desc: "Cadastre-se, envie seu arquivo e comece a produzir. Sem instalações e sem processos complicados.",
  },
  {
    kicker: "FLUXO INTELIGENTE",
    title: "Menos etapas. Mais produção.",
    desc: "Automatize tarefas repetitivas e transforme horas de edição em poucos cliques.",
  },
  {
    kicker: "FEITO PARA IMPRESSÃO",
    title: "Ferramentas que entendem seu processo",
    desc: "Halftone, vetorização, preparação de arquivos, mockups e muito mais, pensados para quem trabalha com impressão.",
  },
  {
    kicker: "TUDO EM UM SÓ LUGAR",
    title: "Seu fluxo. Uma plataforma.",
    desc: "Pare de ficar pulando entre programas e ferramentas. Tenha o que você precisa para produzir dentro do Printzy Lab.",
  },
];

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/ mês",
    desc: "Para a gráfica testar o fluxo com os primeiros pedidos.",
    items: ["Ferramentas grátis liberadas", "5 exports PRO por mês", "Conta Printzy gratuita"],
    cta: "Criar conta grátis",
    featured: false,
  },
  {
    name: "Mensal PRO",
    price: "R$ 19,90",
    period: "/ mês",
    desc: "Para gráficas com produção diária e prazo apertado.",
    items: [
      "Exports PRO ilimitados",
      "Todas as ferramentas premium",
      "Atualizações incluídas",
      "Suporte prioritário",
    ],
    cta: "Assinar agora",
    featured: true,
  },
  {
    name: "Anual PRO",
    price: "R$ 127",
    period: "/ ano",
    desc: "O menor custo por pedido para quem produz o ano inteiro.",
    items: [
      "Exports PRO ilimitados",
      "Melhor custo-benefício",
      "Atualizações incluídas",
      "Acesso anual completo",
    ],
    cta: "Economizar no anual",
    featured: false,
  },
];

const faqs = [
  {
    q: "Preciso instalar algum programa na gráfica?",
    a: "Não. Tudo roda no navegador de qualquer computador do setor de arte, sem instalar nada.",
  },
  {
    q: "Preciso criar conta para usar?",
    a: "Não. Durante a validação todas as ferramentas estão abertas: é só abrir a ferramenta, enviar o arquivo e baixar o resultado.",
  },
  {
    q: "Atende DTF, DTG e serigrafia?",
    a: "Sim. As ferramentas foram calibradas para esses fluxos, com exports prontos para o RIP e para a prensa.",
  },
  {
    q: "Tem limite de exports?",
    a: "Não. Nesta fase não há limite de downloads e nenhuma ferramenta está bloqueada — os planos abaixo são a previsão de preço para quando o produto abrir ao público.",
  },
  {
    q: "Mais de uma pessoa pode usar?",
    a: "Sim. Qualquer computador do setor de arte pode abrir e trabalhar ao mesmo tempo.",
  },
  {
    q: "Meus arquivos vão para algum servidor?",
    a: "Não. O processamento acontece inteiro no seu navegador — a imagem nunca sai da máquina.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs font-medium tracking-[0.14em] text-accent">{children}</div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

function Index() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#ferramentas">
              Ferramentas
            </a>
            <a className="transition-colors hover:text-foreground" href="#produtos">
              Produtos
            </a>
            <a className="transition-colors hover:text-foreground" href="#exemplos">
              Exemplos
            </a>
            <a className="transition-colors hover:text-foreground" href="#planos">
              Planos
            </a>
            <a className="transition-colors hover:text-foreground" href="#faq">
              Dúvidas
            </a>
          </nav>
          <a
            href="#planos"
            className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-card transition-transform hover:scale-[1.02]"
          >
            Começar grátis
          </a>
        </div>
      </header>

      <main>
        <Hero />

        {/* Como funciona */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="border-b border-border"
        >
          <div className="mx-auto max-w-6xl px-5 py-16">
            <Eyebrow>COMO FUNCIONA</Eyebrow>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Três passos do arquivo bruto até a prensa
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
              {steps.map((s, i) => (
                <motion.div key={s.n} variants={fadeUp}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10 font-mono text-sm font-semibold text-accent">
                      {s.n}
                    </span>
                    {i < steps.length - 1 && (
                      <div className="hidden h-px flex-1 bg-border md:block" />
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Benefícios */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto max-w-6xl px-5 py-20"
        >
          <Eyebrow>POR QUE O PRINTZY LAB</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Produza mais. Edite menos. Cresça mais.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Ferramentas inteligentes para transformar arquivos brutos em artes prontas para produção
            — direto no navegador, sem complicação e sem depender de programas pesados.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                className="rounded-xl border border-border bg-card p-6 shadow-card"
              >
                <div className="font-mono text-[11px] font-medium tracking-widest text-accent">
                  {b.kicker}
                </div>
                <div className="mt-3 font-display text-lg font-semibold">{b.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Ferramentas */}
        <section id="ferramentas" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Eyebrow>FERRAMENTAS</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Para preparar, transformar e finalizar.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Feito para designers, estamparias, profissionais de DTF, DTG e personalização.
            </p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {tools.map((t) => (
                <motion.div key={t.name} variants={fadeUp}>
                  <Link
                    to={t.href}
                    className="group block h-full rounded-xl border border-border bg-card p-6 shadow-card transition-colors hover:border-accent/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-9 place-items-center rounded-md bg-secondary text-foreground">
                        <t.icon className="size-4" />
                      </span>
                      {t.tag && <Tag>{t.tag}</Tag>}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{t.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                      Abrir ferramenta →
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Produtos e serviços */}
        <section id="produtos" className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>PRODUTOS/SERVIÇOS</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Da arte pronta à peça na mão do seu cliente
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Além das ferramentas, o Printzy Lab fecha o ciclo: peça em branco, impressão e logística
            com preço de atacado.
          </p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {offerings.map((o) => {
              const soon = o.tag === "BREVE";
              return (
                <motion.div
                  key={o.name}
                  variants={fadeUp}
                  className={`h-full rounded-xl border border-border bg-card p-6 shadow-card ${
                    soon ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-md bg-secondary text-foreground">
                      <o.icon className="size-4" />
                    </span>
                    <Tag>{o.tag}</Tag>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{o.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{o.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Exemplos antes e depois */}
        <section id="exemplos" className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>ANTES / DEPOIS</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Visualize a edição da imagem em tempo real
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Arraste o cursor e compare: de um lado a arte bruta, do outro a arte tratada pronta para
            venda e produção.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map((ex) => (
              <article
                key={ex.name}
                className="rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <BeforeAfter
                  before={ex.before}
                  after={ex.after}
                  beforeAlt={ex.beforeAlt}
                  afterAlt={ex.afterAlt}
                  {...(ex.checkered ? { checkered: true } : {})}
                />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{ex.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{ex.desc}</p>
                  </div>
                  {ex.tag && <Tag>{ex.tag}</Tag>}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Eyebrow>PLANOS</Eyebrow>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Um ecossistema de ferramentas e serviços completo para quem vive de impressão
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              O Printzy Lab transforma etapas demoradas e repetitivas em processos simples, rápidos
              e automatizados.
            </p>
            {/* The prices are the plan for launch. Nothing is charged or limited
                yet, and the cards below would otherwise read as an active
                paywall to anyone testing the product. */}
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
              Em validação — todas as ferramentas liberadas, sem conta e sem limite de exports.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={
                    p.featured
                      ? "relative rounded-xl bg-primary p-7 text-primary-foreground shadow-elegant"
                      : "relative rounded-xl border border-border bg-card p-7 shadow-card"
                  }
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-7 rounded-sm bg-accent px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-accent-foreground">
                      MAIS ESCOLHIDO
                    </span>
                  )}
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <div className="mt-3 flex items-end gap-1">
                    <span
                      className={`font-mono text-4xl font-semibold ${p.featured ? "text-accent" : ""}`}
                    >
                      {p.price}
                    </span>
                    <span
                      className={`pb-1 text-sm ${p.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}
                    >
                      {p.period}
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-sm ${p.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {p.desc}
                  </p>
                  <ul className="mt-6 space-y-2 text-sm">
                    {p.items.map((i) => (
                      <li key={i} className="flex gap-2">
                        <Check
                          className={`mt-0.5 size-4 shrink-0 ${p.featured ? "text-accent" : "text-accent"}`}
                        />
                        <span
                          className={
                            p.featured ? "text-primary-foreground/80" : "text-muted-foreground"
                          }
                        >
                          {i}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#planos"
                    className={`mt-7 block rounded-md px-6 py-3 text-center text-sm font-semibold transition-transform hover:scale-[1.02] ${
                      p.featured
                        ? "bg-accent text-accent-foreground shadow-card"
                        : "border border-border text-foreground"
                    }`}
                  >
                    {p.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-5 py-20">
          <Eyebrow>DÚVIDAS</Eyebrow>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Dúvidas frequentes
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-border bg-card p-5 shadow-card"
              >
                <summary className="cursor-pointer list-none font-medium marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="shrink-0 font-mono text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-2xl bg-primary p-10 text-center text-primary-foreground shadow-elegant md:p-16">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Tire o gargalo de arte da sua gráfica
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
              Crie sua conta grátis e trate o próximo pedido do cliente em minutos, pronto para a
              máquina.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#planos"
                className="rounded-md bg-accent px-7 py-3 font-semibold text-accent-foreground shadow-card transition-transform hover:scale-[1.02]"
              >
                Criar conta grátis
              </a>
              <a
                href="#planos"
                className="rounded-md border border-primary-foreground/20 px-7 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Ver planos PRO
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo variant="mono" />
              <p className="mt-4 max-w-xs text-sm text-primary-foreground/60">
                Pré-impressão para gráficas e estamparias — halftone, vetorização, mockup e montagem
                de DTF, direto do navegador.
              </p>
            </div>

            <div>
              <h3 className="font-mono text-xs font-semibold tracking-widest text-primary-foreground/45">
                PRODUTO
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href="#ferramentas"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Ferramentas
                  </a>
                </li>
                <li>
                  <a
                    href="#exemplos"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Exemplos
                  </a>
                </li>
                <li>
                  <a
                    href="#planos"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Planos
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Dúvidas
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-xs font-semibold tracking-widest text-primary-foreground/45">
                FERRAMENTAS
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/ferramentas/halftone"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Halftone
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ferramentas/remover-fundo"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Remover Fundo
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ferramentas/vetorizar"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Vetorizador
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ferramentas/mockup"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Mockup Studio
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-xs font-semibold tracking-widest text-primary-foreground/45">
                EMPRESA
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href="mailto:contato@printzy.com.br"
                    className="text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground">
                    Termos de uso
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground">
                    Privacidade
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/50 md:flex-row">
            <span>© 2026 Printzy Studio. Todos os direitos reservados.</span>
            <span className="font-mono">www.printzy.com.br</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
