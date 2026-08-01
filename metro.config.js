const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Metro e o bundler do React Native (equivalente ao Vite/webpack da web).
// Diferente da web, ele precisa saber explicitamente quais extensoes de
// arquivo sao "codigo fonte" — por isso registramos `.sql`.
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// O react-native-gifted-charts faz `require('react-native-linear-gradient')`
// dentro de um try/catch, com fallback para `expo-linear-gradient`. So que o
// Metro resolve imports em tempo de build: o try/catch nunca roda e o bundle
// quebraria por modulo nao encontrado. Redirecionamos a resolucao aqui.
// (Na web o bundler simplesmente ignoraria o require que falha em runtime.)
const resolverPadrao = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const alvo = moduleName === 'react-native-linear-gradient' ? 'expo-linear-gradient' : moduleName;
  return (resolverPadrao ?? context.resolveRequest)(context, alvo, platform);
};

// O NativeWind compila o CSS do Tailwind em tempo de build e injeta o
// resultado no bundle. Nao existe CSSOM no React Native: o `className` vira
// um objeto de estilo comum.
module.exports = withNativeWind(config, { input: './src/global.css' });
