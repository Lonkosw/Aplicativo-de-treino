const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Metro e o bundler do React Native (equivalente ao Vite/webpack da web).
// Diferente da web, ele precisa saber explicitamente quais extensoes de
// arquivo sao "codigo fonte" — por isso registramos `.sql`.
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// O NativeWind compila o CSS do Tailwind em tempo de build e injeta o
// resultado no bundle. Nao existe CSSOM no React Native: o `className` vira
// um objeto de estilo comum.
module.exports = withNativeWind(config, { input: './src/global.css' });
