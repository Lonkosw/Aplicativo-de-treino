import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { CabecalhoPilha } from '@/components/cabecalho-pilha';
import { EstadoVazio, Etiqueta } from '@/components/ui/basicos';
import { Tela } from '@/components/ui/tela';
import { queryHistoricoTreinos } from '@/db/consultas/treinos';
import * as fmt from '@/lib/formato';

export default function TelaHistorico() {
  const router = useRouter();
  const { data: treinos } = useLiveQuery(queryHistoricoTreinos(200));

  return (
    <Tela>
      <CabecalhoPilha
        titulo="Histórico"
        subtitulo={fmt.plural(treinos?.length ?? 0, 'treino', 'treinos')}
      />

      <FlatList
        data={treinos ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/treino/${item.id}`)}
            style={{ minHeight: 64 }}
            className="flex-row items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 active:bg-superficie2">
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-texto" numberOfLines={1}>
                {item.nome}
              </Text>
              <Text className="text-[12px] text-texto3">
                {fmt.dataRelativa(item.iniciadoEm)} · {fmt.duracaoCurta(item.duracaoSegundos)} ·{' '}
                {fmt.plural(item.totalSeries, 'série', 'séries')}
              </Text>
            </View>
            <Etiqueta>{fmt.volumeCompacto(item.volume)}</Etiqueta>
          </Pressable>
        )}
        ListEmptyComponent={
          <EstadoVazio
            icone="time-outline"
            titulo="Nenhum treino finalizado"
            descricao="Os treinos que você concluir aparecem aqui."
          />
        }
      />
    </Tela>
  );
}
