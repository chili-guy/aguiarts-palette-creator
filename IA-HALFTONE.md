# Motor de IA do Halftone (img2img)

A ferramenta Halftone tem dois motores, escolhidos no controle **"Motor"**:

| Motor | O que faz |
| --- | --- |
| **Retícula** | a retícula determinística do projeto (LPI, ângulo, níveis, camada de sólido, ganho de ponto). Roda 100% no navegador, sem custo. |
| **IA (img2img)** | envia a arte recortada para um modelo de imagem que a **redesenha** como separação de halftone para DTF, no espírito do produto de referência (dtfchat/OverOne). |

O motor de IA precisa de um provedor. Estão implementados **Gemini** (Google) e **fal.ai**.

## Configuração

1. Local: `cp .env.example .env` e preencha. O `.env` não é versionado
   (`.gitignore`). O servidor de dev (`bun run dev`) lê o `.env` automaticamente.
2. Produção (Vercel): **Project → Settings → Environment Variables**. Redeploy.

### Variáveis

| Variável | Para quê |
| --- | --- |
| `AI_PROVIDER` | `gemini` ou `fal`. Sem isso: usa Gemini se houver `GEMINI_API_KEY`, senão fal. |
| `GEMINI_API_KEY` | chave do Google AI Studio (<https://aistudio.google.com>) |
| `GEMINI_HALFTONE_MODEL` | opcional — padrão `gemini-2.5-flash-image` |
| `FAL_KEY` | chave da fal.ai (<https://fal.ai/dashboard/keys>) |
| `FAL_HALFTONE_MODE` | opcional — `edit` (padrão) ou `img2img` |
| `FAL_HALFTONE_MODEL` | opcional — padrão `fal-ai/nano-banana/edit` (modo edit) / `fal-ai/flux/dev/image-to-image` (modo img2img) |
| `FAL_HALFTONE_LORA_URL` | opcional — LoRA de halftone; força `img2img` + `fal-ai/flux-lora/image-to-image` |

**Por que `edit` e não `img2img`:** testado nas duas — o `flux/dev/image-to-image`
com força baixa ignora a instrução (devolve a imagem quase igual) e com força alta
**redesenha** a arte inteira (troca personagens, cenário). O `nano-banana/edit`
(Gemini 2.5 Flash Image, cobrado pela fal — **não** precisa de billing no Google)
mantém a composição e aplica de fato a retícula de pontos. ~US$ 0,02–0,04/imagem.

## Camisa preta (DTF) — como sai transparente

A IA sempre devolve **pontos pretos no branco** (o modo mais confiável do modelo).
O tool então faz o **Recorte DTF** (`src/lib/image-core/ai-knockout.ts`,
`knockoutHalftone`): tira o branco, deixa só os pontos, e repinta na cor da tinta.

Controles no painel "Estilo da IA":

- **Seletiva / Tudo em ponto** — "Seletiva" (padrão) reticula só degradês, sombras e
  bordas suaves; área de cor chapada fica 100% sólida (é o certo para DTF). "Tudo em
  ponto" quebra a imagem inteira em pontos. É só instrução de prompt (`SELECTIVE_CLAUSE`).
- **Recorte DTF / Cru da IA** — liga/desliga o recorte. Ligado é o normal para DTF.
- **Dureza do recorte** — 0 mantém a borda macia do modelo, 1 quase limiariza.
- **Tinta no traço / Tinta na luz** — qual tom vira tinta. "Traço" (padrão) é para
  desenho/cartoon: o contorno escuro vira tinta. "Luz" inverte, para foto que sai
  em negativo.

Fluxo p/ camisa preta: estilo **1 cor (spot)** + peça **escura** (passo 04) + tinta
**branca** + **Tinta no traço**. Resultado: pontos brancos no transparente.

**Observado:** o `nano-banana/edit` é inconsistente — às vezes sai retícula limpa,
às vezes uma textura mais granulada. Regenerar costuma resolver. Para retícula
matematicamente perfeita, o motor **Retícula** continua sendo a opção previsível.

## Custo — importante

**Não existe geração de imagem 100% grátis e confiável.**

- **Gemini**: a chave do AI Studio é grátis, mas o **free tier cobre só modelos de
  texto**. Os modelos de imagem (`gemini-2.5-flash-image` etc.) têm cota de free
  tier **igual a zero** — a chamada volta `429 RESOURCE_EXHAUSTED / limit: 0`.
  Para usar, é preciso **habilitar faturamento** no projeto Google. Aí custa da
  ordem de **US$ 0,04 por imagem**.
- **fal.ai**: conta nova recebe um **crédito de cortesia** (na faixa de US$ 1) —
  suficiente para dezenas de testes. Depois, poucos centavos por imagem no
  `flux/dev/image-to-image`.

Para um **teste sem gastar nada agora**: crie a conta na fal.ai e use o crédito
de cortesia (`AI_PROVIDER=fal` + `FAL_KEY`). O adaptador já está pronto.

O app **não tem sistema de créditos/limite** como a referência. Quem tem a chave
paga pelo uso. Sem chave válida, o resto do site funciona e o botão "Gerar com
IA" retorna um erro claro.

## Como funciona por dentro

- `src/lib/ai/halftone-ai.ts` — uma *server function* do TanStack Start,
  `generateHalftoneAI`. A chave e o modelo só existem no servidor; nunca vão
  para o bundle do cliente.
- O cliente recorta a arte (mesma limpeza de fundo do motor de retícula),
  reduz para no máx. **1024 px** no maior lado, manda como data URI.
- Gemini: uma chamada única `:generateContent` (~10 s). fal.ai: envia para a
  fila e o **servidor** espera o resultado (até 90 s).
- O servidor devolve a imagem como data URI — o resultado já sai transparente e
  é exportado como veio (PNG/PDF), em tamanho cheio.

### Vercel — duração da função

A chamada da IA pode passar dos ~10 s padrão da função serverless. Se for usar
em produção, suba o limite no `vite.config.ts`:

```ts
nitro: { preset: "vercel", vercel: { functions: { maxDuration: 120 } } }
```
