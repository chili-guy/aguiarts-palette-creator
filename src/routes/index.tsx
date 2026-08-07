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
import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/hero";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printzy Studio | Prepare artes DTF/DTG em minutos" },
      {
        name: "description",
        content:
          "Ganhe velocidade na produção de DTF e DTG: halftone, remoção de fundo, vetorização, mockups e exportação profissional — tudo no navegador.",
      },
      { property: "og:title", content: "Printzy Studio | Prepare artes DTF/DTG em minutos" },
      {
        property: "og:description",
        content:
          "Halftone, vetor, mockups, fundo, bordas, spot e mais: produza arquivos prontos para impressão sem instalar nada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tools = [
  { tag: "PRO", icon: "⠿", name: "Halftone DTF/DTG", desc: "Retículas nítidas que economizam tinta e mantêm a qualidade da estampa." },
  { tag: "GRÁTIS", icon: "◒", name: "Removedor de Fundo", desc: "Fundo limpo em segundos sem estragar bordas finas ou detalhes." },
  { tag: "NOVO", icon: "◇", name: "Vetorizador PRO", desc: "Transforme imagens em SVG escalável e pronto para produção em alta resolução." },
  { tag: "NOVO", icon: "▣", name: "Mockup Studio", desc: "Apresente estampas em camisetas reais e venda mais antes de imprimir." },
  { tag: "PRO", icon: "⌗", name: "Molduras PRO", desc: "Bordas corridas, efeitos grunge e acabamentos que valorizam o produto final." },
  { tag: "PRO", icon: "◎", name: "Cor Spot PRO", desc: "Separe cores especiais com precisão e reduza erros na impressão." },
  { tag: "PRO", icon: "↘", name: "Contração de Bordas", desc: "Elimine halos brancos e acabamentos feios no processo de transfer." },
  { tag: "GRÁTIS", icon: "⬒", name: "Arquivo DTF", desc: "Monte folhas DTF otimizadas com medidas, régua e exportação rápida." },
];

const examples = [
  {
    name: "Halftone DTF/DTG",
    tag: "PRO",
    desc: "A arte cheia vira retícula calibrada, com menos tinta e traço limpo na prensa.",
    before: exHalftoneBefore,
    after: exHalftoneAfter,
    beforeAlt: "Ilustração de lobo geométrico colorida antes do halftone",
    afterAlt: "Mesma ilustração convertida em retícula halftone pronta para impressão",
  },
  {
    name: "Removedor de Fundo",
    tag: "GRÁTIS",
    desc: "Recorte automático com bordas preservadas, pronto para mockup ou catálogo.",
    before: exBgBefore,
    after: exBgAfter,
    beforeAlt: "Foto de pessoa com fundo bagunçado antes da remoção",
    afterAlt: "Mesma foto com fundo removido e recorte limpo",
    checkered: true,
  },
  {
    name: "Vetorizador PRO",
    tag: "NOVO",
    desc: "Logo pixelado vira vetor nítido, escalável em qualquer tamanho de estampa.",
    before: exVectorBefore,
    after: exVectorAfter,
    beforeAlt: "Logo de foguete pixelado e borrado antes da vetorização",
    afterAlt: "Mesmo logo vetorizado com bordas nítidas",
  },
  {
    name: "Mockup Studio",
    tag: "NOVO",
    desc: "Sua arte aplicada em peça real para aprovar com o cliente antes de imprimir.",
    before: exMockupBefore,
    after: exMockupAfter,
    beforeAlt: "Arte de foguete isolada em fundo branco",
    afterAlt: "Mesma arte aplicada em mockup de camiseta preta",
  },
  {
    name: "Molduras PRO",
    tag: "PRO",
    desc: "Arte simples ganha moldura grunge e acabamento que valoriza a peça.",
    before: exFrameBefore,
    after: exFrameAfter,
    beforeAlt: "Ilustração de caveira com asas sem moldura",
    afterAlt: "Mesma ilustração com moldura circular grunge aplicada",
  },
  {
    name: "Arquivo DTF",
    tag: "GRÁTIS",
    desc: "Artes espalhadas viram folha DTF encaixada, com régua e zero desperdício de filme.",
    before: exDtfBefore,
    after: exDtfAfter,
    beforeAlt: "Artes espalhadas na folha com muito espaço vazio",
    afterAlt: "Folha DTF com artes encaixadas em grade otimizada e régua",
  },
];

const benefits = [
  { kicker: "MAIS VELOCIDADE", title: "Arte pronta em minutos", desc: "Pare de perder tempo com programas pesados. Suba, ajuste e exporte direto no navegador." },
  { kicker: "MENOS RETRABALHO", title: "Arquivos que saem certo", desc: "Ferramentas calibradas para DTF e DTG reduzem erros de impressão e desperdício." },
  { kicker: "EXPORTS ILIMITADOS", title: "Produção sem travar", desc: "Plano PRO libera downloads ilimitados para você produzir o quanto precisar." },
  { kicker: "TUDO EM UM LUGAR", title: "Um fluxo só, do início ao fim", desc: "Halftone, vetor, mockup, fundo, bordas e spot — sem trocar de aplicativo." },
];

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/ mês",
    desc: "Teste a plataforma e já prepare suas primeiras artes.",
    items: ["Ferramentas grátis liberadas", "5 exports PRO por mês", "Conta Printzy gratuita"],
    cta: "Criar conta grátis",
    featured: false,
  },
  {
    name: "Mensal PRO",
    price: "R$ 19,90",
    period: "/ mês",
    desc: "O plano ideal para quem produz todo dia e quer resultado profissional.",
    items: ["Exports PRO ilimitados", "Todas as ferramentas premium", "Atualizações incluídas", "Suporte prioritário"],
    cta: "Assinar agora",
    featured: true,
  },
  {
    name: "Anual PRO",
    price: "R$ 127",
    period: "/ ano",
    desc: "Melhor custo para quem quer produzir o ano inteiro pagando menos.",
    items: ["Exports PRO ilimitados", "Melhor custo-benefício", "Atualizações incluídas", "Acesso anual completo"],
    cta: "Economizar no anual",
    featured: false,
  },
];

