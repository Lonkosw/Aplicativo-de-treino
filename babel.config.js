module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // `jsxImportSource: 'nativewind'` faz o Babel compilar o JSX usando o
      // runtime do NativeWind em vez do runtime padrao do React. E isso que
      // permite escrever `className` em componentes React Native.
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Sem bundler-side effects na web voce simplesmente faria fetch de um
      // arquivo .sql. No React Native nao existe filesystem do projeto em
      // runtime, entao o conteudo dos arquivos de migration precisa ser
      // "inlinado" no bundle JS em tempo de build. E o que este plugin faz.
      ['inline-import', { extensions: ['.sql'] }],
    ],
  };
};
