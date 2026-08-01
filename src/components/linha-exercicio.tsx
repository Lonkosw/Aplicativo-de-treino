import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ALVO_TOQUE, cores } from '@/constants/tema';
import type { Exercicio } from '@/db/schema';

/**
 * `memo` importa mais aqui do que na web: a lista de exercícios tem ~870
 * itens e a FlatList reaproveita as linhas ao rolar.
 */
export const LinhaExercicio = memo(function LinhaExercicio({
  exercicio,
  aoTocar,
  direita,
}: {
  exercicio: Pick<Exercicio, 'id' | 'nome' | 'grupoMuscularPrimario' | 'equipamento' | 'ehCustomizado'>;
  aoTocar: () => void;
  direita?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      style={{ minHeight: 64 }}
      className="flex-row items-center gap-3 px-5 active:bg-superficie2">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-superficie2">
        <Ionicons
          name={exercicio.ehCustomizado ? 'create' : 'barbell'}
          size={18}
          color={exercicio.ehCustomizado ? cores.destaque : cores.texto3}
        />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-texto" numberOfLines={1}>
          {exercicio.nome}
        </Text>
        <Text className="text-[13px] text-texto3" numberOfLines={1}>
          {exercicio.grupoMuscularPrimario} · {exercicio.equipamento}
        </Text>
      </View>
      {direita ?? <Ionicons name="chevron-forward" size={16} color={cores.texto3} />}
    </Pressable>
  );
});

/** Variante com checkbox, usada na tela de seleção múltipla. */
export const LinhaExercicioSelecionavel = memo(function LinhaExercicioSelecionavel({
  exercicio,
  selecionado,
  aoTocar,
}: {
  exercicio: Pick<Exercicio, 'id' | 'nome' | 'grupoMuscularPrimario' | 'equipamento' | 'ehCustomizado'>;
  selecionado: boolean;
  aoTocar: () => void;
}) {
  return (
    <LinhaExercicio
      exercicio={exercicio}
      aoTocar={aoTocar}
      direita={
        <View
          style={{ width: ALVO_TOQUE - 12, height: ALVO_TOQUE - 12 }}
          className={`items-center justify-center rounded-full border-2 ${
            selecionado ? 'border-destaque bg-destaque' : 'border-borda'
          }`}>
          {selecionado ? <Ionicons name="checkmark" size={20} color="#FFFFFF" /> : null}
        </View>
      }
    />
  );
});
