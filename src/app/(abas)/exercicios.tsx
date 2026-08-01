import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { BotaoIcone } from '@/components/ui/botao';
import { CampoBusca, EstadoVazio, FiltroChips } from '@/components/ui/basicos';
import { LinhaExercicio } from '@/components/linha-exercicio';
import { Tela, TituloTela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import { useValorAtrasado } from '@/lib/hooks';
import {
  queryEquipamentos,
  queryExercicios,
  queryGruposMusculares,
} from '@/db/consultas/exercicios';

export default function TelaExercicios() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState<string | null>(null);
  const [equipamento, setEquipamento] = useState<string | null>(null);

  // `useLiveQuery` reexecuta a consulta sozinho quando a tabela muda —
  // criar um exercício customizado já aparece aqui sem refresh manual.
  // O campo responde na hora; a consulta espera o usuário parar de digitar.
  const buscaAtrasada = useValorAtrasado(busca);
  const { data: lista } = useLiveQuery(
    queryExercicios({ busca: buscaAtrasada, grupo, equipamento }),
    [buscaAtrasada, grupo, equipamento],
  );
  const { data: grupos } = useLiveQuery(queryGruposMusculares());
  const { data: equipamentos } = useLiveQuery(queryEquipamentos());

  const opcoesGrupo = useMemo(() => grupos?.map((g) => g.valor) ?? [], [grupos]);
  const opcoesEquipamento = useMemo(() => equipamentos?.map((e) => e.valor) ?? [], [equipamentos]);

  return (
    <Tela>
      <TituloTela
        acao={
          <BotaoIcone
            icone="add"
            cor={cores.destaqueTexto}
            tamanho={26}
            acessibilidade="Criar exercício"
            aoTocar={() => router.push('/exercicio/novo')}
          />
        }>
        Exercícios
      </TituloTela>

      <View className="gap-3 pb-3">
        <View className="px-5">
          <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar exercício" />
        </View>
        <FiltroChips opcoes={opcoesGrupo} selecionado={grupo} aoSelecionar={setGrupo} rotuloTodos="Todos os grupos" />
        <FiltroChips
          opcoes={opcoesEquipamento}
          selecionado={equipamento}
          aoSelecionar={setEquipamento}
          rotuloTodos="Todo equipamento"
        />
      </View>

      <FlatList
        data={lista ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <LinhaExercicio exercicio={item} aoTocar={() => router.push(`/exercicio/${item.id}`)} />
        )}
        // A lista tem ~870 itens: alturas fixas evitam medição em tempo real.
        getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
        initialNumToRender={14}
        windowSize={8}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <EstadoVazio
            icone="search"
            titulo="Nenhum exercício encontrado"
            descricao="Ajuste a busca ou os filtros, ou crie um exercício customizado."
          />
        }
      />
    </Tela>
  );
}
