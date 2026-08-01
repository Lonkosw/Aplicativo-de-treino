import { Text, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { cores } from '@/constants/tema';

export type BarraGrafico = { valor: number; rotulo: string };

export function GraficoBarras({
  barras,
  altura = 180,
}: {
  barras: BarraGrafico[];
  altura?: number;
}) {
  const { width } = useWindowDimensions();
  const larguraGrafico = Math.max(240, width - 96);

  if (barras.every((b) => b.valor === 0)) {
    return (
      <View style={{ height: altura }} className="items-center justify-center">
        <Text className="text-sm text-texto3">Sem treinos registrados neste período.</Text>
      </View>
    );
  }

  const maximo = Math.max(...barras.map((b) => b.valor));
  const largura = Math.max(14, Math.min(30, larguraGrafico / (barras.length * 2)));

  return (
    <BarChart
      data={barras.map((b) => ({
        value: b.valor,
        label: b.rotulo,
        // A barra da semana com maior volume ganha o tom de destaque.
        frontColor: b.valor === maximo ? cores.destaque : cores.superficie3,
      }))}
      width={larguraGrafico}
      height={altura}
      barWidth={largura}
      spacing={largura * 0.8}
      initialSpacing={12}
      endSpacing={6}
      barBorderRadius={4}
      hideRules={false}
      rulesColor={cores.borda}
      rulesType="solid"
      yAxisColor={cores.borda}
      xAxisColor={cores.borda}
      yAxisTextStyle={{ color: cores.texto3, fontSize: 10 }}
      xAxisLabelTextStyle={{ color: cores.texto3, fontSize: 9 }}
      noOfSections={4}
      maxValue={Math.ceil((maximo * 1.15) / 100) * 100 || 100}
      backgroundColor="transparent"
    />
  );
}

/** Lista de barras proporcionais — mais legível que pizza para comparar grupos. */
export function BarrasProporcionais({
  itens,
  formatarValor,
}: {
  itens: { rotulo: string; valor: number }[];
  formatarValor: (v: number) => string;
}) {
  if (itens.length === 0) {
    return <Text className="text-sm text-texto3">Sem volume registrado neste período.</Text>;
  }

  const maximo = Math.max(...itens.map((i) => i.valor));

  return (
    <View className="gap-2.5">
      {itens.map((i, indice) => (
        <View key={i.rotulo} className="gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-semibold text-texto" numberOfLines={1}>
              {i.rotulo}
            </Text>
            <Text className="text-[12px] font-medium text-texto3">{formatarValor(i.valor)}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-superficie2">
            <View
              style={{ width: `${Math.max(3, (i.valor / maximo) * 100)}%` }}
              className={`h-2 rounded-full ${indice === 0 ? 'bg-destaque' : 'bg-superficie3'}`}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
