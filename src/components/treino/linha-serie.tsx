import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ALVO_TOQUE, DURACAO, cores } from '@/constants/tema';
import type { TipoSerie } from '@/db/schema';
import { ROTULO_RECORDE, type TipoRecorde } from '@/lib/calculos';
import * as fmt from '@/lib/formato';
import { usarTreinoAtivo } from '@/store/treino-ativo';

/**
 * Larguras das colunas, em dp.
 *
 * Somadas com os espaçamentos, precisam caber num aparelho de 360dp — o
 * mais estreito que ainda é comum. Conta: 360 − 32 (padding da lista) − 16
 * (padding do cartão) = 312 úteis; 32+66+54+48 fixos + 4 espaços de 6 = 224,
 * sobrando 88dp para a coluna "anterior". "100,5 × 15" ocupa ~66dp a 13px,
 * então cabe com folga. Mexer aqui exige refazer essa conta.
 */
export const COLUNAS = {
  serie: 32,
  peso: 66,
  reps: 54,
  check: ALVO_TOQUE,
  espaco: 6,
} as const;

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

/**
 * Célula tocável de peso/repetições. Não é um `TextInput` de propósito — o
 * teclado é próprio (ver teclado-numerico.tsx).
 *
 * A borda existe para dar affordance: com o fundo quase preto do tema, sem
 * ela a célula não se lê como campo editável.
 */
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
      accessibilityRole="button"
      accessibilityLabel={acessibilidade}
      accessibilityValue={{ text: valorFormatado }}
      style={{ width: largura, height: ALVO_TOQUE - 6 }}
      className={`items-center justify-center rounded-xl border ${
        focado
          ? 'border-destaque bg-destaqueFundo'
          : concluida
            ? 'border-transparent bg-transparent'
            : 'border-bordaCampo bg-superficie2'
      }`}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className={`text-numero ${valorFormatado === '0' ? 'text-texto3' : 'text-texto'}`}>
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
  aoFocar,
}: {
  serie: SerieDaTela;
  referencia?: { peso: number; repeticoes: number };
  recordes?: TipoRecorde[];
  aoConcluir: () => void;
  aoUsarReferencia: () => void;
  aoAbrirMenu: () => void;
  /** Avisa a tela onde a linha está, para ela rolar acima do teclado. */
  aoFocar: (yNaJanela: number, altura: number) => void;
}) {
  // Seletores estreitos: uma linha só re-renderiza quando é ela que está
  // focada. Sem isso, cada dígito digitado repintaria o treino inteiro.
  const campoFocado = usarTreinoAtivo((s) => (s.foco?.serieId === serie.id ? s.foco.campo : null));
  const buffer = usarTreinoAtivo((s) => (s.foco?.serieId === serie.id ? s.buffer : ''));
  const focar = usarTreinoAtivo((s) => s.focar);

  // Transição do fundo ao concluir, em vez de trocar de cor de um frame
  // para o outro. Roda na UI thread, sem passar pelo JS.
  const progresso = useSharedValue(serie.concluida ? 1 : 0);
  useEffect(() => {
    progresso.value = withTiming(serie.concluida ? 1 : 0, { duration: DURACAO.media });
  }, [serie.concluida, progresso]);

  const estiloFundo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progresso.value,
      [0, 1],
      ['rgba(28,28,31,0)', cores.superficie2],
    ),
  }));

  /**
   * Ao ganhar foco, mede a própria posição na janela e avisa a tela. Sem
   * isso, tocar no peso de uma série da metade de baixo abre o teclado
   * exatamente em cima dela — o campo que você quer editar some.
   * O atraso dá tempo do teclado montar e reportar a altura dele.
   */
  const refLinha = useRef<View>(null);
  const estaFocada = campoFocado !== null;
  useEffect(() => {
    if (!estaFocada) return;
    const id = setTimeout(() => {
      refLinha.current?.measureInWindow((_x, y, _largura, altura) => {
        if (altura > 0) aoFocar(y, altura);
      });
    }, 90);
    return () => clearTimeout(id);
  }, [estaFocada, aoFocar]);

  const mostrarPeso = campoFocado === 'peso' ? buffer || '0' : fmt.peso(serie.peso);
  const mostrarReps = campoFocado === 'repeticoes' ? buffer || '0' : String(serie.repeticoes);

  const temRecorde = !!recordes?.length;

  return (
    <Animated.View ref={refLinha} style={estiloFundo}>
      <View style={{ gap: COLUNAS.espaco }} className="flex-row items-center px-2 py-1">
        {/* Número da série / tipo — toque abre o menu da série */}
        <Pressable
          onPress={aoAbrirMenu}
          accessibilityRole="button"
          accessibilityLabel={`Série ${serie.numeroSerie}, ${NOME_TIPO[serie.tipo]}. Toque para mudar o tipo ou remover.`}
          style={{ width: COLUNAS.serie, height: ALVO_TOQUE }}
          className="items-center justify-center rounded-lg active:bg-superficie3">
          <Text
            className={`text-[15px] font-bold ${
              serie.tipo === 'normal' ? 'text-texto2' : 'text-destaqueTexto'
            }`}>
            {serie.tipo === 'normal' ? serie.numeroSerie : MARCA_TIPO[serie.tipo]}
          </Text>
        </Pressable>

        {/* Referência do treino anterior — toque preenche os campos */}
        <Pressable
          onPress={referencia ? aoUsarReferencia : undefined}
          disabled={!referencia}
          accessibilityRole="button"
          accessibilityLabel={
            referencia
              ? `Treino anterior: ${fmt.peso(referencia.peso)} quilos por ${referencia.repeticoes} repetições. Toque para copiar.`
              : 'Sem registro anterior'
          }
          style={{ height: ALVO_TOQUE }}
          className="flex-1 justify-center rounded-lg px-1 active:bg-superficie3">
          <Text className="text-[13px] font-medium text-texto3" numberOfLines={1}>
            {referencia ? `${fmt.peso(referencia.peso)} × ${referencia.repeticoes}` : '—'}
          </Text>
        </Pressable>

        <CampoNumero
          valorFormatado={mostrarPeso}
          focado={campoFocado === 'peso'}
          concluida={serie.concluida}
          largura={COLUNAS.peso}
          acessibilidade="Peso em quilos"
          aoTocar={() => focar({ serieId: serie.id, campo: 'peso' }, serie.peso)}
        />
        <CampoNumero
          valorFormatado={mostrarReps}
          focado={campoFocado === 'repeticoes'}
          concluida={serie.concluida}
          largura={COLUNAS.reps}
          acessibilidade="Repetições"
          aoTocar={() => focar({ serieId: serie.id, campo: 'repeticoes' }, serie.repeticoes)}
        />

        {/* Check grande: um toque registra a série */}
        <Pressable
          onPress={aoConcluir}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: serie.concluida }}
          accessibilityLabel={serie.concluida ? 'Desmarcar série' : 'Concluir série'}
          style={{ width: COLUNAS.check, height: ALVO_TOQUE }}
          className="items-center justify-center">
          <View
            style={{ width: 36, height: 36 }}
            className={`items-center justify-center rounded-xl border-2 ${
              serie.concluida ? 'border-texto bg-texto' : 'border-bordaCampo bg-superficie2'
            }`}>
            <Ionicons name="checkmark" size={22} color={serie.concluida ? cores.fundo : cores.texto3} />
          </View>
        </Pressable>
      </View>

      {temRecorde ? (
        <Animated.View
          entering={FadeIn.duration(DURACAO.lenta)}
          className="flex-row items-center gap-1.5 px-2 pb-1.5">
          <Ionicons name="trophy" size={12} color={cores.destaqueTexto} />
          <Text className="text-[11px] font-bold uppercase tracking-wide text-destaqueTexto">
            {recordes.map((r) => ROTULO_RECORDE[r]).join(' · ')}
          </Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
});

export function CabecalhoColunas() {
  const rotulo = 'text-[10px] font-bold uppercase tracking-wider text-texto3';
  return (
    <View style={{ gap: COLUNAS.espaco }} className="flex-row items-center px-2 pb-1 pt-2">
      <Text style={{ width: COLUNAS.serie }} className={`text-center ${rotulo}`}>
        Série
      </Text>
      <Text className={`flex-1 px-1 ${rotulo}`}>Anterior</Text>
      <Text style={{ width: COLUNAS.peso }} className={`text-center ${rotulo}`}>
        Kg
      </Text>
      <Text style={{ width: COLUNAS.reps }} className={`text-center ${rotulo}`}>
        Reps
      </Text>
      <View style={{ width: COLUNAS.check }} />
    </View>
  );
}
