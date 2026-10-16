import { criarApp } from "./app";
import { config } from "./config";
import { abrirBanco } from "./db/cliente";

const db = abrirBanco(config.dbCaminho);
const { app, enriquecedor } = criarApp(db, config);

async function main() {
  enriquecedor.iniciar();
  await app.listen({ port: config.porta, host: config.host });
  app.log.info(
    `Prospecter ouvindo em http://${config.host}:${config.porta} — Groq ${config.groqApiKey ? `ligada (${config.groqModelo})` : "desligada (só nota heurística)"}`,
  );
}

async function encerrar() {
  await app.close();
  await enriquecedor.parar();
  db.$client.close();
  process.exit(0);
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);

main().catch((e) => {
  app.log.error(e);
  process.exit(1);
});
