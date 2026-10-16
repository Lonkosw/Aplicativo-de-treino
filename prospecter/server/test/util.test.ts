import assert from "node:assert/strict";
import { test } from "node:test";
import { numeroAbreviado } from "../src/enriquecimento/instagram";
import { buscar, hostPublico } from "../src/util/rede";
import { linkWhatsapp, telefoneE164Br } from "../src/util/telefone";
import { chaveNome } from "../src/util/texto";
import { classificarUrl, usuarioInstagram } from "../src/util/url";

test("telefone brasileiro vira E.164 e só celular ganha WhatsApp", () => {
  assert.equal(telefoneE164Br("(47) 99999-8888"), "5547999998888");
  assert.equal(telefoneE164Br("+55 47 3433-1234"), "554734331234");
  assert.equal(telefoneE164Br("0 47 3433-1234"), "554734331234");
  assert.equal(telefoneE164Br("89201-000"), "", "CEP não é telefone");
  assert.equal(telefoneE164Br("(47) 89999-8888"), "", "11 dígitos sem o 9 não é válido");
  assert.equal(linkWhatsapp("5547999998888", "BR"), "https://wa.me/5547999998888");
  assert.equal(linkWhatsapp("554734331234", "BR"), "");
});

test("classifica site próprio, redes e agregadores", () => {
  const site = classificarUrl("www.padaria.com.br/contato");
  assert.equal(site.tipo, "site");
  assert.equal(site.tipo === "site" && site.dominio, "padaria.com.br");
  assert.deepEqual(classificarUrl("https://instagram.com/padaria").tipo, "rede");
  assert.equal(classificarUrl("https://linktr.ee/padaria").tipo, "agregador");
  assert.equal(classificarUrl("javascript:alert(1)").tipo, "invalida");
  const embrulhado = classificarUrl("https://www.google.com/url?q=https://padaria.com.br/&sa=U");
  assert.equal(embrulhado.tipo === "site" && embrulhado.dominio, "padaria.com.br", "desembrulha redirect do Google");
});

test("extrai usuário do Instagram e ignora posts", () => {
  assert.equal(usuarioInstagram("https://www.instagram.com/Padaria.Sol/?hl=pt"), "padaria.sol");
  assert.equal(usuarioInstagram("instagram.com/padaria_sol"), "padaria_sol");
  assert.equal(usuarioInstagram("https://instagram.com/p/Cx123/"), null);
  assert.equal(usuarioInstagram("https://facebook.com/padaria"), null);
});

test("números abreviados do Instagram", () => {
  assert.equal(numeroAbreviado("1,234"), 1234);
  assert.equal(numeroAbreviado("1.234"), 1234);
  assert.equal(numeroAbreviado("12K"), 12000);
  assert.equal(numeroAbreviado("1.2M"), 1_200_000);
  assert.equal(numeroAbreviado("98 mil"), 98000);
  assert.equal(numeroAbreviado("1,2 mi"), 1_200_000);
  assert.equal(numeroAbreviado("abc"), undefined);
});

test("chave de nome é escopada por país/estado/cidade", () => {
  assert.equal(chaveNome("BR", "SC", "Joinville", "  Auto  Center "), "br|sc|joinville|auto center");
  assert.notEqual(chaveNome("BR", "SC", "Joinville", "Auto Center"), chaveNome("BR", "SC", "Blumenau", "Auto Center"));
});

test("bloqueia endereços internos (SSRF)", async () => {
  assert.equal(await hostPublico("127.0.0.1"), false);
  assert.equal(await hostPublico("localhost"), false);
  assert.equal(await hostPublico("192.168.0.1"), false);
  assert.equal(await hostPublico("169.254.169.254"), false);
  assert.equal(await hostPublico("::1"), false);
  assert.equal(await hostPublico("8.8.8.8"), true);
  const r = await buscar("http://127.0.0.1:1/");
  assert.equal(r.ok, false);
  assert.match(r.erro ?? "", /não público/);
});
