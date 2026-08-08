# Modelagem do UI real — aguiarts.com.br

Notas levantadas navegando o produto real logado (sessão de 08/08/2026), pra guiar o
ajuste do nosso clone. Tudo aqui foi lido direto do DOM/estilos computados do site.

## Arquitetura de rotas do produto real

Site estático multipágina:

| URL                              | O que é                             |
| -------------------------------- | ----------------------------------- |
| `/`                              | landing pública                     |
| `/login?mode=signup`             | login/cadastro                      |
| `/dashboard.html`                | painel (home logada)                |
| `/dashboard.html#ferramentas`    | grade de todas as ferramentas       |
| `/dashboard.html#aulas`          | aulas/tutoriais                     |
| `/planos.html`                   | planos                              |
| `/app/tool.html?tool=<slug>`     | **todas** as ferramentas, uma página parametrizada |

### Slugs das 13 ferramentas

`halftone`, `molduras`, `vetorizador`, `mockup-studio`, `arquivo-dtf`,
`removedor-fundo`, `limpador-fundo`, `pontos-fantasmas`, `cor-spot`,
`contracao-bordas`, `melhorador-pro`, `calculadora`, `orcamento`

Nosso clone tem 8. **Faltam 5**: Pontos Fantasmas, Melhorador PRO, Calculadora de
Preços, Orçamento PRO e a distinção entre "Removedor de Fundo" e "Limpador de Fundo"
(são duas ferramentas diferentes no produto real — nós temos só uma).

## Tokens de design (lidos do `:root` do site)

```css
--ag-bg:          #050811;   /* fundo geral */
--ag-bg-2:        #08101b;
--ag-panel:       #0b111d;
--ag-panel-2:     #101827;
--ag-panel-3:     #151d2d;
--ag-line:        rgba(148,163,184,.16);
--ag-line-strong: rgba(139,92,246,.38);
--ag-text:        #f7f8fb;
--ag-muted:       #98a3b8;
--ag-purple:      #8b5cf6;   /* acento principal */
--ag-purple-2:    #b26cff;
--ag-lime:        #b7ff00;   /* CTA / destaque */
--ag-danger:      #ff5b77;
--ag-radius:      16px;
--ag-sidebar:     220px;
--ag-topbar:      76px;
--ag-font:        Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
```

Um segundo conjunto (da landing) coexiste: `--bg #050507`, `--panel #0e0f17`,
`--panel2 #151623`, `--purple #9b5cff`, `--purple2 #6e2dff`, `--green #b8ff19`.

Diferença grande pro nosso clone: usamos roxo/magenta claro com fundo claro em vários
pontos e fonte Space Grotesk/DM Sans. O real é **dark quase preto azulado + roxo
violeta + lima**, tudo em Inter.

## Layout da página de ferramenta (`/app/tool.html`)

Quatro regiões:

1. **Topbar** (76px, full width): logo AG AGUIARTS STUDIO à esquerda (ocupa a largura
   da sidebar) · título da ferramenta + subtítulo · à direita: seletor de idioma
   `PT ▾`, pílula `Exports: 0/5 • restam 5`, avatar + plano `Gratuito ▾`.
2. **Sidebar** (220px): `Início`, rótulo de seção `FERRAMENTAS`, as 13 ferramentas com
   ícone. Item ativo = fundo roxo translúcido + borda esquerda roxa. Rodapé fixo com
   card `Plano atual: Gratuito` / `Exports: 0/5` / botão `Gerenciar assinatura`.
3. **Coluna de controles** (~250px, scroll próprio): botão `Selecionar imagem`
   (PNG, JPG ou WebP) → card de status (`Nenhuma imagem carregada`) → grupos de
   opções. Cada grupo tem rótulo pequeno maiúsculo roxo, botões em pílula
   (ativo = roxo sólido, inativo = card escuro) e um texto de ajuda `Dica:` com o
   rótulo em roxo.
4. **Área de preview** (resto): cabeçalho `Prévia da arte` + legenda à esquerda; à
   direita seletor de fundo (xadrez / preto / branco / gradiente), `Ver antes`,
   `Ajustar`, slider de `Zoom` + `100%`. Corpo com a arte centralizada sobre fundo
   xadrez, etiqueta `Depois / resultado` e badge de zoom. Barra inferior com status à
   esquerda (`Sem imagem`) e dica à direita (`Preview = zoom • arraste para navegar •
   segure Ver antes`).

### Halftone DTF/DTG (`?tool=halftone`)

