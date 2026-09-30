// Gera os PNGs dos protótipos em ../prototipos a partir de prototipo.html
// Uso: node gerar-imagens.mjs   (precisa do pacote playwright)
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(aqui, '..', 'prototipos');
const pagina = pathToFileURL(path.join(aqui, 'prototipo.html')).href;

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

export const TELAS = [
  ['01-menu', 'menu'],
  ['02-como-jogar', 'como-jogar'],
  ['03-nova-partida', 'nova-partida'],
  ['04-jogo-acerto', 'jogo'],
  ['05-jogo-erro', 'jogo-erro'],
  ['06-jogo-repetido', 'jogo-repetido'],
  ['07-jogo-combo', 'jogo-combo'],
  ['08-jogo-facil', 'jogo-facil'],
  ['09-jogo-ultimo-minuto', 'jogo-ultimo-minuto'],
  ['10-pausa', 'pausa'],
  ['11-confirmar-desistir', 'confirmar-desistir'],
  ['12-vitoria', 'vitoria'],
  ['13-derrota-tempo', 'derrota'],
  ['14-derrota-vidas', 'sem-vidas'],
  ['15-ranking', 'ranking'],
  ['16-conquistas', 'conquistas'],
  ['17-configuracoes', 'config'],
  ['18-multiplayer', 'multiplayer'],
];

const browser = await chromium.launch();
for (const [disp, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  for (const [arquivo, tela] of TELAS) {
    await page.goto(`${pagina}?tela=${tela}&disp=${disp}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(saida, disp, `${arquivo}.png`) });
  }
  await page.goto(`${pagina}?tela=jogo&disp=${disp}&tema=claro`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(saida, disp, '19-tema-claro.png') });
  await page.close();
}
await browser.close();
console.log('Imagens geradas em', saida);
