import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printzy Studio | Ferramentas online para DTF e DTG" },
      {
        name: "description",
        content:
          "Prepare artes para DTF e DTG no navegador: halftone, remoção de fundo, vetorizador, mockups, molduras e arquivos prontos para produção.",
      },
      { property: "og:title", content: "Printzy Studio | Ferramentas online para DTF e DTG" },
      {
        property: "og:description",
        content:
          "Halftone, vetorizador, mockups e preparação de arquivos DTF/DTG em uma única plataforma online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tools = [
  { tag: "PRO", icon: "⠿", name: "Halftone DTF/DTG", desc: "Retículas nítidas e semitransparências prontas para impressão." },
  { tag: "GRÁTIS", icon: "◒", name: "Removedor de Fundo", desc: "Limpeza precisa sem comer as bordas da sua arte." },
  { tag: "NOVO", icon: "◇", name: "Vetorizador PRO", desc: "Transforme artes em SVG limpo e editável no navegador." },
  { tag: "NOVO", icon: "▣", name: "Mockup Studio", desc: "Aplique estampas, troque cores e exporte mockups profissionais." },
  { tag: "PRO", icon: "⌗", name: "Molduras PRO", desc: "Bordas corridas, grunge e acabamentos transparentes." },
  { tag: "PRO", icon: "◎", name: "Cor Spot PRO", desc: "Separe cores especiais com controle total." },
  { tag: "PRO", icon: "↘", name: "Contração de Bordas", desc: "Evite halos brancos no acabamento final." },
  { tag: "GRÁTIS", icon: "⬒", name: "Arquivo DTF", desc: "Monte folhas DTF com medidas, régua e exportação." },
];

const benefits = [
  { kicker: "100% ONLINE", title: "Nada para instalar", desc: "Acesse do computador e comece a trabalhar direto no navegador." },
  { kicker: "FLUXO OTIMIZADO", title: "Produção mais rápida", desc: "Prepare arquivos em poucos cliques com controles profissionais." },
  { kicker: "PLANO PRO", title: "Exports ilimitados", desc: "Produza sem limite mensal enquanto sua assinatura estiver ativa." },
  { kicker: "ECOSSISTEMA", title: "Tudo em um só lugar", desc: "Halftone, vetor, mockups, fundo, bordas, spot e muito mais." },
];

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/ mês",
    desc: "Ideal para conhecer a plataforma e testar o fluxo.",
    items: ["Ferramentas grátis liberadas", "5 exports PRO por mês", "Conta Printzy gratuita"],
    cta: "Criar conta grátis",
    featured: false,
  },
  {
    name: "Mensal PRO",
    price: "R$ 19,90",
    period: "/ mês",
    desc: "Para usar as ferramentas premium no dia a dia.",
    items: ["Exports PRO ilimitados", "Ferramentas premium", "Atualizações da plataforma", "Produção recorrente"],
    cta: "Assinar mensal",
    featured: true,
  },
  {
    name: "Anual PRO",
    price: "R$ 127",
    period: "/ ano",
    desc: "Melhor custo para produzir o ano todo.",
    items: ["Exports PRO ilimitados", "Melhor custo-benefício", "Atualizações da plataforma", "Acesso anual completo"],
    cta: "Assinar anual",
    featured: false,
  },
];

const faqs = [
  { q: "Preciso instalar algum programa?", a: "Não. As ferramentas funcionam direto no navegador do computador." },
  { q: "Posso usar para DTF e DTG?", a: "Sim. A plataforma foi criada para preparar arquivos desses dois fluxos." },
  { q: "Qual a diferença entre o grátis e o PRO?", a: "O grátis libera as ferramentas básicas. O PRO libera recursos premium e exports ilimitados." },
  { q: "O plano mensal recebe atualizações?", a: "Sim. Mensal e anual recebem todas as atualizações enquanto o acesso estiver ativo." },
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
        {/* Hero */}
        <section className="bg-gradient-hero">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center md:py-28">
            <div>
              <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium tracking-widest text-muted-foreground">
                PLATAFORMA ONLINE PARA DTF E DTG
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Prepare arquivos para DTF e DTG sem programas pesados
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Crie halftones, remova fundos, vetorize artes, monte mockups e deixe tudo pronto
                para produção — direto no navegador.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#planos"
                  className="rounded-full bg-gradient-primary px-7 py-3 font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
                >
                  Começar grátis
                </a>
                <a
                  href="#ferramentas"
                  className="rounded-full border border-border px-7 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Ver ferramentas
                </a>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                <span className="text-accent">★★★★★</span> 4,9/5 • Para designers, estamparias, DTF,
                DTG e personalizados
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="font-display text-sm font-semibold">Printzy Studio</span>
                <span className="text-xs text-muted-foreground">Painel • Ferramentas • Projetos</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {tools.slice(0, 6).map((t) => (
                  <div key={t.name} className="rounded-xl bg-secondary p-3">
                    <div className="text-lg text-primary-glow">{t.icon}</div>
                    <div className="mt-1 text-sm font-medium">{t.name}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Projeto pronto para exportar — PNG • SVG • PDF • 300 DPI
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Uma plataforma, todo o fluxo
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Ferramentas criadas para resolver etapas reais da preparação de arquivos, sem instalar
            programas e sem trocar de aplicativo toda hora.
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
              Ferramentas profissionais
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Do arquivo bruto ao arquivo pronto. A Printzy reúne as principais etapas da produção
              DTF e DTG em um só lugar.
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

        {/* Planos */}
        <section id="planos" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Planos para cada momento
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Comece grátis e evolua quando sua produção pedir mais.
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
                    MAIS RECOMENDADO
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
                Aprenda dentro do ecossistema
              </h2>
              <p className="mt-3 text-muted-foreground">
                Aulas práticas de halftone, DTF, DTG, vetorização, mockups e preparação de arquivos
                — aplique o processo direto nas ferramentas.
              </p>
              <a
                href="#aulas"
                className="mt-7 inline-block rounded-full border border-border px-7 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                Ver aulas
              </a>
            </div>
            <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
              <div className="font-display text-sm font-semibold text-primary-glow">
                AULAS PRINTZY STUDIO
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>01 • Halftone perfeito para DTF</li>
                <li>02 • Vetorização rápida de logos</li>
                <li>03 • Mockups que vendem mais</li>
                <li>04 • Montando folhas DTF sem desperdício</li>
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
              Comece grátis e prepare suas artes no navegador
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#planos"
                className="rounded-full bg-gradient-primary px-7 py-3 font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
              >
                Começar grátis
              </a>
              <a
                href="#planos"
                className="rounded-full border border-border px-7 py-3 font-semibold transition-colors hover:bg-secondary"
              >
                Ver planos
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row">
          <Logo />
          <span>www.printzy.com.br</span>
          <span>© {new Date().getFullYear()} Printzy Studio</span>
        </div>
      </footer>
    </div>
  );
}