Título: "Halftone DTF Pro" — "Crie halftone e tramados para DTF/DTG em poucos cliques."

Grupos de controle, na ordem:

- `TIPO DE FUNDO` — 3 opções empilhadas, cada uma com nome + descrição inline:
  Fundo escuro (_ideal para artes em fundo preto_) · Fundo colorido (_remove a cor do
  fundo_) · Fundo claro (_remove branco e cinza claro_).
  Dica: "escolha o fundo mais parecido com a imagem para a limpeza ficar mais precisa."
- `TAMANHO DA ARTE` — Original · A4 · A3 · A2 · Personalizado (grade de 3).
- `QUALIDADE DA IMAGEM` — 300 · 600 · 1200.
  Dica: "300 DPI já resolve a maioria dos trabalhos. Use 600 ou 1200 para arquivos
  maiores e mais detalhados."
- `TAMANHO DO PONTO` — 30 · 35 · 40 · 45 · 50.
  Dica: "valores menores deixam os pontos maiores. Valores maiores deixam o halftone
  mais fino."
- `Força do ponto` — slider com valor numérico à direita (1.00).

Note que o real usa **presets em pílula** onde o nosso usa sliders livres.

## Arquitetura interna do app

`/app/tool.html` é só a **casca**: topbar + sidebar + um `<iframe id="frame"
class="ag-tool-frame">` que carrega o HTML da ferramenta. Ou seja, o shell é
compartilhado e cada ferramenta é um documento independente. Existe também um
`div.tool-blocker` no shell, que é o paywall — quando o plano estoura o limite ele
cobre a ferramenta com "Limite mensal atingido / Seu plano gratuito já utilizou os 5
exports PRO deste mês." + botões `Ver planos` e `Todas as ferramentas`.

Cada ferramenta traz também um aviso "Ferramenta feita para computador" — há um gate
de mobile.

## As três variantes de layout

O layout **não é uniforme**. São três padrões:

- **A — controles à esquerda + preview único à direita**: Halftone, Molduras,
  Removedor de Fundo, Arquivo DTF, Limpador de Fundo.
- **B — preview à esquerda + controles à direita**: Vetorizador (preview dividido
  Original | Vetorizado lado a lado).
- **C — três colunas**: Mockup Studio (biblioteca de mockups à esquerda, palco no
  meio, painel Camadas/Fundo/Design à direita).

E duas ferramentas são formulário puro, sem preview de imagem: Calculadora de Preços
e Orçamento PRO.

### Vetorizador PRO (`?tool=vetorizador`) — variante B

"Converta PNG e JPG em SVG real, limpo e editável, preservando cores, contornos e detalhes."

- Preview à esquerda: cabeçalho `Antes / Depois` + badge `SVG real por paths`, botões
  `Encaixar` e `100%`. Corpo com dois painéis xadrez lado a lado (`Original` |
  `Vetorizado`). Placeholder: "Arraste uma imagem ou clique em importar para começar."
- Barra inferior do preview: `Antes / Depois` · `Só vetor` · `Fundo` · zoom `−` `100%` `+`.
- Rodapé de status: "**Pronto.** Ajuste cores e detalhes antes de exportar o SVG."
- Controles à direita, com **badges numerados** roxos: `1 Imagem` (Selecionar imagem
  em lima + Limpar) · `2 Resultado` (Low/Medium/High) · `3 Cores` (Automático / Mais
  cores / Custom).
- Sliders em **grade de 2 colunas**, rótulo à esquerda e valor à direita:
  Quantidade 3 · Suavização 3 · Limpar ruído 18 · Anti-gap 1.0 · Ignorar serrilhado 55 ·
  Fechar furinhos 12 · Borda lisa 18 · Remover manchas 8 · Preservar branco 75.
  Checkbox "Contorno inteligente: tenta manter círculo como…".
- Ações fixas no rodapé da coluna, grade 2×2: `Vetorizar` (roxo) · `Copiar SVG` ·
  `Baixar SVG` (lima) · `Baixar PNG`.

### Molduras PRO (`?tool=molduras`) — variante A

"Aplique molduras corridas e bordas grunge na arte com PNG transparente."

Grupos com badge numerado `01 IMAGEM` · `02 MOLDURAS` · `03 AJUSTE DA ARTE`:

- `02` é uma **grade 3×N de miniaturas** com número no canto (01…09+) e um check roxo
  na selecionada, com scroll próprio.
