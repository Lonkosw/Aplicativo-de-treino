import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, ScrollView, Text, View } from 'react-native';

import { Cartao, EstadoVazio, Metrica, Separador } from '@/components/ui/basicos';
import { Botao } from '@/components/ui/botao';
import { Tela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import { detalheDoTreino, type DetalheTreino } from '@/db/consultas/treinos';
import { ROTULO_RECORDE } from '@/lib/calculos';
import * as fmt from '@/lib/formato';
import { usarTreinoAtivo } from '@/store/treino-ativo';

export default function TelaResumo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const treinoId = Number(id);
  const router = useRouter();

  // Lido antes de limpar a sessão: é a única fonte de "quais recordes
  // foram batidos AGORA" — o banco só sabe o estado final.
  const recordesDaSessao = usarTreinoAtivo((s) => s.recordesDaSessao);
  const limparSessao = usarTreinoAtivo((s) => s.limparSessao);

  const [detalhe, setDetalhe] = useState<DetalheTreino | null>(null);
  const [recordes] = useState(recordesDaSessao);

  useEffect(() => {
    let ativo = true;
    detalheDoTreino(treinoId).then((d) => ativo && setDetalhe(d));
    return () => {
      ativo = false;
    };
  }, [treinoId]);

  function sair() {
    limparSessao();
    router.replace('/');
  }

  // O botão físico de voltar do Android não pode devolver para o treino já
  // finalizado — não existe equivalente disso na web.
  useEffect(() => {
    const inscricao = BackHandler.addEventListener('hardwareBackPress', () => {
      sair();
      return true;
    });
    return () => inscricao.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!detalhe) return <Tela />;

  const recordesBatidos = detalhe.exercicios.flatMap((ex) =>
    ex.series
      .filter((s) => recordes[s.id]?.length)
      .map((s) => ({
        exercicio: ex.nome,
        serie: s,
        tipos: recordes[s.id],
      })),
  );

  return (
    <Tela edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 18 }}>
        <View className="items-center gap-1 pt-6">
          <Ionicons name="checkmark-circle" size={52} color={cores.destaqueTexto} />
          <Text className="text-[26px] font-extrabold text-texto">Treino concluído</Text>
          <Text className="text-[14px] text-texto3">{detalhe.treino.nome}</Text>
        </View>

        <Cartao className="p-4">
          <View className="flex-row">
            <Metrica valor={fmt.duracaoCurta(detalhe.treino.duracaoSegundos)} rotulo="Duração" />
            <Metrica valor={fmt.volumeCompacto(detalhe.volume)} rotulo="Volume" destaque />
            <Metrica valor={String(detalhe.totalSeries)} rotulo="Séries" />
          </View>
        </Cartao>

        {recordesBatidos.length > 0 ? (
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-wider text-destaqueTexto">
              Recordes pessoais batidos
            </Text>
            {recordesBatidos.map(({ exercicio, serie, tipos }) => (
              <View
                key={serie.id}
                className="flex-row items-center gap-3 rounded-2xl border border-destaque/40 bg-destaqueFundo p-3">
                <Ionicons name="trophy" size={20} color={cores.destaqueTexto} />
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-texto" numberOfLines={1}>
                    {exercicio}
                  </Text>
                  <Text className="text-[12px] font-semibold text-destaqueTexto">
                    {tipos.map((t) => ROTULO_RECORDE[t]).join(' · ')}
                  </Text>
                </View>
                <Text className="text-numero text-texto">
                  {fmt.peso(serie.peso)} × {serie.repeticoes}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="gap-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-texto3">Exercícios</Text>
          {detalhe.exercicios.length === 0 ? (
            <EstadoVazio icone="barbell" titulo="Nenhuma série registrada" />
          ) : (
            detalhe.exercicios.map((ex) => (
              <Cartao key={ex.id} className="p-4">
                <Text className="text-[15px] font-bold text-texto" numberOfLines={1}>
                  {ex.nome}
                </Text>
                <View className="my-2">
                  <Separador />
                </View>
                <View className="gap-1">
                  {ex.series.map((s) => (
                    <View key={s.id} className="flex-row items-center gap-3">
                      <Text className="w-5 text-[13px] font-bold text-texto3">
                        {s.tipo === 'aquecimento' ? 'A' : s.numeroSerie}
                      </Text>
                      <Text className="text-[15px] font-bold text-texto">
                        {fmt.peso(s.peso)} kg × {s.repeticoes}
                      </Text>
                      {recordes[s.id]?.length ? (
                        <Ionicons name="trophy" size={13} color={cores.destaqueTexto} />
                      ) : null}
                    </View>
                  ))}
                </View>
              </Cartao>
            ))
          )}
        </View>
      </ScrollView>

      <View className="border-t border-borda p-5">
        <Botao titulo="Concluir" tamanho="grande" aoTocar={sair} />
      </View>
    </Tela>
  );
}
