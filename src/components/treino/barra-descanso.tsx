import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';

import { cores } from '@/constants/tema';
import * as fmt from '@/lib/formato';
import { usarTreinoAtivo } from '@/store/treino-ativo';

/**
 * Barra fixa do timer de descanso. Só ela re-renderiza a cada segundo — o
 * resto da tela de treino fica parado, o que importa numa lista com dezenas
 * de linhas.
 */
export function BarraDescanso() {
  const descanso = usarTreinoAtivo((s) => s.descanso);
  const ajustar = usarTreinoAtivo((s) => s.ajustarDescanso);
  const encerrar = usarTreinoAtivo((s) => s.encerrarDescanso);

  const [restante, setRestante] = useState(0);
  // Evita disparar a vibração duas vezes se o efeito reexecutar.
  const jaAlertou = useRef(false);

  useEffect(() => {
    if (!descanso) {
      jaAlertou.current = false;
      return;
    }

    const atualizar = () => {
      const segundos = Math.max(0, Math.ceil((descanso.fimEm - Date.now()) / 1000));
      // Roda a 250ms para não "pular" segundos, mas só re-renderiza quando o
      // número exibido muda de fato.
      setRestante((anterior) => (anterior === segundos ? anterior : segundos));
      if (segundos === 0 && !jaAlertou.current) {
        jaAlertou.current = true;
        void encerrar(true);
      }
    };

    atualizar();
    const intervalo = setInterval(atualizar, 250);
    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') atualizar();
    });

    return () => {
      clearInterval(intervalo);
      inscricao.remove();
    };
  }, [descanso, encerrar]);

  if (!descanso) return null;

  const progresso = Math.min(1, Math.max(0, restante / descanso.totalSegundos));

  return (
    <View className="border-b border-borda bg-destaqueFundo">
      {/* Barra de progresso: largura em % do container, não animada, para
          não competir com o scroll pela UI thread. */}
      <View className="h-1 w-full bg-destaqueFundo">
        <View style={{ width: `${progresso * 100}%` }} className="h-1 bg-destaque" />
      </View>

      <View className="flex-row items-center gap-2 px-4 py-2">
        <Ionicons name="timer-outline" size={20} color={cores.destaque} />
        <View className="flex-1">
          <Text className="text-[19px] font-extrabold tabular-nums text-destaque">
            {fmt.cronometro(restante)}
          </Text>
          <Text className="text-[11px] text-texto3" numberOfLines={1}>
            Descanso · {descanso.nomeExercicio}
          </Text>
        </View>

        <Pressable
          onPress={() => void ajustar(-15)}
          style={{ minHeight: 40, minWidth: 52 }}
          className="items-center justify-center rounded-xl bg-superficie2 active:bg-superficie3">
          <Text className="text-sm font-bold text-texto">−15s</Text>
        </Pressable>
        <Pressable
          onPress={() => void ajustar(15)}
          style={{ minHeight: 40, minWidth: 52 }}
          className="items-center justify-center rounded-xl bg-superficie2 active:bg-superficie3">
          <Text className="text-sm font-bold text-texto">+15s</Text>
        </Pressable>
        <Pressable
          onPress={() => void encerrar(false)}
          accessibilityLabel="Pular descanso"
          style={{ minHeight: 40, minWidth: 44 }}
          className="items-center justify-center rounded-xl bg-superficie2 active:bg-superficie3">
          <Ionicons name="play-skip-forward" size={18} color={cores.texto} />
        </Pressable>
      </View>
    </View>
  );
}
