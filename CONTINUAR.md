# Manual para continuar este projeto (Linux + Claude Code)

Este arquivo existe pra você retomar o trabalho em outra máquina sem perder contexto.
Leia isso primeiro, depois é só chamar o Claude Code na pasta do projeto.

## O que é este projeto

Landing page + ferramentas reais de pré-impressão pra gráficas/estamparias (marca
"Printzy" no código, mas é o mesmo produto do **aguiarts.com.br**). Rodando em
TanStack Start (React 19 + Vite + Tailwind v4), gerenciado com **Bun**.

Repositório: `github.com/chili-guy/aguiarts-palette-creator` (branch `main`).

## Setup no Linux

```bash
# instalar o Bun (se ainda não tiver)
curl -fsSL https://bun.sh/install | bash

git clone https://github.com/chili-guy/aguiarts-palette-creator.git
cd aguiarts-palette-creator
bun install
bun run dev
```

Abre em `http://localhost:8080/`.

Comandos úteis: `bun run lint`, `bun run format`, `bunx tsc --noEmit`.

## O que já está pronto

- **8 ferramentas reais funcionando**, cada uma em `/ferramentas/*`, com upload de
  imagem, processamento no navegador (sem servidor) e export PNG/PDF/SVG:
  - `/ferramentas/halftone` — retícula halftone (pontos fundem em áreas sólidas,
    considera transparência, tem seletor de cor da tinta e cor do tecido pra prévia)
  - `/ferramentas/remover-fundo` — remoção de fundo com IA (ONNX, roda 100% no
    navegador do usuário)
  - `/ferramentas/vetorizar` — rasterização pra SVG
  - `/ferramentas/mockup` — editor de mockup com Konva (arrastar/redimensionar arte)
  - `/ferramentas/molduras` — molduras (sólida/tracejada/dupla)
  - `/ferramentas/cor-spot` — separação/quantização de cores
  - `/ferramentas/contracao-de-bordas` — choke (encolhe borda pra evitar halo branco)
  - `/ferramentas/arquivo-dtf` — montagem de folha DTF com nesting em grade (**essa eu
    construí do zero, não existe no produto real** — ver seção "pendências" abaixo)
- A lógica de processamento pura fica em `src/lib/image-core/` (sem dependência de
  UI, dá pra reusar).
- Landing page (`src/routes/index.tsx`) com os cards de ferramentas linkando pra cada
  rota real.
- Identidade visual: paleta roxo/magenta da marca, textura halftone como motivo
  visual recorrente, marcas de registro (reg-mark) como detalhe decorativo, tipografia
  mono pra rótulos técnicos.
- Hero com vídeo de fundo em loop (tratado pra não dar salto visível no corte do loop)
  e um mini-carrossel interativo na coluna lateral.
- Debounce nas ferramentas mais pesadas (vetorização, cor spot, choke, halftone) pra
  não travar a UI quando o usuário arrasta um slider.

## Pendências / próximos passos

1. **Bater 100% com o UI/UX real do aguiarts.com.br.** Essa era a tarefa em
   andamento quando paramos. Não consegui conectar a extensão Claude in Chrome nessa
   sessão (o `/chrome` nunca saiu de "Status: Disabled" mesmo após reconectar,
   reinstalar e reiniciar o Chrome — pode valer a pena tentar de novo no Linux, com
   sorte é só um problema específico daquela máquina/sessão).
   - **Descoberta útil**: `https://aguiarts.com.br` é **público** e o `WebFetch`
     consegue ler a página inicial sem login — já confirmei que a estrutura de
     ferramentas bate (mesmos 8 cards). Pra páginas que exigem login (as ferramentas
     em si, dashboard, etc.), só mesmo com Chrome conectado ou com screenshots.
   - Se a extensão conectar no Linux, é só pedir pra eu navegar ferramenta por
     ferramenta e comparar/ajustar o CSS daqui.
2. **Falta a 8ª ferramenta real: "Melhorador PRO"** (nitidez/brilho/contraste). No
   aguiarts.com.br ela existe no lugar de "Arquivo DTF". A lógica já existe pronta em
   `src/lib/image-core/enhance.ts` (`adjustBrightness`, `adjustContrast`,
   `adjustSaturation`, `sharpen`) — só falta criar a rota
   `src/routes/ferramentas.melhorador.tsx` copiando o padrão das outras ferramentas
   (ex: `ferramentas.molduras.tsx` é um bom modelo, tem sliders parecidos).
   - Decidir se "Arquivo DTF" (o nesting de folha que eu inventei) fica como extra ou
     sai do ar — hoje ele está linkado na landing.
3. Sem autenticação/conta/planos reais ainda — as ferramentas são de uso livre, sem
   login, sem limite de exports. Se o produto real precisa disso, é a próxima peça
   grande (provavelmente vale usar Clerk/Auth.js + um banco, como o
   `aguiarts_modelagem` em `~/Downloads` já fazia com Prisma + NextAuth — mas essa
   pasta é Next.js, arquitetura diferente desse projeto Vite/TanStack; serviria mais
   como referência de modelo de dados do que pra copiar código direto).

## Onde as coisas ficam

```
src/lib/image-core/       lógica pura de processamento de imagem (sem UI)
src/lib/*.ts              helpers de canvas, export PDF, templates de mockup
src/components/           componentes compartilhados (Logo, RegMark, ToolPageShell,
                           CanvasExportButtons, MockupEditor)
src/routes/index.tsx      landing page
src/routes/ferramentas.*  uma rota por ferramenta
src/styles.css            tokens de design (cores, halftone, clip-path dos botões)
src/hooks/                useDebouncedValue (evita recálculo pesado a cada tique de slider)
```

## Como eu (Claude) devo continuar

Se você está lendo isso numa nova sessão do Claude Code: contexto completo está
neste arquivo e no histórico de commits (`git log`). Antes de mexer em qualquer
ferramenta, dá uma olhada no antes/depois com um upload de imagem de teste (tem
exemplos em `src/assets/ex-*.jpg`) pra confirmar que nada quebrou.
