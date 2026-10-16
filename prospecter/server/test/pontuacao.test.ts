import assert from "node:assert/strict";
import { test } from "node:test";
import { pontuar } from "../src/enriquecimento/pontuacao";
import type { DiagnosticoSite } from "../src/enriquecimento/tipos";

const siteBom: DiagnosticoSite = {
  urlFinal: "https://x.com.br/", online: true, https: true, responsivo: true, temDescricao: true,
  metaPixel: true, googleAnalytics: true, googleAds: false, formularioContato: true, botaoWhatsapp: true,
  anoCopyright: 2026, paginasLidas: [], tempoRespostaMs: 300,
};
const zap = { whatsapp: "https://wa.me/5547999998888", telefoneE164: "5547999998888", avaliacoes: 40, anoAtual: 2026 };

test("só Instagram é o lead mais quente", () => {
  const soIg = pontuar({ ...zap, temSiteInformado: true, redes: { instagram: "https://www.instagram.com/x/" } });
  const comSite = pontuar({ ...zap, temSiteInformado: true, diagnostico: siteBom });
  assert.equal(soIg.presenca, "so_instagram");
  assert.equal(comSite.presenca, "site_ok");
  assert.ok(soIg.score > comSite.score + 30, `${soIg.score} vs ${comSite.score}`);
});

test("site ruim pontua mais que site bom e lista os problemas", () => {
  const ruim = pontuar({
    ...zap, temSiteInformado: true,
    diagnostico: { ...siteBom, https: false, responsivo: false, anoCopyright: 2019, metaPixel: false, googleAnalytics: false },
  });
  assert.equal(ruim.presenca, "site_fraco");
  assert.ok(ruim.sinais.includes("site sem HTTPS"));
  assert.ok(ruim.sinais.some((s) => s.includes("2019")));
  assert.ok(ruim.score > pontuar({ ...zap, temSiteInformado: true, diagnostico: siteBom }).score);
});

test("site fora do ar e falta de WhatsApp", () => {
  const fora = pontuar({ ...zap, temSiteInformado: true, diagnostico: { ...siteBom, online: false, erro: "ENOTFOUND" } });
  assert.equal(fora.presenca, "site_fora_do_ar");
  const semFone = pontuar({ temSiteInformado: false, avaliacoes: 40 });
  assert.equal(semFone.presenca, "sem_presenca");
  assert.ok(semFone.sinais.includes("sem telefone"));
  assert.ok(semFone.score < pontuar({ ...zap, temSiteInformado: false }).score);
});
