/**
 * Mesmas cores do `tailwind.config.js`, exportadas como valores JS.
 * Componentes de terceiros (gráficos, navegação, StatusBar) recebem cor
 * por prop e não entendem `className` — por isso a duplicação.
 */
export const cores = {
  fundo: '#0A0A0B',
  superficie: '#141416',
  superficie2: '#1C1C1F',
  superficie3: '#26262A',
  borda: '#2E2E33',

  texto: '#F5F5F7',
  texto2: '#A0A0A8',
  texto3: '#6B6B73',

  destaque: '#E11D2B',
  destaqueEscuro: '#B3151F',
  destaqueFundo: '#2A0D11',

  sucesso: '#22C55E',
} as const;

/** Altura mínima de alvo de toque. O app é usado de pé, com uma mão só. */
export const ALVO_TOQUE = 48;
