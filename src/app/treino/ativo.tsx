import { Ionicons } from '@expo/vector-icons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { BarraDescanso } from '@/components/treino/barra-descanso';
import { CartaoExercicioTreino } from '@/components/treino/cartao-exercicio';
import { CronometroTreino } from '@/components/treino/cronometro-treino';
import { NOME_TIPO, type SerieDaTela } from '@/components/treino/linha-serie';
import { TecladoNumerico } from '@/components/treino/teclado-numerico';
import { EstadoVazio } from '@/components/ui/basicos';
import { Botao, BotaoIcone } from '@/components/ui/botao';
import { MenuOpcoes, type Opcao } from '@/components/ui/menu-opcoes';
import { ModalTexto } from '@/components/ui/modal-texto';
import { Tela } from '@/components/ui/tela';
import { ALVO_TOQUE, cores } from '@/constants/tema';
import { recordesDoExercicio, seriesDoTreinoAnterior } from '@/db/consultas/exercicios';
import {
  adicionarSerie,
  atualizarNotasDoExercicio,
  atualizarNotasDoTreino,
  atualizarSerie,
  descartarTreino,
  finalizarTreino,
  obterSerie,
  queryItensDoTreino,
  querySeriesDoTreino,
  queryTreinoAtivo,
  removerExercicioDoTreino,
  removerSerie,
  renomearTreino,
  reordenarExerciciosDoTreino,
  type ItemTreino,
} from '@/db/consultas/treinos';
import type { TipoSerie } from '@/db/schema';
import { type Recordes } from '@/lib/calculos';
import * as fmt from '@/lib/formato';
import { usarTreinoAtivo, type PosicaoFoco } from '@/store/treino-ativo';

type Referencias = Record<number, { peso: number; repeticoes: number }[]>;

const TIPOS_SERIE: TipoSerie[] = ['normal', 'aquecimento', 'falha', 'dropset'];

const ICONE_TIPO: Record<TipoSerie, ComponentProps<typeof Ionicons>['name']> = {
  normal: 'ellipse-outline',
  aquecimento: 'flame-outline',
  falha: 'flash-outline',
  dropset: 'trending-down-outline',
};

