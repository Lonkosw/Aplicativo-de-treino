import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ALVO_TOQUE, cores } from '@/constants/tema';
import type { TipoSerie } from '@/db/schema';
import { ROTULO_RECORDE, type TipoRecorde } from '@/lib/calculos';
import * as fmt from '@/lib/formato';
import { usarTreinoAtivo } from '@/store/treino-ativo';

export type SerieDaTela = {
  id: number;
  numeroSerie: number;
  peso: number;
  repeticoes: number;
  tipo: TipoSerie;
  concluida: boolean;
};

export const MARCA_TIPO: Record<TipoSerie, string> = {
  normal: '',
  aquecimento: 'A',
  falha: 'F',
  dropset: 'D',
};

export const NOME_TIPO: Record<TipoSerie, string> = {
  normal: 'Normal',
  aquecimento: 'Aquecimento',
  falha: 'Até a falha',
  dropset: 'Drop set',
};

/** Célula tocável de peso/repetições. Não é um TextInput de propósito. */
function CampoNumero({
  valorFormatado,
  focado,
  concluida,
  largura,
  aoTocar,
  acessibilidade,
}: {
  valorFormatado: string;
  focado: boolean;
  concluida: boolean;
  largura: number;
  aoTocar: () => void;
  acessibilidade: string;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityLabel={acessibilidade}
      style={{ width: largura, minHeight: ALVO_TOQUE - 6 }}
      className={`items-center justify-center rounded-xl border ${
        focado
          ? 'border-destaque bg-destaqueFundo'
          : concluida
            ? 'border-transparent bg-transparent'
            : 'border-borda bg-superficie2'
      }`}>
      <Text className={`text-numero ${valorFormatado === '0' ? 'text-texto3' : 'text-texto'}`}>
        {valorFormatado}
      </Text>
    </Pressable>
  );
}

export const LinhaSerie = memo(function LinhaSerie({
  serie,
  referencia,
  recordes,
  aoConcluir,
  aoUsarReferencia,
  aoAbrirMenu,
}: {
  serie: SerieDaTela;
  referencia?: { peso: number; repeticoes: number };
  recordes?: TipoRecorde[];
  aoConcluir: () => void;
  aoUsarReferencia: () => void;
  aoAbrirMenu: () => void;
}) {
  // Seletores estreitos: uma linha só re-renderiza quando é ela que está
  // focada. Sem isso, cada dígito digitado repintaria o treino inteiro.
  const campoFocado = usarTreinoAtivo((s) =>
    s.foco?.serieId === serie.id ? s.foco.campo : null,
  );
  const buffer = usarTreinoAtivo((s) => (s.foco?.serieId === serie.id ? s.buffer : ''));
  const focar = usarTreinoAtivo((s) => s.focar);

  const mostrarPeso =
    campoFocado === 'peso' ? buffer || '0' : fmt.peso(serie.peso);
  const mostrarReps =
    campoFocado === 'repeticoes' ? buffer || '0' : String(serie.repeticoes);

  const temRecorde = !!recordes?.length;

  return (
    <View>
      <View
        className={`flex-row items-center gap-2 px-3 py-1.5 ${
          serie.concluida ? 'bg-superficie2' : ''
        }`}>
        {/* Número da série / tipo — toque abre o menu da série */}
        <Pressable
          onPress={aoAbrirMenu}
          accessibilityLabel={`Série ${serie.numeroSerie}, ${NOME_TIPO[serie.tipo]}`}
          style={{ width: 34, minHeight: ALVO_TOQUE - 6 }}
          className="items-center justify-center rounded-lg active:bg-superficie3">
          <Text
            className={`text-[15px] font-bold ${
              serie.tipo === 'normal' ? 'text-texto2' : 'text-texto3'
            }`}>
            {serie.tipo === 'normal' ? serie.numeroSerie : MARCA_TIPO[serie.tipo]}
          </Text>
        </Pressable>

        {/* Referência do treino anterior — toque preenche os campos */}
        <Pressable
          onPress={referencia ? aoUsarReferencia : undefined}
          disabled={!referencia}
          accessibilityLabel="Usar valores do treino anterior"
          style={{ minHeight: ALVO_TOQUE - 6 }}
          className="flex-1 justify-center rounded-lg px-1 active:bg-superficie3">
          <Text className="text-[14px] font-medium text-texto3" numberOfLines={1}>
            {referencia ? `${fmt.peso(referencia.peso)} × ${referencia.repeticoes}` : '—'}
          </Text>
        </Pressable>

        <CampoNumero
          valorFormatado={mostrarPeso}
          focado={campoFocado === 'peso'}
          concluida={serie.concluida}
          largura={72}
          acessibilidade="Peso em quilos"
          aoTocar={() => focar({ serieId: serie.id, campo: 'peso' }, serie.peso)}
        />
        <CampoNumero
          valorFormatado={mostrarReps}
          focado={campoFocado === 'repeticoes'}
          concluida={serie.concluida}
          largura={60}
          acessibilidade="Repetições"
          aoTocar={() => focar({ serieId: serie.id, campo: 'repeticoes' }, serie.repeticoes)}
        />

        {/* Check grande: um toque registra a série */}
        <Pressable
          onPress={aoConcluir}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: serie.concluida }}
          accessibilityLabel={serie.concluida ? 'Desmarcar série' : 'Concluir série'}
          style={{ width: ALVO_TOQUE, height: ALVO_TOQUE }}
          className="items-center justify-center">
          <View
            style={{ width: 36, height: 36 }}
            className={`items-center justify-center rounded-xl border-2 ${
              serie.concluida ? 'border-texto bg-texto' : 'border-borda bg-superficie2'
            }`}>
            <Ionicons
              name="checkmark"
              size={22}
              color={serie.concluida ? cores.fundo : cores.texto3}
            />
          </View>
        </Pressable>
      </View>

      {temRecorde ? (
        <View className="flex-row items-center gap-1.5 px-3 pb-1.5">
          <Ionicons name="trophy" size={12} color={cores.destaque} />
          <Text className="text-[11px] font-bold uppercase tracking-wide text-destaque">
            {recordes.map((r) => ROTULO_RECORDE[r]).join(' · ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

export function CabecalhoColunas() {
  return (
    <View className="flex-row items-center gap-2 px-3 pb-1 pt-2">
      <Text style={{ width: 34 }} className="text-center text-[10px] font-bold uppercase tracking-wider text-texto3">
        Série
      </Text>
      <Text className="flex-1 px-1 text-[10px] font-bold uppercase tracking-wider text-texto3">
        Anterior
      </Text>
      <Text style={{ width: 72 }} className="text-center text-[10px] font-bold uppercase tracking-wider text-texto3">
        Kg
      </Text>
      <Text style={{ width: 60 }} className="text-center text-[10px] font-bold uppercase tracking-wider text-texto3">
        Reps
      </Text>
      <View style={{ width: ALVO_TOQUE }} />
    </View>
  );
}
