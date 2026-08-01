import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { CabecalhoPilha } from '@/components/cabecalho-pilha';
import { Cartao, EstadoVazio, Metrica, Separador } from '@/components/ui/basicos';
import { BotaoIcone } from '@/components/ui/botao';
import { Tela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import { detalheDoTreino, excluirTreino, type DetalheTreino } from '@/db/consultas/treinos';
import * as fmt from '@/lib/formato';

export default function TelaDetalheTreino() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const treinoId = Number(id);
  const router = useRouter();

  const [detalhe, setDetalhe] = useState<DetalheTreino | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    detalheDoTreino(treinoId).then((d) => {
      if (!ativo) return;
      setDetalhe(d);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [treinoId]);

  function confirmarExclusao() {
    Alert.alert('Excluir treino', 'Este registro sairá do seu histórico. Não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirTreino(treinoId);
          router.back();
        },
      },
    ]);
  }

  if (carregando) return <Tela />;

  if (!detalhe) {
    return (
      <Tela edges={['top', 'bottom']}>
        <CabecalhoPilha titulo="Treino" />
        <EstadoVazio icone="alert-circle" titulo="Treino não encontrado" />
      </Tela>
    );
  }

  return (
    <Tela edges={['top', 'bottom']}>
      <CabecalhoPilha
        titulo={detalhe.treino.nome}
        subtitulo={fmt.dataRelativa(detalhe.treino.iniciadoEm)}
        acao={
          <BotaoIcone
            icone="trash"
            cor={cores.destaque}
            acessibilidade="Excluir treino"
            aoTocar={confirmarExclusao}
          />
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <Cartao className="p-4">
          <View className="flex-row">
            <Metrica valor={fmt.duracaoCurta(detalhe.treino.duracaoSegundos)} rotulo="Duração" />
            <Metrica valor={fmt.volumeCompacto(detalhe.volume)} rotulo="Volume" destaque />
            <Metrica valor={String(detalhe.totalSeries)} rotulo="Séries" />
          </View>
        </Cartao>

        {detalhe.treino.notas ? (
          <Cartao className="p-4">
            <Text className="text-[14px] italic text-texto2">{detalhe.treino.notas}</Text>
          </Cartao>
        ) : null}

        {detalhe.exercicios.map((ex) => (
          <Cartao key={ex.id} className="p-4">
            <Text
              className="text-[15px] font-bold text-destaque"
              numberOfLines={1}
              onPress={() => router.push(`/exercicio/${ex.exercicioId}`)}>
              {ex.nome}
            </Text>
            {ex.notas ? <Text className="mt-1 text-[13px] italic text-texto2">{ex.notas}</Text> : null}
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
                  {s.tipo === 'falha' || s.tipo === 'dropset' ? (
                    <Ionicons name="flash-outline" size={13} color={cores.texto3} />
                  ) : null}
                </View>
              ))}
            </View>
          </Cartao>
        ))}
      </ScrollView>
    </Tela>
  );
}
