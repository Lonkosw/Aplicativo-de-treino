# Prospecter — motor de busca de leads

Motor de prospecção B2B em duas partes:

```
extension/  (Chrome)                     server/  (Node + TypeScript)
┌──────────────────────────┐   POST     ┌──────────────────────────────────────────────┐
│ varre o Google Maps      │ /leads/lote│ dedup global (placeId › telefone › nome ›     │
│ (cobertura por pontos,   │ ─────────▶ │ domínio) e histórico de campanhas            │
│ filtro de raio, dedup)   │            │                                              │
│ fila persistida: backend │            │ fila de enriquecimento                        │
│ fora do ar não perde nada│            │  1. site: e-mails, WhatsApp, redes, páginas   │
└──────────────────────────┘            │     de contato, diagnóstico (HTTPS, mobile,   │
                                        │     plataforma, Pixel, Analytics, ©ano)       │
                                        │  2. Instagram público: seguidores, bio,       │
                                        │     último post (sem login)                   │
                                        │  3. nota heurística 0–100 + presença digital  │
                                        │  4. Groq: relevância, nota, dores e mensagem  │
                                        │     de WhatsApp                               │
                                        │ SQLite (Drizzle) · API · CSV                  │
                                        └──────────────────────────────────────────────┘
```

A extensão é um fork do [apex-gmaps-extractor](https://github.com/severoads3/apex-gmaps-extractor)
(MIT, © 2026 severoads3 — licença original em `extension/LICENSE`), commit `18f19c2`.

Feito para quem vende **sites, sistemas e SaaS**: o lead mais quente é o negócio ativo com
presença digital fraca — principalmente o que **só tem Instagram**.

## Como rodar

### 1. Backend

```bash
cd prospecter/server
npm install
cp .env.example .env      # coloque a GROQ_API_KEY (opcional) e ajuste OFERTA
npm start                 # http://127.0.0.1:3737
```

Sem `GROQ_API_KEY` tudo funciona, só sem a análise da IA (fica a nota heurística).

### 2. Extensão

1. `chrome://extensions` → ative o **Modo do desenvolvedor** → **Carregar sem compactação** →
   selecione `prospecter/extension`.
2. Nas **Opções** da extensão, preencha **Endereço do backend** com `http://127.0.0.1:3737`
   (e o token, se definiu `API_TOKEN` no `.env`).
3. Use normalmente: cada cidade varrida manda os leads para o backend, que enriquece em segundo plano.

### 3. Ver os resultados

| O quê | Endereço |
|---|---|
| Situação da fila | `GET /saude` |
| Leads ordenados pela nota | `GET /leads?minScore=60&presenca=so_instagram,site_fraco` |
| Um lead completo | `GET /leads/:id` |
| CSV pronto para o WhatsApp | `GET /exportar.csv?minScore=60` |
| Reenriquecer | `POST /leads/reenriquecer` `{"ids":[1,2,3]}` |

Filtros de `/leads` e `/exportar.csv`: `status`, `presenca`, `relevancia`, `minScore`, `cidade`,
`campanha`, `q`, `incluirIrrelevantes=1`, `limite`, `offset`. Por padrão os leads que a IA marcou
como fora do nicho ficam escondidos — **eles nunca são apagados**.

Para ver o que o motor enxerga num site ou perfil, sem banco:

```bash
npm run diagnosticar -- https://padariaexemplo.com.br
npm run diagnosticar -- https://instagram.com/padariaexemplo
```

## Presença digital e nota

| `presenca` | Quando | Nota base |
|---|---|---|
| `so_instagram` | sem site, com Instagram | 80 |
| `site_fora_do_ar` | site informado não responde | 78 |
| `so_rede_social` | sem site, com Facebook/TikTok/etc. | 72 |
| `sem_presenca` | nada encontrado | 65 |
| `site_fraco` | 2+ problemas (sem HTTPS, sem mobile, © antigo, lento, sem contato…) | 25 + 10/problema |
| `site_ok` | site razoável | 25 + … |

Ajustes: +8 com 100+ avaliações, +5 com Instagram de 1.000+ seguidores, −5 com Instagram parado
há 4+ meses, −5 sem celular (só fixo), −15 sem telefone. Quando a Groq está ligada, a nota da IA
(`scoreIa`) substitui a heurística na ordenação; a IA recebe todos os sinais acima e só pode citar
fatos que estão nos dados.

## Instagram

O motor lê a página **pública** do perfil, sem login, com no máximo uma requisição a cada
`INSTAGRAM_INTERVALO_MS` (padrão 5 s). Rodando na sua máquina (IP residencial) costuma funcionar;
de servidores em nuvem o Instagram quase sempre mostra a tela de login. Nesses casos o perfil fica
com `status: "bloqueado"` e a IA é avisada para não presumir nada sobre ele.

## Segurança

- O backend escuta só em `127.0.0.1` por padrão e recusa pedidos vindos de sites abertos no
  navegador (só aceita a extensão e `localhost`).
- O crawler não acessa endereços internos (127.0.0.1, 192.168.x.x, metadados de nuvem…), tem
  timeout, limite de tamanho e segue redirecionamentos um a um.
- Textos de terceiros (nome do negócio, bio, título do site) vão para a IA **como dados num JSON
  separado das instruções**, limpos e truncados.
- O CSV escapa valores que começam com `=`, `+`, `-`, `@` (injeção de fórmula no Excel).

## O que mudou na extensão em relação ao apex

- **A IA não apaga mais leads.** Os "fora do nicho" são marcados (`Relevancia = nao`) e vão para o
  fim do CSV. No original eles eram removidos do armazenamento para sempre.
- **Groq com retry**: 429 (limite) e 5xx esperam e repetem, em vez de pular o lote em silêncio.
- **Prompt injection**: os dados dos leads vão num JSON separado das instruções.
- **Telefone fora do Brasil**: a extração aceitava só o formato brasileiro; agora há um formato
  internacional de reserva (o número continua validado pelos tamanhos do país).
- **Envio ao backend** com fila persistida (`backendFila`) e reenvio pelo watchdog.
- Com backend configurado, a IA roda no backend (que vê site e Instagram) e não na extensão.
- Testes novos: T23–T25 em `tests/harness-background.js` e casos internacionais em
  `tests/harness-content.js`.

## Desenvolvimento

```bash
cd prospecter/server && npm test && npm run typecheck
cd prospecter/extension && npm test
```

Mudou o schema (`server/src/db/schema.ts`)? Rode `npm run db:generate` e commite a migração em
`server/drizzle/`; ela é aplicada sozinha quando o servidor sobe.

## Próximos passos

- Painel (lista, filtros, marcar como contatado, abrir conversa no WhatsApp).
- Trocar SQLite por Postgres quando virar produto (o Drizzle já está no meio — é trocar o driver).
- Opt-out / exclusão a pedido (LGPD) — combinado para depois.
- Repositório próprio para o prospecter.
