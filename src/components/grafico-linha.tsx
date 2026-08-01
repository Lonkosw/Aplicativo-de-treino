import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { cores } from '@/constants/tema';
import * as fmt from '@/lib/formato';

export type PontoGrafico = { valor: number; rotulo: string };

/** Espaço que o eixo Y ocupa FORA da área de plotagem. */
const LARGURA_EIXO_Y = 42;
/** Recuo do cartão: 20 de padding da tela × 2 + 16 do cartão × 2. */
const RECUO_CARTAO = 72;

/**
 * Progressão de um exercício ao longo dos treinos — uma série só, então
 * não leva legenda: o seletor acima do gráfico já diz o que está plotado.
 */
export function GraficoLinha({
  pontos,
  sufixo = '',
  altura = 180,
}: {
  pontos: PontoGrafico[];
  /** Unidade escrita no rótulo do último ponto. */
  sufixo?: string;
  altura?: number;
}) {
  const { width } = useWindowDimensions();
  // Gráficos precisam de largura em pixels — não existe `width: 100%` que o
  // SVG entenda sozinho. O eixo Y é desenhado FORA desta largura, então
  // precisa ser descontado, senão o gráfico vaza para fora do cartão.
  const larguraPlot = Math.max(180, width - RECUO_CARTAO - LARGURA_EIXO_Y);

  const { dados, minimo, maximo } = useMemo(() => {
    const valores = pontos.map((p) => p.valor);
    const min = valores.length ? Math.min(...valores) : 0;
    const max = valores.length ? Math.max(...valores) : 0;

    // Rotula no máximo 5 datas, sempre incluindo a última — é a referência
    // temporal que se procura primeiro.
    const passo = Math.max(1, Math.ceil(pontos.length / 5));
    const ultimo = pontos.length - 1;

    return {
      minimo: min,
      maximo: max,
      dados: pontos.map((p, i) => ({
        value: p.valor,
        label: i === ultimo || (ultimo - i) % passo === 0 ? p.rotulo : '',
        // Só o ponto final leva valor escrito. Um número em cada ponto vira
        // ruído e ninguém lê.
        dataPointLabelComponent:
          i === ultimo
            ? () => (
                <View className="rounded-md bg-superficie3 px-1.5 py-0.5">
                  <Text className="text-[11px] font-bold text-texto">
                    {fmt.peso(p.valor)}
                    {sufixo}
                  </Text>
                </View>
              )
            : undefined,
        dataPointLabelShiftY: -22,
        dataPointLabelShiftX: i === ultimo ? -16 : 0,
      })),
    };
  }, [pontos, sufixo]);

  if (pontos.length < 2) {
    return (
      <View style={{ height: altura }} className="items-center justify-center px-4">
        <Text className="text-center text-sm text-texto2">
          Registre este exercício em pelo menos dois treinos para ver a progressão.
        </Text>
      </View>
    );
  }

  /**
   * A base do eixo NÃO é zero, de propósito.
   *
   * Numa barra o comprimento codifica a magnitude e o zero é obrigatório.
   * Aqui a linha codifica um nível: começando em zero, uma evolução de 80
   * para 85 kg vira uma reta achatada no topo e o gráfico não mostra nada.
   * A escala acompanha a faixa dos dados, com folga dos dois lados.
   */
  const faixa = Math.max(maximo - minimo, maximo * 0.1, 1);
  const base = Math.max(0, Math.floor((minimo - faixa * 0.25) / 5) * 5);
  const topo = Math.ceil((maximo + faixa * 0.25) / 5) * 5;

  return (
    <LineChart
      data={dados}
      width={larguraPlot}
      height={altura}
      initialSpacing={16}
      endSpacing={16}
      spacing={Math.max(24, (larguraPlot - 32) / Math.max(pontos.length - 1, 1))}
      color={cores.destaque}
      thickness={2}
      // Marcador de 8px (raio 4) com anel de 2px na cor da superfície: o
      // ponto continua legível onde a linha passa por trás dele.
      dataPointsColor={cores.destaque}
      dataPointsRadius={4}
      dataPointsWidth={2}
      // Sem `curved`: a curva inventaria valores entre dois treinos que
      // simplesmente não aconteceram.
      hideRules={false}
      rulesColor={cores.borda}
      rulesType="solid"
      yAxisColor={cores.borda}
      xAxisColor={cores.borda}
      yAxisLabelWidth={LARGURA_EIXO_Y}
      yAxisTextStyle={{ color: cores.texto2, fontSize: 10 }}
      xAxisLabelTextStyle={{ color: cores.texto2, fontSize: 10 }}
      noOfSections={4}
      yAxisOffset={base}
      maxValue={topo - base}
      formatYLabel={(v) => fmt.eixoNumero(Number(v))}
      backgroundColor="transparent"
    />
  );
}
