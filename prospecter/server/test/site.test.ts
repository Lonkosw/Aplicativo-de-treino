import assert from "node:assert/strict";
import { after, test } from "node:test";
import { analisarSite, diagnosticarHtml, extrairDaPagina } from "../src/enriquecimento/site";
import { buscar } from "../src/util/rede";
import { html, redeLocal, servidorFalso } from "./ajudantes";

const HOME = `<!doctype html><html><head>
<title>Padaria Sol — pães artesanais</title>
<meta name="generator" content="WordPress 6.5">
<link rel="stylesheet" href="/wp-content/themes/x/style.css">
</head><body>
<a href="/contato">Fale conosco</a>
<a href="https://www.instagram.com/padariasol/">Instagram</a>
<a href="https://www.facebook.com/sharer.php?u=x">Compartilhar</a>
<a href="https://facebook.com/padariasol">Facebook</a>
<a href="https://wa.me/5547999998888">WhatsApp</a>
<a href="mailto:contato@padariasol.com.br?subject=oi">e-mail</a>
<img src="logo@2x.png">
<footer>© 2019 Padaria Sol. Escreva para vendas@padariasol.com.br</footer>
<script>var x = "nao@deve.aparecer";</script>
</body></html>`;

const CONTATO = `<html><head><meta name="viewport" content="width=device-width"></head><body>
<form><input type="email" name="email"><textarea></textarea></form>
<p>financeiro@padariasol.com.br</p></body></html>`;

test("extrai e-mails, redes e páginas de contato", () => {
  const r = extrairDaPagina(HOME, "https://padariasol.com.br/");
  assert.deepEqual([...r.emails].sort(), ["contato@padariasol.com.br", "vendas@padariasol.com.br"]);
  assert.equal(r.redes.instagram, "https://www.instagram.com/padariasol/");
  assert.equal(r.redes.facebook, "https://facebook.com/padariasol", "ignora o link de compartilhar");
  assert.deepEqual(r.redes.whatsapp, ["https://wa.me/5547999998888"]);
  assert.deepEqual(r.linksContato, ["https://padariasol.com.br/contato"]);
});

test("diagnóstico do HTML", () => {
  const d = diagnosticarHtml(HOME, "http://padariasol.com.br/");
  assert.equal(d.plataforma, "WordPress");
  assert.equal(d.https, false);
  assert.equal(d.responsivo, false);
  assert.equal(d.anoCopyright, 2019);
  assert.equal(d.botaoWhatsapp, true);
  assert.equal(d.metaPixel, false);
  const comPixel = diagnosticarHtml(`<script>fbq('init', '123');gtag('config', 'G-ABC');</script>`, "https://x.com.br/");
  assert.equal(comPixel.metaPixel, true);
  assert.equal(comPixel.googleAnalytics, true);
});

const srv = await servidorFalso({
  "/": html(HOME.replace('href="/contato"', 'href="/contato"')),
  "/contato": html(CONTATO),
  "/redireciona": (_q, res) => res.writeHead(301, { Location: "/" }).end(),
  "/pdf": html("%PDF", "application/pdf"),
  "/lento": (_q, res) => setTimeout(() => res.writeHead(200).end("ok"), 2000),
});
after(() => srv.fechar());

test("analisa o site seguindo redirecionamento e lendo a página de contato", async () => {
  const r = await analisarSite(`${srv.base}/redireciona`, redeLocal);
  assert.equal(r.diagnostico.online, true);
  assert.equal(r.diagnostico.urlFinal, `${srv.base}/`);
  assert.equal(r.diagnostico.formularioContato, true, "formulário veio da página de contato");
  assert.ok(r.emails.includes("financeiro@padariasol.com.br"));
  assert.equal(r.diagnostico.paginasLidas.length, 2);
});

test("site fora do ar e conteúdo não HTML", async () => {
  const r = await analisarSite(`${srv.base}/nao-existe`, redeLocal);
  assert.equal(r.diagnostico.online, false);
  assert.equal(r.diagnostico.statusHttp, 404);
  const pdf = await buscar(`${srv.base}/pdf`, {}, redeLocal);
  assert.equal(pdf.ok, false);
  const lento = await buscar(`${srv.base}/lento`, { timeoutMs: 300 }, redeLocal);
  assert.equal(lento.erro, "tempo esgotado");
});
