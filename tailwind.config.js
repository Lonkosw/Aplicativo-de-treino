/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Espelha src/constants/tema.ts. Contraste medido: texto >= 4.5:1,
        // componentes de interface >= 3:1.
        fundo: '#0A0A0B',
        superficie: '#141416',
        superficie2: '#1C1C1F',
        superficie3: '#26262A',

        borda: '#2E2E33',
        bordaCampo: '#5B5B64',

        texto: '#F5F5F7',
        texto2: '#A0A0A8',
        texto3: '#83838B',

        // Unico tom de destaque: acoes primarias, recordes e timer ativo.
        // `destaque` preenche; `destaqueTexto` e a mesma matiz clareada,
        // usada quando o vermelho vira texto ou icone pequeno.
        destaque: '#E11D2B',
        destaqueTexto: '#E94E58',
        destaqueEscuro: '#B3151F',
        destaqueFundo: '#2A0D11',

        graficoRecessivo: '#626268',
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
