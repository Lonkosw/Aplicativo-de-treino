/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Fundo quase preto -> superficies em cinza escuro.
        fundo: '#0A0A0B',
        superficie: '#141416',
        superficie2: '#1C1C1F',
        superficie3: '#26262A',
        borda: '#2E2E33',

        texto: '#F5F5F7',
        texto2: '#A0A0A8',
        texto3: '#6B6B73',

        // Unico tom de destaque: acoes primarias, recordes e timer ativo.
        destaque: '#E11D2B',
        destaqueEscuro: '#B3151F',
        destaqueFundo: '#2A0D11',

        sucesso: '#22C55E',
      },
      fontSize: {
        // Numeros grandes: peso e repeticoes sao o conteudo principal.
        numero: ['22px', { lineHeight: '26px', fontWeight: '700' }],
        numeroG: ['34px', { lineHeight: '38px', fontWeight: '800' }],
      },
    },
  },
  plugins: [],
};