- `03`: `Preencher` · `Encaixar` · `Tela cheia`, e sliders `Zoom da arte` (100%),
  `Mover X` (0), `Mover Y` (0).
- Dica no rodapé do preview: "Preview = zoom + arraste para navegar. A maioria das
  molduras corta apenas áreas conectadas às laterais. Molduras 01 e 02 usam modo
  especial para aparecer corretamente."

### Mockup Studio (`?tool=mockup-studio`) — variante C

"Aplique suas artes em coleções de mockups com frente, costas e variações de cor."

- Coluna esquerda: busca `Buscar mockups...`, filtros `Todos` / `Oversized`, título
  `Mockups` + contador, grade de miniaturas (`Oversized_001`) com check na selecionada.
- Topo do palco: alternador `Frente` / `Costas` (pílula) e `+ Adicionar arte`.
- Coluna direita com abas em ícone: `Camadas` · `Fundo` · `Design` (ativa em roxo).
  Em Design: `COR DA PEÇA` (grade 5×N de swatches + botão `+`), botão outline lima
  `Substituir / enviar arte`, `MODO DE AJUSTE` (`Fit` / `Fill` / `Stretch`), sliders
  `Escala` 72% · `Opacidade` 100% · `Efeito tecido` 35%.
- Rodapé: desfazer/refazer, `Substituir arte`, zoom `− 100% +`, `Ajustar`, tela cheia,
  e `Exportar PNG` em lima com dropdown.

### Arquivo DTF (`?tool=arquivo-dtf`) — variante A + réguas

"Monte folhas DTF com medidas, régua e exportação em alta qualidade."

- Controles: `Subir imagens` (PNG, JPG ou WebP • pode enviar várias) ·
  `TAMANHO DO ARQUIVO DTF` (30×40 cm · 30×100 cm · 58×100 cm · Personalizado) ·
  campos `LARGURA (CM)` / `ALTURA (CM)` · select `QUALIDADE DE EXPORTAÇÃO`
  (300 DPI — profissional) · `FUNDO DA PRÉVIA` (Trans. Claro / Trans. Escuro / Cor) ·
  `IMAGENS CARREGADAS`.
- Palco com **réguas em centímetros** no topo e na lateral, acompanhando o zoom.
  Cabeçalho: "Área de montagem • régua em centímetros • exportação fiel em 300 DPI",
  botão `Guias` + slider de zoom.
- Coluna direita extra: `IMAGEM SELECIONADA` e `INFORMAÇÕES` com atalhos de teclado
  (`Mouse` arrasta, `Roda` zoom, `Del` excluir, `Ctrl+D` duplicar, `Esc` tirar seleção).
- Rodapé: "30 × 40 cm • 300 DPI • 3543 × 4724 px".

### Removedor de Fundo Pro (`?tool=removedor-fundo`) — variante A

"Remova fundos com precisão e recupere cores internas."

- `ENVIAR IMAGEM` (área tracejada grande) · `MODO DE REMOÇÃO` (`Automático bordas` /
  `Conta-gotas`) + card com a cor detectada e seu RGB · `RECUPERAR COR`
  (`Recuperar` / `Limpar proteção` + slider `TOLERÂNCIA RECUPERAR` 38) · `AJUSTES`
  (`TOLERÂNCIA` 44 …).
- Preview com abas `Depois / Sem fundo` · `Depois` (lima) e botão `Ver antes` em lima
  no canto superior direito.

### Limpador de Fundo (`?tool=limpador-fundo`) — variante A

Ferramenta **diferente** do Removedor. Controles: `Selecionar imagem`, sliders
`Força da limpeza`, `Proteção da arte`, `Suavizar manchas`; ações `Baixar PNG`,
`Limpar`; preview com `Ver antes`, `Ajustar`, `Zoom`.

### Cor Spot Pro (`?tool=cor-spot`) — variante A

"Crie chapas spot, spot branco e cores especiais."

Modos `Automático` / `Seleção por cor`; tipos de spot: `Spot Branco`, `Spot Verniz`,
`Spot Dourado`, `Spot Prata`, `Spot Cor Especial`. Select de DPI (300/600/1200) e de
fundo (Transparente, Transp. claro, Transp. escuro, Branco, Preto, Cor personalizada).
Preview `Preview do Spot` com `Ver antes`, `Máscara`, `Ajustar`, `100%`.
Exportação: `Baixar PNG`, `Baixar PDF`.

### Contração de Bordas (`?tool=contracao-bordas`) — variante A