const faqs = [
  { q: "Preciso instalar algum programa?", a: "Não. Tudo funciona no navegador do computador. Basta criar uma conta e começar." },
  { q: "Funciona para DTF e DTG?", a: "Sim. As ferramentas foram calibradas para os dois fluxos, com exports prontos para produção." },
  { q: "Qual a diferença do grátis para o PRO?", a: "O grátis libera ferramentas básicas e 5 exports PRO. O PRO libera tudo, com downloads ilimitados." },
  { q: "Posso cancelar a assinatura quando quiser?", a: "Sim. O plano mensal pode ser cancelado a qualquer momento. O anual garante o melhor preço." },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary font-display text-lg font-bold text-primary-foreground shadow-elegant">
        P
      </div>
      <span className="font-display text-xl tracking-tight">
        <span className="font-bold text-foreground">PRINT</span>
        <span className="font-light text-muted-foreground">ZY</span>
      </span>
    </div>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#ferramentas">Ferramentas</a>
            <a className="transition-colors hover:text-foreground" href="#exemplos">Exemplos</a>
            <a className="transition-colors hover:text-foreground" href="#planos">Planos</a>
            <a className="transition-colors hover:text-foreground" href="#aulas">Aulas</a>
            <a className="transition-colors hover:text-foreground" href="#faq">Dúvidas</a>
          </nav>
          <a
            href="#planos"
            className="rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
          >
            Começar grátis
          </a>
        </div>
      </header>

      <main>
        <Hero />


        {/* Benefícios */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Menos etapa. Mais produção. Menos dor de cabeça.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A Printzy foi feita para quem vive de estampa. Cada ferramenta resolve um problema real do dia a dia da produção.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="text-xs font-semibold tracking-widest text-primary-glow">{b.kicker}</div>
                <div className="mt-3 font-display text-lg font-semibold">{b.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ferramentas */}
        <section id="ferramentas" className="border-y border-border bg-card/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Tudo que você precisa para entregar arte pronta
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Do arquivo bruto ao arquivo final. Uma ferramenta para cada etapa do fluxo DTF/DTG.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tools.map((t) => (
                <article
                  key={t.name}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl text-primary-glow">{t.icon}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold tracking-widest text-muted-foreground">
                      {t.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{t.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Exemplos antes e depois */}
        <section id="exemplos" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Veja o antes e o depois de cada ferramenta
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Arraste o cursor em cada exemplo e compare o arquivo bruto com o resultado
            que sai pronto da Printzy.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {examples.map((ex) => (
              <article
                key={ex.name}
                className="rounded-2xl border border-border bg-card p-5 shadow-card"
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
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold tracking-widest text-muted-foreground">
                    {ex.tag}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Escolha seu plano e comece a produzir hoje
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Comece de graça. Quando sua produção crescer, o PRO libera tudo sem limite de exports.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl border p-7 shadow-card ${
                  p.featured
                    ? "border-primary-glow bg-gradient-hero shadow-elegant"
                    : "border-border bg-card"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold tracking-widest text-primary-foreground">
                    MAIS ESCOLHIDO
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  <span className="pb-1 text-sm text-muted-foreground">{p.period}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary-glow">✓</span>
                      <span className="text-muted-foreground">{i}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#planos"
                  className={`mt-7 block rounded-full px-6 py-3 text-center text-sm font-semibold transition-transform hover:scale-[1.02] ${
                    p.featured
                      ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                      : "border border-border text-foreground"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Aulas */}
        <section id="aulas" className="border-y border-border bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                Aprenda a produzir melhor a cada aula
              </h2>
              <p className="mt-3 text-muted-foreground">
                Conteúdo prático de halftone, DTF, DTG, vetorização e mockups — aplicado direto nas ferramentas da Printzy.
              </p>
              <a
                href="#aulas"
                className="mt-7 inline-block rounded-full border border-border px-7 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                Acessar aulas
              </a>
            </div>
            <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
              <div className="font-display text-sm font-semibold text-primary-glow">
                AULAS PRINTZY STUDIO
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>01 • Halftone que economiza tinta sem perder qualidade</li>
                <li>02 • Vetorização de logos em poucos cliques</li>
                <li>03 • Mockups que convertem em vendas</li>
                <li>04 • Montagem de folhas DTF sem desperdício</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Dúvidas frequentes
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-3xl bg-gradient-hero p-10 text-center shadow-elegant md:p-16">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Pronto para acelerar sua produção?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Crie sua conta grátis e veja como é rápido preparar arquivos DTF e DTG com a Printzy.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#planos"
                className="rounded-full bg-gradient-primary px-7 py-3 font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
              >
                Criar conta grátis
              </a>
              <a
                href="#planos"
                className="rounded-full border border-border px-7 py-3 font-semibold transition-colors hover:bg-secondary"
              >
                Ver planos PRO
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row">
          <Logo />
          <span>www.printzy.com.br</span>
          <span>© 2026 Printzy Studio</span>
        </div>
      </footer>
    </div>
  );
}
