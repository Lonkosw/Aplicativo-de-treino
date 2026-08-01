# Treino

App de registro de treinos de musculação para Android, no estilo do Hevy.
Uso pessoal, instalado por APK fora da Play Store.

**Não existe servidor, conta, login ou nuvem.** Tudo roda offline, no
aparelho, em um banco SQLite local. A única proteção contra perda do
histórico é o backup em arquivo (aba Perfil).

---

## Rodando

```bash
npm install
npm start          # abre o Metro; leia o QR code com o Expo Go
```

O primeiro `npm start` cria o banco, roda as migrations e importa os 873
exercícios do seed. Isso leva alguns segundos só na primeira abertura.

```bash
npm run typecheck  # TypeScript, app + scripts
npm run verificar  # roda as consultas contra um SQLite real (ver abaixo)
```

### Gerando o APK

O build acontece nos servidores do EAS; você só precisa de uma conta Expo
gratuita.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

O perfil `preview` (em `eas.json`) gera um **APK** de distribuição interna,
que é o que dá para instalar direto no aparelho. O `production` gera um
`.aab`, que só serve para a Play Store.

Ao final o EAS devolve um link de download. Baixe no celular e instale
(vai pedir para autorizar "instalar apps de fontes desconhecidas").

Também existe `npm run build:apk`, que é atalho para o mesmo comando.

---

## Estrutura de pastas

```
app.json                 configuração do app (nome, ícones, plugins)
eas.json                 perfis de build do EAS
drizzle.config.ts        configuração do gerador de migrations
tailwind.config.js       cores e tipografia do tema
metro.config.js          bundler: NativeWind, .sql e alias de gradiente
babel.config.js          preset do NativeWind e inline-import de .sql

assets/
  seed-exercicios.json   base de exercícios embarcada no APK
  icone*.png splash.png  gerados por scripts/gerar-icones.py

drizzle/                 migrations SQL geradas (não edite à mão)

scripts/
  gerar-seed.ts          baixa e traduz o free-exercise-db
  gerar-icones.py        desenha os ícones e a splash
  verificacao/           harness que roda as consultas no Node

src/
  app/                   ROTAS (uma tela = um arquivo)
  components/            componentes de tela
    ui/                  botões, campos, modais, menus
    treino/              componentes da tela de treino ativo
  constants/tema.ts      cores em JS (para libs que não usam className)
  db/
    schema.ts            tabelas Drizzle
    client.ts            conexão SQLite
    provider.tsx         roda migrations e seed antes de renderizar
    seed.ts              importação inicial dos exercícios
    consultas/           todas as consultas, por assunto
  lib/                   cálculos, formatação, backup, notificações
  store/treino-ativo.ts  estado efêmero do treino (Zustand)
```

### Onde ficam as rotas

O Expo Router usa **roteamento por arquivo**: o caminho do arquivo dentro
de `src/app` é a URL da tela. Não existe arquivo de rotas para editar.

```
src/app/_layout.tsx                 raiz: providers e a pilha de navegação
src/app/(abas)/_layout.tsx          as 4 abas de baixo
src/app/(abas)/index.tsx            aba Início            -> /
src/app/(abas)/rotinas.tsx          aba Rotinas           -> /rotinas
src/app/(abas)/exercicios.tsx       aba Exercícios        -> /exercicios
src/app/(abas)/perfil.tsx           aba Perfil            -> /perfil
src/app/treino/ativo.tsx            treino em andamento   -> /treino/ativo
src/app/treino/resumo.tsx           resumo pós-treino     -> /treino/resumo
src/app/treino/[id].tsx             treino do histórico   -> /treino/12
src/app/rotina/[id].tsx             editor de rotina      -> /rotina/3
src/app/exercicio/[id].tsx          detalhe do exercício  -> /exercicio/7
src/app/exercicio/novo.tsx          criar exercício       -> /exercicio/novo
src/app/selecionar-exercicios.tsx   busca para adicionar  -> /selecionar-exercicios
src/app/historico.tsx               histórico completo    -> /historico
```

Parênteses no nome da pasta (`(abas)`) criam um **grupo**: organizam os
arquivos sem virar segmento de URL. Colchetes (`[id]`) criam um segmento
dinâmico, lido com `useLocalSearchParams`.

### Como adicionar uma tela nova

1. **Crie o arquivo** em `src/app/`. O nome vira a rota.

   ```tsx
   // src/app/medidas.tsx  ->  /medidas
   import { Tela, TituloTela } from '@/components/ui/tela';
   import { CabecalhoPilha } from '@/components/cabecalho-pilha';

   export default function TelaMedidas() {
     return (
       <Tela>
         <CabecalhoPilha titulo="Medidas" />
         {/* ... */}
       </Tela>
     );
   }
   ```

   O componente precisa ser `export default` — é ele que o router monta.

2. **Navegue até ela** de qualquer lugar:

   ```tsx
   const router = useRouter();
   router.push('/medidas');
   ```

   Os caminhos são tipados: se você errar o nome, o TypeScript reclama.
   Rode `npm start` uma vez depois de criar o arquivo para os tipos serem
   regerados.