Campos: `Selecionar arquivo` ("Envie PNG com fundo removido para melhor resultado"),
sliders `Reduzir borda`, `Acabamento suave`, `Detecção da borda`, selects `DPI` e
`Visualização` (Transparente / Branco / Preto / Cor personalizada).
Ações: `Visualizar área removida`, `Baixar PNG final`, `Baixar PDF em alta`.

### Melhorador de Imagem Pro (`?tool=melhorador-pro`) — variante A

Aceita **lote**: "Subir 1 ou várias imagens PNG, JPG ou WebP • lote liberado".
Escala `1×` `2×` `3×` `4×`; dois modos em card com descrição:
`Melhoria rápida` ("Processa mais rápido e já melhora a nitidez.") e
`Super HD` ("Qualidade mais forte, com reforço extra de detalhe.").
Select `Formato` (PNG/JPG), contador `Total`. Ações `Melhorar imagem`,
`Baixar imagem`, `Comparar`, `Ajustar`, `Centralizar`, `Baixar`.

### Calculadora de Preços (`?tool=calculadora`) — formulário

Sem preview. `Adicionar item`, alternador `Preço sugerido` / `Preço manual`, campos
`Nome do produto/serviço`, `Quantidade`, `Moeda` (R$ BRL / $ USD / € EUR).
Presets rápidos: `Camiseta DTF`, `Caneca`, `Adesivo`, `Zerar custos`.
Custos: `Produto base`, `Embalagem`, `Mão de obra por unidade`, `Energia/outros`,
`Valor da hora`, `Minutos por peça` + `Calcular mão de obra`.
Modo de impressão: `Manual` / `Metro` / `m²` / `Folha`, com os campos correspondentes
(`Preço / metro`, `Preço / m²`, `Preço da folha`, `Largura/Altura folha cm`,
`Largura/Altura arte cm`, `Perda %`).
Fechamento: `Taxa %`, `Taxa fixa`, `Imposto %`, `Desconto %`, `Margem desejada %`,
`Preço de venda`. Saída: `Copiar resumo`, `Exportar PDF`, painel `Orçamento`.

### Orçamento PRO (`?tool=orcamento`) — formulário

Gera orçamento em PDF/PNG com identidade da gráfica. `Adicionar logo`,
`Tema do orçamento/PDF` (Escuro/Claro), `Fundo da logo` (Automático/Transparente).
Dados: `Empresa`, `WhatsApp`, `E-mail / Instagram`, `Chave Pix`, `Cliente`,
`WhatsApp cliente`, `Nº orçamento`, `Data`, `Validade`.
`Tipo de serviço` (DTF, DTG, Sublimação, Camiseta personalizada, Caneca personalizada,
Adesivo, Brinde / personalizado, Outro), `Forma pagamento` (Pix, Dinheiro, Cartão,
Parcelado, A combinar).
Catálogo com filtros `Todos` / `DTF/DTG` / `Sublimação` / `Outros` e itens prontos
(`Camiseta DTF frente pequena`, `Camiseta DTF frente grande`, `Camiseta DTG`,
`Transfer DTF por unidade`, …).
Ações: `Salvar`, `Carregar`, `Limpar`, `Copiar WhatsApp`, `Baixar PDF`, `Baixar PNG`.

### Pontos Fantasmas (`?tool=pontos-fantasmas`)

Título "Removedor de Pontos Fantasmas". **Não consegui ler os controles** — a aba
`about:blank` do rastreador do checkout voltou a bloquear o acesso da extensão nessa
hora. É a única das 13 que ficou pendente.

## Padrões visuais recorrentes

- Botão primário de ação = **lima `#b7ff00`** com texto escuro (`Selecionar imagem`,
  `Baixar SVG`, `Exportar PNG`, `Ver antes`).
- Botão secundário/estado ativo = **roxo `#8b5cf6`** sólido.
- Botão inativo = card `#101827` com borda `rgba(148,163,184,.16)`.
- Rótulo de grupo = maiúsculas, ~11px, letter-spacing, cor roxa.
- Badge numerado do passo = quadradinho roxo com o número (`1`, `01`).
- Valor do slider aparece **à direita do rótulo**, na cor de acento.
- Texto de ajuda começa com "**Dica:**" em roxo.
- Fundo do preview = xadrez, com etiqueta flutuante (`Depois / resultado`) e badge de
  zoom no canto.
- Toda ferramenta tem barra de status no rodapé: estado à esquerda, dica de
  interação à direita.

