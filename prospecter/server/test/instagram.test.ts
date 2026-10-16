import assert from "node:assert/strict";
import { after, test } from "node:test";
import { analisarInstagram, lerApiPerfil, lerMetaPerfil } from "../src/enriquecimento/instagram";
import { html, redeLocal, servidorFalso } from "./ajudantes";

const meta = (d: string) => `<html><head><meta property="og:description" content="${d}"></head></html>`;

test("lê os contadores da meta em inglês e português", () => {
  const en = lerMetaPerfil(meta("1,234 Followers, 56 Following, 78 Posts - See Instagram photos and videos from Padaria Sol (@padariasol)"));
  assert.deepEqual(en, { seguidores: 1234, seguindo: 56, publicacoes: 78, nome: "Padaria Sol" });
  const pt = lerMetaPerfil(meta("2,3 mil seguidores, 80 seguindo, 1.050 publicações - Veja as fotos e vídeos do Instagram de Barbearia X (@barbx)"));
  assert.equal(pt?.seguidores, 2300);
  assert.equal(pt?.publicacoes, 1050);
  assert.equal(pt?.nome, "Barbearia X");
  assert.equal(lerMetaPerfil("<html><title>Login • Instagram</title></html>"), null);
});

test("lê o JSON público do perfil", () => {
  const p = lerApiPerfil(JSON.stringify({
    data: { user: {
      full_name: "Padaria Sol", biography: "Pães artesanais\nDelivery", external_url: null,
      is_business_account: true, category_name: "Padaria",
      edge_followed_by: { count: 2300 }, edge_follow: { count: 80 },
      edge_owner_to_timeline_media: { count: 410, edges: [{ node: { taken_at_timestamp: 1760000000 } }] },
    } },
  }));
  assert.equal(p?.seguidores, 2300);
  assert.equal(p?.bio, "Pães artesanais Delivery");
  assert.equal(p?.contaComercial, true);
  assert.equal(p?.ultimaPublicacao, "2025-10-09");
  assert.equal("linkExterno" in (p ?? {}), false);
});

const srv = await servidorFalso({
  "/padariasol/": html(meta("1,234 Followers, 56 Following, 78 Posts - See Instagram photos and videos from Padaria Sol (@padariasol)")),
  "/fechado/": (_q, res) => res.writeHead(302, { Location: "/accounts/login/" }).end(),
  "/accounts/login/": html("<html><title>Login</title></html>"),
  "/api/v1/users/web_profile_info/": (req, res) => {
    if (req.url?.includes("padariasol")) {
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({
        data: { user: { biography: "Pães", edge_followed_by: { count: 1300 }, edge_owner_to_timeline_media: { count: 80 } } },
      }));
    } else {
      res.writeHead(401, { "Content-Type": "application/json" }).end('{"require_login":true}');
    }
  },
});
after(() => srv.fechar());

test("perfil público: meta + API", async () => {
  const p = await analisarInstagram("padariasol", 1, redeLocal, srv.base, srv.base);
  assert.equal(p.status, "ok");
  assert.equal(p.fonte, "api_publica");
  assert.equal(p.seguidores, 1300, "a API é mais recente que a meta");
  assert.equal(p.nome, "Padaria Sol", "o nome veio da meta");
  assert.equal(p.bio, "Pães");
});

test("tela de login = bloqueado, sem dados inventados", async () => {
  const p = await analisarInstagram("fechado", 1, redeLocal, srv.base, srv.base);
  assert.equal(p.status, "bloqueado");
  assert.equal(p.seguidores, undefined);
});
