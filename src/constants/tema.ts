/**
 * Mesmas cores do `tailwind.config.js`, exportadas como valores JS.
 * Componentes de terceiros (gráficos, navegação, StatusBar) recebem cor
 * por prop e não entendem `className` — por isso a duplicação.
 *
 * Todos os pares texto/fundo aqui foram medidos: texto normal ≥ 4.5:1,
 * componentes de interface ≥ 3:1 (WCAG AA). Num app usado em academia,
 * com suor na tela e luz forte, isso não é enfeite.
 */
export const cores = {
  fundo: '#0A0A0B',
  superficie: '#141416',
  superficie2: '#1C1C1F',
  superficie3: '#26262A',

  /** Borda decorativa (cartões, divisórias). Não precisa de contraste. */
  borda: '#2E2E33',
  /** Borda de campo tocável. 3:1 — é ela que diz "isto é um campo". */
  bordaCampo: '#5B5B64',

  texto: '#F5F5F7',
  texto2: '#A0A0A8',
  /** 4.5:1 sobre superficie2, a pior superfície onde aparece. */
  texto3: '#83838B',

  /** Preenchimentos: botões, barras, marcadores. Branco por cima passa 4.76:1. */
  destaque: '#E11D2B',
  /** Mesma matiz, clareada para TEXTO e ícones pequenos: 4.6:1 no pior caso. */
  destaqueTexto: '#E94E58',
  destaqueEscuro: '#B3151F',
  destaqueFundo: '#2A0D11',

  /** Barra/linha recessiva de gráfico: 3:1 sobre a superfície do cartão. */
  graficoRecessivo: '#626268',
} as const;

/** Altura mínima de alvo de toque. O app é usado de pé, com uma mão só. */
export const ALVO_TOQUE = 48;

/** Durações de animação, em ms. Curtas: o app é usado com pressa. */
export const DURACAO = {
  rapida: 120,
  media: 200,
  lenta: 320,
} as const;
