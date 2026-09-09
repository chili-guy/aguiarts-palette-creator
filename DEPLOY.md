# Deploy na Vercel

O projeto é TanStack Start (SSR) com build via Nitro. Para a Vercel o Nitro usa o
preset `vercel`, que gera a pasta `.vercel/output` no formato **Build Output API** —
a Vercel reconhece isso sozinha, sem precisar de framework preset.

## O que já está configurado

- `vite.config.ts` — `nitro: { preset: "vercel" }`.
- `vercel.json` — `framework: null`, install com Bun, build com `bun run build`.
- `package.json` — `engines.node: ">=22"` (o Nitro escreve o runtime da function a
  partir da versão de Node da máquina de build; garante `nodejs22.x`).
- `.gitignore` — ignora `.vercel`.

O resultado do build é:

```
.vercel/output/static/                   assets, /models/u2netp.onnx, mockup-templates
.vercel/output/functions/__server.func/  a function de SSR (todas as rotas caem aqui)
```

## Subindo

Pelo dashboard (recomendado, mantém o sync com o GitHub):

1. vercel.com → **Add New… → Project** → importar `chili-guy/aguiarts-palette-creator`.
2. Framework Preset: **Other** (o `vercel.json` já força isso).
3. Node.js Version: **22.x**.
4. Deploy. Nenhuma variável de ambiente é obrigatória para o app rodar.

### Variável opcional — motor de IA do Halftone

O motor "IA (img2img)" da ferramenta Halftone chama o provedor fal.ai a partir de
uma *server function*. Para ligá-lo, em **Settings → Environment Variables**:

- `FAL_KEY` — chave da fal.ai (obrigatória só para esse motor)
- `FAL_HALFTONE_MODEL`, `FAL_HALFTONE_MODE`, `FAL_HALFTONE_LORA_URL` — opcionais

Sem `FAL_KEY`, o resto do site funciona normalmente e o botão "Gerar com IA"
apenas retorna um erro pedindo a configuração. Detalhes em `IA-HALFTONE.md`.

Pela CLI:

```bash
bunx vercel@latest        # preview
bunx vercel@latest --prod # produção
```

## Testando o build localmente

`bun run preview` **não funciona** aqui: ele procura `dist/server/server.js`, mas o
Nitro escreve em `.vercel/output`. Para conferir o SSR do build de produção:

```bash
bun run build
node -e '
  const h = (await import("./.vercel/output/functions/__server.func/index.mjs")).default;
  const r = await h.fetch(new Request("https://x/"), {});
  console.log(r.status, (await r.text()).length);
' --input-type=module
```

Para desenvolvimento normal continue usando `bun run dev` (porta 8080).

## Observações

- As ferramentas processam imagem 100% no navegador; a function de SSR entrega
  HTML e, se `FAL_KEY` estiver definida, hospeda as *server functions* do motor
  de IA do Halftone (`submitHalftoneAI` / `pollHalftoneAI`). Sem banco.
- O `u2netp.onnx` (~4 MB) vai como asset estático — entra no limite de deploy normal,
  mas é o maior arquivo do bundle.
- O projeto continua ligado ao Lovable: builds feitos lá ignoram o preset `vercel` e
  forçam Cloudflare, então os dois destinos convivem sem conflito.
- Não reescrever histórico já publicado (ver `AGENTS.md`).
