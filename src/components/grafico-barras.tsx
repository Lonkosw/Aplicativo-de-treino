import { Text, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { cores } from '@/constants/tema';
import * as fmt from '@/lib/formato';

export type BarraGrafico = { valor: number; rotulo: string };

const LARGURA_EIXO_Y = 42;
const RECUO_CARTAO = 72;

/**
 * Volume por semana. Uma série só, com a semana corrente destacada.
 *
 * O destaque segue a ENTIDADE ("esta semana"), não o ranking. Colorir a
 * maior barra parece esperto mas repinta o gráfico toda vez que um treino
 * novo muda quem é o máximo — quem olha nunca aprende o que o vermelho
 * significa.
 */
export function GraficoBarras({ barras, altura = 180 }: { barras: BarraGrafico[]; altura?: number }) {
  const { width } = useWindowDimensions();
  const larguraPlot = Math.max(180, width - RECUO_CARTAO - LARGURA_EIXO_Y);

  if (barras.length === 0 || barras.every((b) => b.valor === 0)) {
    return (
      <View style={{ height: altura }} className="items-center justify-center px-4">
        <Text className="text-center text-sm text-texto2">
          Sem treinos registrados neste período.
        </Text>
      </View>
    );
  }

  const maximo = Math.max(...barras.map((b) => b.valor));
  const ultima = barras.length - 1;

  // Barra fina com ar de sobra: no máximo 24dp, e o espaço entre elas sai do
  // que restar da faixa disponível.
  const faixa = (larguraPlot - 24) / barras.length;
  const largura = Math.max(10, Math.min(24, faixa * 0.6));

  return (
    <BarChart
      data={barras.map((b, i) => ({
        value: b.valor,
        label: b.rotulo,
        frontColor: i === ultima ? cores.destaque : cores.graficoRecessivo,
      }))}
      width={larguraPlot}
      height={altura}
      barWidth={largura}
      spacing={Math.max(6, faixa - largura)}
      initialSpacing={12}
      endSpacing={8}
      // Topo arredondado, base reta: a barra nasce da linha de base.
      barBorderTopLeftRadius={4}
      barBorderTopRightRadius={4}
      hideRules={false}
      rulesColor={cores.borda}
      rulesType="solid"
      yAxisColor={cores.borda}
      xAxisColor={cores.borda}
      yAxisLabelWidth={LARGURA_EIXO_Y}
      yAxisTextStyle={{ color: cores.texto2, fontSize: 10 }}
      xAxisLabelTextStyle={{ color: cores.texto2, fontSize: 9 }}
      noOfSections={4}
      maxValue={Math.ceil((maximo * 1.15) / 500) * 500 || 500}
      // "12.500" não cabe num eixo de 42dp; "12,5k" cabe.
      formatYLabel={(v) => fmt.eixoNumero(Number(v))}
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
    return <Text className="text-sm text-texto2">Sem volume registrado neste período.</Text>;
  }

  const maximo = Math.max(...itens.map((i) => i.valor));

  return (
    <View className="gap-2.5">
      {itens.map((i, indice) => (
        <View
          key={i.rotulo}
          className="gap-1"
          accessibilityRole="text"
          accessibilityLabel={`${i.rotulo}: ${formatarValor(i.valor)}`}>
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-[13px] font-semibold text-texto" numberOfLines={1}>
              {i.rotulo}
            </Text>
            <Text className="text-[12px] font-medium text-texto2">{formatarValor(i.valor)}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-superficie2">
            <View
              style={{ width: `${Math.max(3, (i.valor / maximo) * 100)}%` }}
              className={`h-2 rounded-full ${indice === 0 ? 'bg-destaque' : 'bg-graficoRecessivo'}`}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
