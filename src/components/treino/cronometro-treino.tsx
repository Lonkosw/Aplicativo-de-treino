import { useEffect, useState } from 'react';
import { AppState, Text } from 'react-native';

import * as fmt from '@/lib/formato';

/**
 * O cronômetro é derivado de `iniciadoEm`, nunca de um contador acumulado.
 * O Android congela `setInterval` quando o app vai para segundo plano — se
 * o tempo fosse somado a cada tick, ele atrasaria. Recalculando a partir do
 * timestamp, voltar do background já mostra o valor certo.
 */
export function CronometroTreino({ iniciadoEm }: { iniciadoEm: Date }) {
  const [segundos, setSegundos] = useState(() =>
    Math.max(0, Math.floor((Date.now() - iniciadoEm.getTime()) / 1000)),
  );

  useEffect(() => {
    const recalcular = () =>
      setSegundos(Math.max(0, Math.floor((Date.now() - iniciadoEm.getTime()) / 1000)));

    recalcular();
    const intervalo = setInterval(recalcular, 1000);
    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') recalcular();
    });

    return () => {
      clearInterval(intervalo);
      inscricao.remove();
    };
  }, [iniciadoEm]);

  return <Text className="text-[15px] font-bold tabular-nums text-texto2">{fmt.cronometro(segundos)}</Text>;
}