3. **Se for uma aba**, crie dentro de `src/app/(abas)/` e adicione um
   `<Tabs.Screen name="medidas" ... />` em `src/app/(abas)/_layout.tsx`.
   Fora disso, a tela entra na pilha automaticamente, com animação da
   direita — para mudar a animação, declare um `<Stack.Screen>` em
   `src/app/_layout.tsx`.

4. **Para ler dados**, use `useLiveQuery` com uma função de `src/db/consultas`:

   ```tsx
   const { data } = useLiveQuery(queryRotinas());
   ```

   `useLiveQuery` reexecuta a consulta sozinho quando as tabelas envolvidas
   mudam. Não existe cache para invalidar.

### Como mudar o banco

1. Edite `src/db/schema.ts`.
2. `npm run db:generate` — cria um novo `.sql` em `drizzle/`.
3. Reabra o app. As migrations rodam sozinhas na inicialização
   (`src/db/provider.tsx`).

Nunca edite um `.sql` já gerado: ele pode já ter rodado no aparelho.

---

## Coisas de React Native que não têm equivalente na web

Anotadas nos comentários do código, mas em resumo:

| Assunto | O que muda |
| --- | --- |
| **Estilo** | `className` funciona por causa do NativeWind, que compila o Tailwind em tempo de build. Não há CSSOM, cascata nem seletores — `className` vira um objeto de estilo. Cores usadas por bibliotecas (gráficos, abas) precisam vir de `constants/tema.ts`, em JS. |
| **Bundler** | O Metro resolve imports em tempo de build. Um `require()` dentro de `try/catch` não protege nada: se o módulo não existe, o bundle quebra. Por isso o alias de `react-native-linear-gradient` em `metro.config.js`. |
| **Arquivos** | Não existe filesystem do projeto em runtime. As migrations `.sql` e o `seed-exercicios.json` são embutidos no bundle JS (plugin `inline-import` e import estático). |
| **Banco** | O SQLite fica no sandbox do app e sobrevive ao fechamento. `PRAGMA foreign_keys` precisa ser ligado a cada conexão. As transações do driver expo-sqlite são **síncronas**: a callback não pode ser `async`, senão o `commit` sai antes das escritas. |
| **Tempo** | O Android congela `setInterval` em segundo plano. Cronômetro e timer de descanso guardam **timestamps absolutos** e recalculam ao voltar (`AppState`), em vez de acumular ticks. |
| **Timer** | Um `setTimeout` não sobrevive ao app ser fechado. O fim do descanso é uma **notificação local agendada no sistema** (`expo-notifications`). |
| **Teclado** | O teclado numérico do Android varia por fabricante e cobre a tela. A tela de treino usa um teclado próprio (`components/treino/teclado-numerico.tsx`) com teclas de 54dp e ações do domínio (±2,5 kg, concluir série). |
| **Diálogos** | `Alert.alert` no Android é um AlertDialog nativo e mostra **no máximo 3 botões** — os demais somem em silêncio. Menus maiores usam `components/ui/menu-opcoes.tsx`. `Alert.prompt` só existe no iOS; entrada de texto usa `components/ui/modal-texto.tsx`. |
| **Layout** | A tela tem recortes (barra de status, barra de gestos). `SafeAreaView` e `useSafeAreaInsets` do `react-native-safe-area-context` resolvem isso. |
| **Listas** | `FlatList` recicla as linhas. Listas longas (873 exercícios) precisam de `keyExtractor`, `getItemLayout` e componentes memoizados. |
| **Voltar** | O botão físico de voltar do Android é interceptável com `BackHandler` — é o que impede voltar para um treino já finalizado. |

---

## Verificação

```bash
npm run verificar
```

Roda as **consultas reais** de `src/db/consultas` contra um SQLite em
memória (`node:sqlite`), aplicando as migrations de verdade. Cobre volume,
recordes, referência do treino anterior, agregações, reordenação, backup e
rollback de transação.

Isso não substitui abrir o app, mas pega a classe de bug que passa
despercebida na tela: SQL errado, soma inflada por join e transação que não
cobre o que deveria. Foi assim que dois bugs reais apareceram — a perda do
prefixo de tabela em subconsultas correlacionadas e o commit prematuro em
transações com callback `async`.

Os stubs em `scripts/verificacao/` existem só para os módulos nativos do
Expo rodarem no Node; o código de produção não sabe que eles existem.

---

## Atualizando a base de exercícios

```bash
npm run seed:gerar
```

Baixa o [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
(domínio público), traduz grupos musculares, equipamentos e categorias, e
regrava `assets/seed-exercicios.json`. Os nomes traduzidos ficam num
dicionário fixo no topo de `scripts/gerar-seed.ts` — para traduzir mais
exercícios, é só acrescentar entradas lá.

O app só usa esse arquivo quando a tabela `exercicios` está vazia. Se você
já tem histórico, regerar o seed não muda nada no aparelho.

## Ícones

```bash
pip install pillow
python3 scripts/gerar-icones.py
```

Redesenha `assets/icone.png`, o ícone adaptativo, a versão monocromática e
a splash a partir das constantes no próprio script.
