import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';

import { CabecalhoPilha } from '@/components/cabecalho-pilha';
import { CampoTexto, EstadoVazio } from '@/components/ui/basicos';
import { Botao, BotaoIcone } from '@/components/ui/botao';
import { ModalTexto } from '@/components/ui/modal-texto';
import { Tela } from '@/components/ui/tela';
import { ALVO_TOQUE, cores } from '@/constants/tema';
import {
  atualizarItemDaRotina,
  atualizarRotina,
  listarItensDaRotina,
  obterRotina,
  removerItemDaRotina,
  reordenarItensDaRotina,
  type ItemRotina,
} from '@/db/consultas/rotinas';
import { iniciarTreinoDeRotina, obterTreinoAtivo } from '@/db/consultas/treinos';
import * as fmt from '@/lib/formato';

function LinhaItem({
  item,
  aoMudarSeries,
  aoEditarNotas,
  aoRemover,
}: {
  item: ItemRotina;
  aoMudarSeries: (delta: number) => void;
  aoEditarNotas: () => void;
  aoRemover: () => void;
}) {
  // `useReorderableDrag` devolve a função que inicia o arraste. Ela roda na
  // UI thread (Reanimated) — por isso o arraste não trava mesmo com o JS
  // ocupado. Não há equivalente na web.
  const arrastar = useReorderableDrag();

  return (
    <View className="mx-5 mb-3 rounded-2xl border border-borda bg-superficie">
      <View className="flex-row items-center gap-1 p-3">
        <Pressable
          onLongPress={arrastar}
          delayLongPress={140}
          hitSlop={6}
          style={{ minWidth: 34, minHeight: ALVO_TOQUE }}
          className="items-center justify-center">
          <Ionicons name="reorder-three" size={24} color={cores.texto3} />
        </Pressable>

        <View className="flex-1">
          <Text className="text-[15px] font-bold text-texto" numberOfLines={1}>
            {item.nome}
          </Text>
          <Text className="text-[12px] text-texto3" numberOfLines={1}>
            {item.grupoMuscularPrimario} · {item.equipamento} · descanso {fmt.cronometro(item.descansoSegundos)}
          </Text>
        </View>

        <BotaoIcone icone="trash-outline" acessibilidade="Remover exercício" aoTocar={aoRemover} />
      </View>

      <View className="flex-row items-center gap-3 border-t border-borda px-3 py-2">
        <Text className="flex-1 text-[13px] text-texto2">Séries alvo</Text>
        <BotaoIcone icone="remove" acessibilidade="Menos uma série" aoTocar={() => aoMudarSeries(-1)} />
        <Text className="w-8 text-center text-numero text-texto">{item.seriesAlvo}</Text>
        <BotaoIcone icone="add" acessibilidade="Mais uma série" aoTocar={() => aoMudarSeries(1)} />
        <BotaoIcone
          icone={item.notas ? 'document-text' : 'document-text-outline'}
          cor={item.notas ? cores.destaque : cores.texto3}
          acessibilidade="Notas do exercício"
          aoTocar={aoEditarNotas}
        />
      </View>

      {item.notas ? (
        <Text className="px-3 pb-3 text-[13px] italic text-texto2">{item.notas}</Text>
      ) : null}
    </View>
  );
}