export default function TelaTreinoAtivo() {
  const router = useRouter();
  // A tela do treino não pode apagar no meio da série. Só esta tela usa.
  useKeepAwake();

  const { data: treinos } = useLiveQuery(queryTreinoAtivo());
  const treino = treinos?.[0] ?? null;
  const treinoId = treino?.id ?? 0;

  const { data: itens } = useLiveQuery(queryItensDoTreino(treinoId), [treinoId]);
  const { data: todasSeries } = useLiveQuery(querySeriesDoTreino(treinoId), [treinoId]);

  const [referencias, setReferencias] = useState<Referencias>({});
  const [itemEmNotas, setItemEmNotas] = useState<ItemTreino | null>(null);
  const [renomeando, setRenomeando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [menuSerie, setMenuSerie] = useState<{ item: ItemTreino; serie: SerieDaTela } | null>(null);
  const [menuExercicio, setMenuExercicio] = useState<ItemTreino | null>(null);
  const [menuTreino, setMenuTreino] = useState(false);
  const [editandoNotas, setEditandoNotas] = useState(false);

  const refRolagem = useRef<ScrollView>(null);
  const deslocamento = useRef(0);
  const alturaTeclado = useRef(0);
  const { height: alturaJanela } = useWindowDimensions();

  /**
   * Rola o suficiente para a linha focada ficar acima do teclado. Sem isso,
   * tocar no peso de uma série da metade de baixo abre o teclado bem em
   * cima do campo que você quer editar.
   */
  const garantirVisivel = useCallback(
    (yNaJanela: number, altura: number) => {
      const limite = alturaJanela - alturaTeclado.current - 8;
      const excesso = yNaJanela + altura - limite;
      if (excesso > 0) {
        refRolagem.current?.scrollTo({ y: deslocamento.current + excesso + 12, animated: true });
      }
    },
    [alturaJanela],
  );

  const definirSequencia = usarTreinoAtivo((s) => s.definirSequencia);
  const definirBase = usarTreinoAtivo((s) => s.definirBase);
  const registrarConclusao = usarTreinoAtivo((s) => s.registrarConclusao);
  const limparConclusao = usarTreinoAtivo((s) => s.limparConclusao);
  const recordesDaSessao = usarTreinoAtivo((s) => s.recordesDaSessao);
  const iniciarDescanso = usarTreinoAtivo((s) => s.iniciarDescanso);
  const desfocar = usarTreinoAtivo((s) => s.desfocar);
  const limparSessao = usarTreinoAtivo((s) => s.limparSessao);

  const listaItens = useMemo(() => itens ?? [], [itens]);

  const seriesPorExercicio = useMemo(() => {
    const mapa: Record<number, SerieDaTela[]> = {};
    for (const s of todasSeries ?? []) {
      (mapa[s.treinoExercicioId] ??= []).push(s);
    }
    return mapa;
  }, [todasSeries]);

  /**
   * Carrega, para cada exercício do treino, as séries do treino anterior
   * (os valores cinza de referência) e os recordes do histórico. São
   * consultas pesadas demais para rodar a cada render, então ficam fora do
   * `useLiveQuery` e só reexecutam quando a lista de exercícios muda.
   */
  const assinaturaItens = listaItens.map((i) => i.exercicioId).join(',');
  useEffect(() => {
    if (!treinoId || !listaItens.length) return;
    let ativo = true;
    (async () => {
      const refs: Referencias = {};
      const base: Record<number, Recordes> = {};
      for (const item of listaItens) {
        const [anterior, recordes] = await Promise.all([
          seriesDoTreinoAnterior(item.exercicioId, treinoId),
          recordesDoExercicio(item.exercicioId, treinoId),
        ]);
        refs[item.exercicioId] = anterior.series.map((s) => ({
          peso: s.peso,
          repeticoes: s.repeticoes,
        }));
        base[item.exercicioId] = recordes;
      }
      if (!ativo) return;
      setReferencias(refs);
      definirBase(base);
    })();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treinoId, assinaturaItens, definirBase]);

  /** Ordem dos campos usada pelo botão "próximo" do teclado. */
  useEffect(() => {
    const sequencia: PosicaoFoco[] = [];
    for (const item of listaItens) {
      for (const serie of seriesPorExercicio[item.id] ?? []) {
        sequencia.push({ serieId: serie.id, campo: 'peso' });
        sequencia.push({ serieId: serie.id, campo: 'repeticoes' });
      }
    }
    definirSequencia(sequencia);
  }, [listaItens, seriesPorExercicio, definirSequencia]);

  // Fecha o teclado ao sair da tela para ele não reaparecer na volta.
  useFocusEffect(useCallback(() => () => desfocar(), [desfocar]));

  const jaRedirecionou = useRef(false);
  useEffect(() => {
    // `treinos` undefined = consulta ainda rodando; array vazio = não há
    // treino ativo (finalizado ou descartado em outra tela).
    if (treinos && treinos.length === 0 && !jaRedirecionou.current) {
      jaRedirecionou.current = true;
      router.replace('/');
    }
  }, [treinos, router]);

  // -- ações ---------------------------------------------------------------

  async function concluirSerie(item: ItemTreino, serieId: number) {
    // Lê do banco em vez de usar o objeto do render: o teclado grava a cada
    // dígito e o último pode ainda não ter chegado nas props.
    const atual = await obterSerie(serieId);
    if (!atual) return;

    const marcando = !atual.concluida;
    await atualizarSerie(serieId, { concluida: marcando });

    if (!marcando) {
      limparConclusao(serieId);
      return;
    }

    registrarConclusao({
      serieId,
      exercicioId: item.exercicioId,
      peso: atual.peso,
      repeticoes: atual.repeticoes,
      tipo: atual.tipo,
    });
    desfocar();
    if (item.descansoSegundos > 0) {
      await iniciarDescanso(item.descansoSegundos, item.nome);
    }
  }

  const opcoesSerie: Opcao[] = menuSerie
    ? [
        ...TIPOS_SERIE.map((t) => ({
          rotulo: NOME_TIPO[t],
          icone: ICONE_TIPO[t],
          marcada: menuSerie.serie.tipo === t,
          aoTocar: () => void atualizarSerie(menuSerie.serie.id, { tipo: t }),
        })),
        {
          rotulo: 'Remover série',
          icone: 'trash-outline' as const,
          destrutiva: true,
          aoTocar: () => void removerSerie(menuSerie.serie.id),
        },
      ]
    : [];

  /** Troca de posição com o vizinho e grava a ordem inteira. */
  function moverExercicio(item: ItemTreino, direcao: -1 | 1) {
    const atual = listaItens.findIndex((i) => i.id === item.id);
    const destino = atual + direcao;
    if (atual < 0 || destino < 0 || destino >= listaItens.length) return;
    const nova = [...listaItens];
    [nova[atual], nova[destino]] = [nova[destino], nova[atual]];
    reordenarExerciciosDoTreino(nova.map((i) => i.id));
  }

  const opcoesExercicio: Opcao[] = menuExercicio
    ? [
        {
          rotulo: 'Notas do exercício',
          icone: 'document-text-outline',
          aoTocar: () => setItemEmNotas(menuExercicio),
        },
        ...(listaItens.findIndex((i) => i.id === menuExercicio.id) > 0
          ? [
              {
                rotulo: 'Mover para cima',
                icone: 'arrow-up-outline' as const,
                aoTocar: () => moverExercicio(menuExercicio, -1),
              },
            ]
          : []),
        ...(listaItens.findIndex((i) => i.id === menuExercicio.id) < listaItens.length - 1
          ? [
              {
                rotulo: 'Mover para baixo',
                icone: 'arrow-down-outline' as const,
                aoTocar: () => moverExercicio(menuExercicio, 1),
              },
            ]
          : []),
        {
          rotulo: 'Ver histórico e recordes',
          icone: 'stats-chart-outline',
          aoTocar: () => router.push(`/exercicio/${menuExercicio.exercicioId}`),
        },
        {
          rotulo: 'Remover do treino',
          icone: 'trash-outline',
          destrutiva: true,
          aoTocar: () => void removerExercicioDoTreino(menuExercicio.id),
        },
      ]
    : [];

  function confirmarFinalizar() {
    if (!treino) return;
    const concluidas = (todasSeries ?? []).filter((s) => s.concluida).length;
    if (concluidas === 0) {
      Alert.alert(
        'Nenhuma série concluída',
        'Marque ao menos uma série para salvar este treino, ou descarte-o.',
      );
      return;
    }
    const horas = (Date.now() - treino.iniciadoEm.getTime()) / 3_600_000;
    // Esquecer de finalizar é o erro mais comum: o cronômetro conta desde
    // que o treino começou, então no dia seguinte ele marcaria 20 horas e
    // isso entraria no histórico como tempo de treino.
    const aviso =
      horas > 4
        ? `\n\nAtenção: este treino está aberto há ${fmt.duracaoCurta(horas * 3600)}. Se você esqueceu de finalizar, a duração vai entrar torta no histórico — dá para corrigir depois no detalhe do treino.`
        : '';

    Alert.alert(
      'Finalizar treino',
      `${fmt.plural(concluidas, 'série concluída', 'séries concluídas')}.${aviso}`,
      [
        { text: 'Continuar treinando', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            setFinalizando(true);
            desfocar();
            // Assume a navegação antes de finalizar: senão o efeito que
            // observa "não há treino ativo" dispararia primeiro e mandaria
            // para a home, engolindo a tela de resumo.
            jaRedirecionou.current = true;
            await finalizarTreino(treino.id);
            router.replace(`/treino/resumo?id=${treino.id}`);
          },
        },
      ],
    );
  }

  function confirmarDescartar() {
    if (!treino) return;
    Alert.alert('Descartar treino', 'Tudo o que foi registrado neste treino será perdido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: async () => {
          jaRedirecionou.current = true;
          limparSessao();
          await descartarTreino(treino.id);
          router.replace('/');
        },
      },
    ]);
  }

  // -- render --------------------------------------------------------------

  if (!treino) return <Tela />;

  return (
    <Tela>
      {/* Cabeçalho */}
      <View className="flex-row items-center gap-2 border-b border-borda px-2 pb-2 pt-1">
        <BotaoIcone
          icone="chevron-down"
          acessibilidade="Minimizar treino, continua em andamento"
          tamanho={26}
          // `back()` e não `replace('/')`: minimizar tem que devolver para
          // a tela de onde o treino foi iniciado (Rotinas, por exemplo), e
          // `replace` destruiria a pilha.
          aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <Pressable
          onPress={() => setMenuTreino(true)}
          accessibilityRole="button"
          accessibilityLabel={`${treino.nome}. Toque para renomear ou anotar.`}
          style={{ minHeight: ALVO_TOQUE }}
          className="flex-1 flex-row items-center gap-1 rounded-lg px-1 active:bg-superficie2">
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-texto" numberOfLines={1}>
              {treino.nome}
            </Text>
            <CronometroTreino iniciadoEm={treino.iniciadoEm} />
          </View>
          {/* Sem este chevron o título não se lê como tocável. */}
          <Ionicons name="chevron-down" size={14} color={cores.texto3} />
        </Pressable>
        <Pressable
          onPress={confirmarFinalizar}
          disabled={finalizando}
          accessibilityRole="button"
          accessibilityLabel="Finalizar treino"
          style={{ minHeight: ALVO_TOQUE }}
          className="justify-center rounded-xl bg-destaque px-4 active:bg-destaqueEscuro">
          <Text className="text-[15px] font-bold text-white">Finalizar</Text>
        </Pressable>
      </View>

      <BarraDescanso />

      <ScrollView
        ref={refRolagem}
        onScroll={(e) => {
          deslocamento.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        // Padding extra embaixo: com edge-to-edge a lista vai até a borda da
        // tela, e o último botão precisa ficar acima da barra de gestos.
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled">
        {listaItens.length === 0 ? (
          <EstadoVazio
            icone="barbell"
            titulo="Treino vazio"
            descricao="Adicione o primeiro exercício para começar a registrar."
          />
        ) : (
          listaItens.map((item) => (
            <CartaoExercicioTreino
              key={item.id}
              item={item}
              series={seriesPorExercicio[item.id] ?? []}
              referencias={referencias[item.exercicioId] ?? []}
              recordesPorSerie={recordesDaSessao}
              aoAbrirExercicio={() => router.push(`/exercicio/${item.exercicioId}`)}
              aoAbrirMenuExercicio={() => setMenuExercicio(item)}
              aoAdicionarSerie={() => void adicionarSerie(item.id)}
              aoConcluirSerie={(serie) => void concluirSerie(item, serie.id)}
              aoUsarReferencia={(serie, ref) =>
                void atualizarSerie(serie.id, { peso: ref.peso, repeticoes: ref.repeticoes })
              }
              aoAbrirMenuSerie={(serie) => setMenuSerie({ item, serie })}
              aoFocarLinha={garantirVisivel}
            />
          ))
        )}

        <View className="gap-3 pt-1">
          <Botao
            titulo="Adicionar exercício"
            variante="secundario"
            icone="add"
            aoTocar={() => router.push(`/selecionar-exercicios?destino=treino&alvoId=${treino.id}`)}
          />
          <Pressable
            onPress={confirmarDescartar}
            accessibilityRole="button"
            accessibilityLabel="Descartar treino"
            style={{ minHeight: ALVO_TOQUE }}
            className="flex-row items-center justify-center gap-2 rounded-2xl active:bg-superficie2">
            <Ionicons name="trash-outline" size={16} color={cores.texto3} />
            <Text className="text-[14px] font-semibold text-texto3">Descartar treino</Text>
          </Pressable>
        </View>
      </ScrollView>

      <TecladoNumerico
        aoMedirAltura={(h) => {
          alturaTeclado.current = h;
        }}
        aoConcluirSerie={(serieId) => {
          const item = listaItens.find((i) =>
            (seriesPorExercicio[i.id] ?? []).some((s) => s.id === serieId),
          );
          if (item) void concluirSerie(item, serieId);
        }}
      />

      <MenuOpcoes
        visivel={menuSerie !== null}
        titulo={menuSerie ? `Série ${menuSerie.serie.numeroSerie}` : undefined}
        subtitulo={menuSerie?.item.nome}
        opcoes={opcoesSerie}
        aoFechar={() => setMenuSerie(null)}
      />

      <MenuOpcoes
        visivel={menuExercicio !== null}
        titulo={menuExercicio?.nome}
        opcoes={opcoesExercicio}
        aoFechar={() => setMenuExercicio(null)}
      />

      <MenuOpcoes
        visivel={menuTreino}
        titulo={treino.nome}
        opcoes={[
          { rotulo: 'Renomear treino', icone: 'text-outline', aoTocar: () => setRenomeando(true) },
          {
            rotulo: 'Notas do treino',
            icone: 'document-text-outline',
            aoTocar: () => setEditandoNotas(true),
          },
        ]}
        aoFechar={() => setMenuTreino(false)}
      />

      <ModalTexto
        visivel={editandoNotas}
        titulo="Notas do treino"
        valorInicial={treino.notas ?? ''}
        placeholder="Como foi o treino, energia, dores, o que ajustar"
        aoSalvar={(t) => void atualizarNotasDoTreino(treino.id, t)}
        aoFechar={() => setEditandoNotas(false)}
      />

      <ModalTexto
        visivel={itemEmNotas !== null}
        titulo="Notas do exercício"
        descricao={itemEmNotas?.nome}
        valorInicial={itemEmNotas?.notas ?? ''}
        placeholder="Ex.: banco no furo 3, pegada aberta"
        aoSalvar={(t) => {
          if (itemEmNotas) void atualizarNotasDoExercicio(itemEmNotas.id, t);
        }}
        aoFechar={() => setItemEmNotas(null)}
      />

      <ModalTexto
        visivel={renomeando}
        titulo="Nome do treino"
        valorInicial={treino.nome}
        multilinha={false}
        placeholder="Ex.: Push A"
        aoSalvar={(t) => void renomearTreino(treino.id, t)}
        aoFechar={() => setRenomeando(false)}
      />
    </Tela>
  );
}
