import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { CabecalhoPilha } from '@/components/cabecalho-pilha';
import { LinhaExercicioSelecionavel } from '@/components/linha-exercicio';
import { CampoBusca, EstadoVazio, FiltroChips } from '@/components/ui/basicos';
import { Botao, BotaoIcone } from '@/components/ui/botao';
import { Tela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import { useValorAtrasado } from '@/lib/hooks';
import { adicionarExercicioNaRotina, exerciciosJaNaRotina } from '@/db/consultas/rotinas';
import { queryEquipamentos, queryExercicios, queryGruposMusculares } from '@/db/consultas/exercicios';
import { adicionarExercicioNoTreino, exerciciosJaNoTreino } from '@/db/consultas/treinos';

/**
 * Tela compartilhada: recebe por parâmetro de rota para onde os exercícios
 * escolhidos devem ir. Isso evita duplicar busca + filtros em dois lugares.
 *
 * `/selecionar-exercicios?destino=rotina&alvoId=3`
 * `/selecionar-exercicios?destino=treino&alvoId=12`
 */
export default function TelaSelecionarExercicios() {
  const { destino, alvoId } = useLocalSearchParams<{ destino: string; alvoId: string }>();
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState<string | null>(null);
  const [equipamento, setEquipamento] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);

  // O campo responde na hora; a consulta espera o usuário parar de digitar.
  const buscaAtrasada = useValorAtrasado(busca);
  const { data: lista } = useLiveQuery(
    queryExercicios({ busca: buscaAtrasada, grupo, equipamento }),
    [buscaAtrasada, grupo, equipamento],
  );
  const { data: grupos } = useLiveQuery(queryGruposMusculares());
  const { data: equipamentos } = useLiveQuery(queryEquipamentos());

  const selecionadosSet = useMemo(() => new Set(selecionados), [selecionados]);

  /**
   * Quem já está na lista de destino aparece marcado como "já adicionado".
   * Sem isso dá para adicionar o mesmo exercício duas vezes sem perceber —
   * e aí o treino mostra dois cartões idênticos.
   */
  const [jaAdicionados, setJaAdicionados] = useState<Set<number>>(new Set());
  useEffect(() => {
    const alvo = Number(alvoId);
    if (!Number.isFinite(alvo)) return;
    let ativo = true;
    const buscar = destino === 'treino' ? exerciciosJaNoTreino : exerciciosJaNaRotina;
    buscar(alvo).then((ids) => ativo && setJaAdicionados(new Set(ids)));
    return () => {
      ativo = false;
    };
  }, [alvoId, destino]);

  function alternar(id: number) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  async function confirmar() {
    const id = Number(alvoId);
    if (!selecionados.length || !Number.isFinite(id) || salvando) return;
    setSalvando(true);
    // Sequencial de propósito: a ordem de inserção define a ordem na lista.
    for (const exercicioId of selecionados) {
      if (destino === 'treino') await adicionarExercicioNoTreino(id, exercicioId);
      else await adicionarExercicioNaRotina(id, exercicioId);
    }
    router.back();
  }

  return (
    <Tela edges={['top', 'bottom']}>
      <CabecalhoPilha
        titulo="Adicionar exercícios"
        subtitulo={selecionados.length ? `${selecionados.length} selecionado(s)` : 'Toque para selecionar'}
        acao={
          <BotaoIcone
            icone="add"
            cor={cores.destaqueTexto}
            tamanho={26}
            acessibilidade="Criar exercício"
            aoTocar={() => router.push('/exercicio/novo')}
          />
        }
      />

      <View className="gap-3 py-3">
        <View className="px-5">
          <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar exercício" autoFoco />
        </View>
        <FiltroChips opcoes={grupos?.map((g) => g.valor) ?? []} selecionado={grupo} aoSelecionar={setGrupo} rotuloTodos="Todos os grupos" />
        <FiltroChips
          opcoes={equipamentos?.map((e) => e.valor) ?? []}
          selecionado={equipamento}
          aoSelecionar={setEquipamento}
          rotuloTodos="Todo equipamento"
        />
      </View>

      <FlatList
        data={lista ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <LinhaExercicioSelecionavel
            exercicio={item}
            selecionado={selecionadosSet.has(item.id)}
            jaAdicionado={jaAdicionados.has(item.id)}
            aoTocar={() => alternar(item.id)}
          />
        )}
        getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
        initialNumToRender={14}
        windowSize={8}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={<EstadoVazio icone="search" titulo="Nenhum exercício encontrado" />}
      />

      <View className="border-t border-borda p-5">
        <Botao
          titulo={selecionados.length ? `Adicionar ${selecionados.length}` : 'Selecione ao menos um'}
          aoTocar={confirmar}
          desabilitado={!selecionados.length}
          carregando={salvando}
          tamanho="grande"
        />
      </View>
    </Tela>
  );
}