export default function TelaEditorRotina() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rotinaId = Number(id);
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [notas, setNotas] = useState('');
  const [itens, setItens] = useState<ItemRotina[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [itemEmNotas, setItemEmNotas] = useState<ItemRotina | null>(null);

  const recarregar = useCallback(async () => {
    const [rotina, lista] = await Promise.all([obterRotina(rotinaId), listarItensDaRotina(rotinaId)]);
    if (rotina) {
      setNome(rotina.nome);
      setNotas(rotina.notas ?? '');
    }
    setItens(lista);
    setCarregando(false);
  }, [rotinaId]);

  useFocusEffect(
    useCallback(() => {
      void recarregar();
    }, [recarregar]),
  );

  async function salvarCabecalho() {
    await atualizarRotina(rotinaId, { nome, notas });
  }

  async function aoReordenar({ from, to }: ReorderableListReorderEvent) {
    // Atualiza a lista local primeiro para o arraste não "voltar" na tela,
    // e só então grava a nova ordem no banco.
    const nova = reorderItems(itens, from, to);
    setItens(nova);
    await reordenarItensDaRotina(nova.map((i) => i.id));
  }

  async function mudarSeries(item: ItemRotina, delta: number) {
    const alvo = Math.max(1, item.seriesAlvo + delta);
    setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, seriesAlvo: alvo } : i)));
    await atualizarItemDaRotina(item.id, { seriesAlvo: alvo });
  }

  async function salvarNotasDoItem(texto: string) {
    if (!itemEmNotas) return;
    const notasNovas = texto.trim() || null;
    setItens((atual) => atual.map((i) => (i.id === itemEmNotas.id ? { ...i, notas: notasNovas } : i)));
    await atualizarItemDaRotina(itemEmNotas.id, { notas: notasNovas });
  }

  async function removerItem(item: ItemRotina) {
    setItens((atual) => atual.filter((i) => i.id !== item.id));
    await removerItemDaRotina(item.id);
  }

  async function iniciar() {
    const ativo = await obterTreinoAtivo();
    if (ativo) {
      Alert.alert('Treino em andamento', 'Finalize ou descarte o treino atual antes de iniciar outro.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver treino', onPress: () => router.push('/treino/ativo') },
      ]);
      return;
    }
    await salvarCabecalho();
    await iniciarTreinoDeRotina(rotinaId);
    router.replace('/treino/ativo');
  }

  if (carregando) return <Tela />;

  return (
    <Tela>
      <CabecalhoPilha
        titulo="Editar rotina"
        subtitulo={fmt.plural(itens.length, 'exercício', 'exercícios')}
        aoVoltar={() => {
          void salvarCabecalho();
          router.back();
        }}
      />

      <ReorderableList
        data={itens}
        keyExtractor={(item) => String(item.id)}
        onReorder={aoReordenar}
        renderItem={({ item }) => (
          <LinhaItem
            item={item}
            aoMudarSeries={(d) => void mudarSeries(item, d)}
            aoEditarNotas={() => setItemEmNotas(item)}
            aoRemover={() => void removerItem(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View className="gap-4 p-5">
            <CampoTexto rotulo="Nome da rotina" valor={nome} aoMudar={setNome} placeholder="Ex.: Push A" />
            <CampoTexto
              rotulo="Notas (opcional)"
              valor={notas}
              aoMudar={setNotas}
              placeholder="Observações gerais da rotina"
              multilinha
            />
            {itens.length > 0 ? (
              <Text className="text-xs font-bold uppercase tracking-wider text-texto3">
                Exercícios · segure no ícone para reordenar
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EstadoVazio
            icone="barbell"
            titulo="Rotina vazia"
            descricao="Adicione exercícios para poder iniciar o treino."
          />
        }
      />

      <View className="gap-3 border-t border-borda p-5">
        <Botao
          titulo="Adicionar exercícios"
          variante="secundario"
          icone="add"
          aoTocar={() => {
            void salvarCabecalho();
            router.push(`/selecionar-exercicios?destino=rotina&alvoId=${rotinaId}`);
          }}
        />
        <Botao
          titulo="Iniciar este treino"
          icone="play"
          tamanho="grande"
          desabilitado={itens.length === 0}
          aoTocar={() => void iniciar()}
        />
      </View>

      <ModalTexto
        visivel={itemEmNotas !== null}
        titulo="Notas do exercício"
        descricao={itemEmNotas?.nome}
        valorInicial={itemEmNotas?.notas ?? ''}
        placeholder="Ex.: pegada supinada, cadência 3-1-1"
        aoSalvar={(t) => void salvarNotasDoItem(t)}
        aoFechar={() => setItemEmNotas(null)}
      />
    </Tela>
  );
}
