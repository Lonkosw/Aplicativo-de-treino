/**
 * Hooks de resolução do Node usados só pela verificação.
 *
 * Fazem duas coisas que o Node não faz sozinho:
 *  1. resolvem o alias `@/` do tsconfig para arquivos em `src/`;
 *  2. trocam os módulos nativos do Expo por stubs, para que o código real
 *     de `src/db` e `src/lib` rode fora do aparelho.
 *
 * Rodamos com o `node` puro (que já remove os tipos do TypeScript) em vez
 * do tsx porque o tsx resolve os imports por conta própria e não deixa
 * estes hooks agirem.
 */
import { existsSync } from 'node:fs';

const RAIZ = new URL('../../', import.meta.url);

const STUBS = {
  'expo-sqlite': './shim-expo-sqlite.mjs',
  'expo-file-system': './shim-expo-vazio.mjs',
  'expo-sharing': './shim-expo-vazio.mjs',
  'expo-document-picker': './shim-expo-vazio.mjs',
};

/** Acha o arquivo real; o TypeScript importa sem extensão, o Node exige. */
function comExtensao(base) {
  for (const sufixo of ['', '.ts', '.tsx', '.json', '/index.ts']) {
    const tentativa = new URL(base.href + sufixo);
    if (existsSync(tentativa)) return tentativa.href;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  const stub = STUBS[specifier];
  if (stub) return { url: new URL(stub, import.meta.url).href, shortCircuit: true };

  // Sem `format`: o Node infere pela extensão `.ts` e remove os tipos.
  if (specifier.startsWith('@/')) {
    const semAlias = specifier.slice(2);
    const base = semAlias.startsWith('assets/')
      ? new URL(semAlias, RAIZ)
      : new URL(`src/${semAlias}`, RAIZ);
    const url = comExtensao(base);
    if (url) return { url, shortCircuit: true };
  }

  if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts')) {
    const url = comExtensao(new URL(specifier, context.parentURL));
    if (url) return { url, shortCircuit: true };
  }

  return next(specifier, context);
}
