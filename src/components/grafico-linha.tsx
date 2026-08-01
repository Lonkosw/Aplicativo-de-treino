import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { cores } from '@/constants/tema';

export type PontoGrafico = { valor: number; rotulo: string };

/**
 * Gráficos precisam de largura em pixels — não existe `width: 100%` que o
 * SVG entenda sozinho. `useWindowDimensions` reage a rotação da tela.
 */
export function GraficoLinha({
  pontos,
  altura = 180,
}: {
  pontos: PontoGrafico[];
  altura?: number;
}) {
  const { width } = useWindowDimensions();
  const larguraGrafico = Math.max(240, width - 96);

  const dados = useMemo(
    () =>
      pontos.map((p, i) => ({
        value: p.valor,
        // Com muitos pontos, só alguns rótulos cabem no eixo.
        label: pontos.length <= 6 || i % Math.ceil(pontos.length / 5) === 0 ? p.rotulo : '',
      })),
    [pontos],
  );

  if (pontos.length < 2) {
    return (
      <View style={{ height: altura }} className="items-center justify-center">
        <Text className="text-sm text-texto3">Registre ao menos dois treinos para ver o gráfico.</Text>
      </View>
    );
  }

  const maximo = Math.max(...pontos.map((p) => p.valor));

  return (
    <LineChart
      data={dados}
      width={larguraGrafico}
      height={altura}
      initialSpacing={12}
      endSpacing={12}
      spacing={Math.max(28, larguraGrafico / Math.max(pontos.length, 2))}
      color={cores.destaque}
      thickness={2.5}
      dataPointsColor={cores.destaque}
      dataPointsRadius={3.5}
      hideRules={false}
      rulesColor={cores.borda}
      rulesType="solid"
      yAxisColor={cores.borda}
      xAxisColor={cores.borda}
      yAxisTextStyle={{ color: cores.texto3, fontSize: 10 }}
      xAxisLabelTextStyle={{ color: cores.texto3, fontSize: 10 }}
      noOfSections={4}
      maxValue={Math.ceil((maximo * 1.15) / 5) * 5 || 10}
      backgroundColor="transparent"
      curved
    />
  );
}
