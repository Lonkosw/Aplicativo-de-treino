import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ALVO_TOQUE, DURACAO, cores } from '@/constants/tema';
import * as fmt from '@/lib/formato';
import { usarTreinoAtivo } from '@/store/treino-ativo';

function BotaoDescanso({
  rotulo,
  icone,
  aoTocar,
  acessibilidade,
}: {
  rotulo?: string;
  icone?: 'play-skip-forward';
  aoTocar: () => void;
  acessibilidade: string;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={acessibilidade}
      style={{ minHeight: ALVO_TOQUE, minWidth: 54 }}
      className="items-center justify-center rounded-xl bg-superficie2 active:bg-superficie3">
      {rotulo ? (
        <Text className="text-sm font-bold text-texto">{rotulo}</Text>
      ) : (
        <Ionicons name={icone!} size={18} color={cores.texto} />
      )}
    </Pressable>
  );
}

/**
 * Barra fixa do timer de descanso.
 *
 * O texto muda uma vez por segundo (estado React), mas a barra de progresso
 * é animada na UI thread com `withTiming` até o fim do descanso — assim ela
 * escorre continuamente em vez de pular de segundo em segundo, e não custa
 * um render a cada frame.
 */
export function BarraDescanso() {
  const descanso = usarTreinoAtivo((s) => s.descanso);
  const ajustar = usarTreinoAtivo((s) => s.ajustarDescanso);
  const encerrar = usarTreinoAtivo((s) => s.encerrarDescanso);

  const [restante, setRestante] = useState(0);
  // Evita disparar a vibração duas vezes se o efeito reexecutar.
  const jaAlertou = useRef(false);

  const progresso = useSharedValue(1);

  useEffect(() => {
    if (!descanso) {
      jaAlertou.current = false;
      cancelAnimation(progresso);
      return;
    }

    // Anima do valor atual até zero, no tempo que falta. Reagenda sempre
    // que o descanso muda (±15s), então continua correto após ajustes.
    const faltamMs = Math.max(0, descanso.fimEm - Date.now());
    progresso.value = faltamMs / (descanso.totalSegundos * 1000);
    progresso.value = withTiming(0, { duration: faltamMs, easing: Easing.linear });

    const atualizar = () => {
      const segundos = Math.max(0, Math.ceil((descanso.fimEm - Date.now()) / 1000));
      // Roda a 250ms para não "pular" segundos, mas só re-renderiza quando
      // o número exibido muda de fato.
      setRestante((anterior) => (anterior === segundos ? anterior : segundos));
      if (segundos === 0 && !jaAlertou.current) {
        jaAlertou.current = true;
        void encerrar(true);
      }
    };

    atualizar();
    const intervalo = setInterval(atualizar, 250);
    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      atualizar();
      // Voltando do segundo plano a animação foi congelada: reancora.
      const restanteMs = Math.max(0, descanso.fimEm - Date.now());
      cancelAnimation(progresso);
      progresso.value = restanteMs / (descanso.totalSegundos * 1000);
      progresso.value = withTiming(0, { duration: restanteMs, easing: Easing.linear });
    });

    return () => {
      clearInterval(intervalo);
      inscricao.remove();
    };
  }, [descanso, encerrar, progresso]);

  const estiloBarra = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, progresso.value * 100))}%`,
  }));

  if (!descanso) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(DURACAO.media)}
      exiting={FadeOut.duration(DURACAO.rapida)}
      className="border-b border-borda bg-destaqueFundo">
      <View className="h-1 w-full">
        <Animated.View style={estiloBarra} className="h-1 bg-destaque" />
      </View>

      <View className="flex-row items-center gap-2 px-4 py-2">
        <Ionicons name="timer-outline" size={20} color={cores.destaqueTexto} />
        <View className="flex-1">
          <Text
            accessibilityLiveRegion="polite"
            className="text-[19px] font-extrabold tabular-nums text-destaqueTexto">
            {fmt.cronometro(restante)}
          </Text>
          <Text className="text-[11px] text-texto2" numberOfLines={1}>
            Descanso · {descanso.nomeExercicio}
          </Text>
        </View>

        <BotaoDescanso rotulo="−15s" aoTocar={() => void ajustar(-15)} acessibilidade="Tirar 15 segundos" />
        <BotaoDescanso rotulo="+15s" aoTocar={() => void ajustar(15)} acessibilidade="Somar 15 segundos" />
        <BotaoDescanso
          icone="play-skip-forward"
          aoTocar={() => void encerrar(false)}
          acessibilidade="Pular descanso"
        />
      </View>
    </Animated.View>
  );
}
