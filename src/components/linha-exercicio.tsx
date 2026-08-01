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
  etiqueta,
}: {
  exercicio: Pick<Exercicio, 'id' | 'nome' | 'grupoMuscularPrimario' | 'equipamento' | 'ehCustomizado'>;
  aoTocar: () => void;
  direita?: React.ReactNode;
  etiqueta?: string;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${exercicio.nome}. ${exercicio.grupoMuscularPrimario}, ${exercicio.equipamento}.${etiqueta ? ` ${etiqueta}.` : ''}`}
      style={{ minHeight: 64 }}
      className="flex-row items-center gap-3 px-5 active:bg-superficie2">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-superficie2">
        <Ionicons
          name={exercicio.ehCustomizado ? 'create' : 'barbell'}
          size={18}
          color={exercicio.ehCustomizado ? cores.destaqueTexto : cores.texto3}
        />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-texto" numberOfLines={1}>
          {exercicio.nome}
        </Text>
        <Text className="text-[13px] text-texto3" numberOfLines={1}>
          {exercicio.grupoMuscularPrimario} · {exercicio.equipamento}
          {etiqueta ? <Text className="text-destaqueTexto"> · {etiqueta}</Text> : null}
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
  jaAdicionado,
  aoTocar,
}: {
  exercicio: Pick<Exercicio, 'id' | 'nome' | 'grupoMuscularPrimario' | 'equipamento' | 'ehCustomizado'>;
  selecionado: boolean;
  /** Já está no treino/rotina de destino. Ainda dá para adicionar de novo. */
  jaAdicionado?: boolean;
  aoTocar: () => void;
}) {
  return (
    <LinhaExercicio
      exercicio={exercicio}
      aoTocar={aoTocar}
      etiqueta={jaAdicionado ? 'já na lista' : undefined}
      direita={
        <View
          style={{ width: 30, height: 30 }}
          className={`items-center justify-center rounded-full border-2 ${
            selecionado ? 'border-destaque bg-destaque' : 'border-bordaCampo'
          }`}>
          {selecionado ? <Ionicons name="checkmark" size={20} color="#FFFFFF" /> : null}
        </View>
      }
    />
  );
});
