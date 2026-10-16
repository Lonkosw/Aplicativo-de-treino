// Roda o enriquecimento de um único site ou perfil, sem banco — útil para
// conferir o que o motor enxerga.
//   npm run diagnosticar -- https://padariaexemplo.com.br
//   npm run diagnosticar -- https://instagram.com/padariaexemplo
import { config } from "../config";
import { coletarLead } from "../enriquecimento/fila";
import { pontuar } from "../enriquecimento/pontuacao";

const alvo = process.argv[2];
if (!alvo) {
  console.error("uso: npm run diagnosticar -- <url do site ou do Instagram>");
  process.exit(1);
}

const c = await coletarLead({ site: alvo, redes: null }, config);
const p = pontuar({
  temSiteInformado: true,
  diagnostico: c.diagnostico,
  redes: c.redes,
  instagram: c.instagram,
  whatsapp: "https://wa.me/5500000000000",
  telefoneE164: "5500000000000",
  avaliacoes: 30,
});
console.log(JSON.stringify({ ...c, pontuacao: p }, null, 2));
