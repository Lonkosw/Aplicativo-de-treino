import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { BotaoIcone } from '@/components/ui/botao';
import { cores } from '@/constants/tema';
import type { ItemTreino } from '@/db/consultas/treinos';
import type { TipoRecorde } from '@/lib/calculos';
import * as fmt from '@/lib/formato';

import { CabecalhoColunas, LinhaSerie, type SerieDaTela } from './linha-serie';

export function CartaoExercicioTreino({
  item,
  series,
  referencias,
  recordesPorSerie,
  aoAbrirExercicio,
  aoAbrirMenuExercicio,
  aoAdicionarSerie,
  aoConcluirSerie,
  aoUsarReferencia,
  aoAbrirMenuSerie,
}: {
  item: ItemTreino;
  series: SerieDaTela[];
  referencias: { peso: number; repeticoes: number }[];
  recordesPorSerie: Record<number, TipoRecorde[]>;
  aoAbrirExercicio: () => void;
  aoAbrirMenuExercicio: () => void;
  aoAdicionarSerie: () => void;
  aoConcluirSerie: (serie: SerieDaTela) => void;
  aoUsarReferencia: (serie: SerieDaTela, referencia: { peso: number; repeticoes: number }) => void;
  aoAbrirMenuSerie: (serie: SerieDaTela) => void;
}) {
  const concluidas = series.filter((s) => s.concluida).length;

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-borda bg-superficie">
      <View className="flex-row items-center gap-2 px-3 pt-3">
        <Pressable onPress={aoAbrirExercicio} className="flex-1">
          <Text className="text-[16px] font-bold text-destaque" numberOfLines={1}>
            {item.nome}
          </Text>
          <Text className="text-[12px] text-texto3" numberOfLines={1}>
            {concluidas}/{series.length} séries · descanso {fmt.cronometro(item.descansoSegundos)}
          </Text>
        </Pressable>
        <BotaoIcone
          icone="ellipsis-horizontal"
          acessibilidade="Opções do exercício"
          aoTocar={aoAbrirMenuExercicio}
        />
      </View>

      {item.notas ? (
        <Text className="px-3 pt-2 text-[13px] italic text-texto2">{item.notas}</Text>
      ) : null}

      <CabecalhoColunas />

      {series.map((serie) => (
        <LinhaSerie
          key={serie.id}
          serie={serie}
          referencia={referencias[serie.numeroSerie - 1] ?? referencias[referencias.length - 1]}
          recordes={recordesPorSerie[serie.id]}
          aoConcluir={() => aoConcluirSerie(serie)}
          aoUsarReferencia={() => {
            const ref = referencias[serie.numeroSerie - 1] ?? referencias[referencias.length - 1];
            if (ref) aoUsarReferencia(serie, ref);
          }}
          aoAbrirMenu={() => aoAbrirMenuSerie(serie)}
        />
      ))}

      <Pressable
        onPress={aoAdicionarSerie}
        style={{ minHeight: 46 }}
        className="mt-1 flex-row items-center justify-center gap-1.5 border-t border-borda active:bg-superficie2">
        <Ionicons name="add" size={18} color={cores.texto2} />
        <Text className="text-[14px] font-bold text-texto2">Série</Text>
      </Pressable>
    </View>
  );
}
