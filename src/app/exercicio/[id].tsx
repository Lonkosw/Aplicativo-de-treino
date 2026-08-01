import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { CabecalhoPilha } from '@/components/cabecalho-pilha';
import { GraficoLinha, type PontoGrafico } from '@/components/grafico-linha';
import { Cartao, EstadoVazio, Etiqueta, Metrica, Separador } from '@/components/ui/basicos';
import { BotaoIcone } from '@/components/ui/botao';
import { Tela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import {
  atualizarDescanso,
  contarUsoEmTreinos,
  excluirExercicio,
  historicoDoExercicio,
  obterExercicio,
  recordesDoExercicio,
  type ItemHistorico,
} from '@/db/consultas/exercicios';
import { progressaoDoExercicio, type PontoProgressao } from '@/db/consultas/estatisticas';
import type { Exercicio } from '@/db/schema';
import { RECORDES_ZERADOS, type Recordes } from '@/lib/calculos';
import * as fmt from '@/lib/formato';

type Metrica3 = 'peso' | '1rm' | 'volume';

const ROTULO_METRICA: Record<Metrica3, string> = {
  peso: 'Peso máximo',
  '1rm': '1RM estimado',
  volume: 'Volume no treino',
};

const OPCOES_DESCANSO = [0, 60, 90, 120, 150, 180, 240];

export default function TelaExercicio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercicioId = Number(id);
  const router = useRouter();

  const [exercicio, setExercicio] = useState<Exercicio | null>(null);
  const [recordes, setRecordes] = useState<Recordes>(RECORDES_ZERADOS);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [progressao, setProgressao] = useState<PontoProgressao[]>([]);
  const [metrica, setMetrica] = useState<Metrica3>('peso');
  const [carregando, setCarregando] = useState(true);

  // `useFocusEffect` e não `useEffect`: ao voltar de um treino, a tela já
  // está montada e precisa recarregar. Não há "route change" como na web.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        const [ex, pr, hist, prog] = await Promise.all([
          obterExercicio(exercicioId),
          recordesDoExercicio(exercicioId),
          historicoDoExercicio(exercicioId),
          progressaoDoExercicio(exercicioId),
        ]);
        if (!ativo) return;
        setExercicio(ex);
        setRecordes(pr);
        setHistorico(hist);
        setProgressao(prog);
        setCarregando(false);
      })();
      return () => {
        ativo = false;
      };
    }, [exercicioId]),
  );

  const pontos: PontoGrafico[] = progressao.map((p) => ({
    rotulo: fmt.dataCurta(p.data),
    valor:
      metrica === 'peso'
        ? Math.round(p.melhorPeso * 10) / 10
        : metrica === '1rm'
          ? Math.round(p.melhor1RM * 10) / 10
          : Math.round(p.volume),
  }));

  async function trocarDescanso(segundos: number) {
    if (!exercicio) return;
    await atualizarDescanso(exercicio.id, segundos);
    setExercicio({ ...exercicio, descansoSegundos: segundos });
  }

  function confirmarExclusao() {
    if (!exercicio) return;
    void (async () => {
      const usos = await contarUsoEmTreinos(exercicio.id);
      Alert.alert(
        'Excluir exercício',
        usos > 0
          ? `Este exercício aparece em ${fmt.plural(usos, 'treino', 'treinos')} do seu histórico. Excluir também apaga esses registros. Essa ação não pode ser desfeita.`
          : 'Essa ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              await excluirExercicio(exercicio.id);
              router.back();
            },
          },
        ],
      );
    })();
  }

  if (carregando) return <Tela />;

  if (!exercicio) {
    return (
      <Tela>
        <CabecalhoPilha titulo="Exercício" />
        <EstadoVazio icone="alert-circle" titulo="Exercício não encontrado" />
      </Tela>
    );
  }

  return (
    <Tela>
      <CabecalhoPilha
        titulo={exercicio.nome}
        subtitulo={`${exercicio.grupoMuscularPrimario} · ${exercicio.equipamento}`}
        acao={
          exercicio.ehCustomizado ? (
            <BotaoIcone
              icone="trash"
              cor={cores.destaque}
              acessibilidade="Excluir exercício"
              aoTocar={confirmarExclusao}
            />
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 20 }}>
        {/* Recordes pessoais */}
        <Cartao className="p-4">
          <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-texto3">
            Recordes pessoais
          </Text>
          {recordes.maiorPeso > 0 ? (
            <View className="flex-row">
              <Metrica valor={`${fmt.peso(recordes.maiorPeso)} kg`} rotulo="Peso máx." destaque />
              <Metrica valor={`${fmt.peso(recordes.maior1RM)} kg`} rotulo="1RM est." />
              <Metrica valor={fmt.volumeCompacto(recordes.maiorVolumeSerie)} rotulo="Vol. série" />
            </View>
          ) : (
            <Text className="text-sm text-texto3">
              Nenhuma série registrada ainda. Os recordes aparecem depois do primeiro treino.
            </Text>
          )}
        </Cartao>

        {/* Progressão */}
        <Cartao className="p-4">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-wider text-texto3">Progressão</Text>
          </View>
          <View className="mb-3 flex-row gap-2">
            {(Object.keys(ROTULO_METRICA) as Metrica3[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMetrica(m)}
                style={{ minHeight: 34 }}
                className={`justify-center rounded-lg px-3 ${
                  metrica === m ? 'bg-destaqueFundo' : 'bg-superficie2'
                }`}>
                <Text
                  className={`text-xs font-semibold ${metrica === m ? 'text-destaque' : 'text-texto3'}`}>
                  {ROTULO_METRICA[m]}
                </Text>
              </Pressable>
            ))}
          </View>
          <GraficoLinha pontos={pontos} sufixo={metrica === 'volume' ? '' : ''} />
        </Cartao>

        {/* Descanso padrão */}
        <Cartao className="p-4">
          <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-texto3">
            Descanso padrão
          </Text>
          <Text className="mb-3 text-[13px] text-texto3">
            Disparado automaticamente ao concluir uma série deste exercício.
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {OPCOES_DESCANSO.map((s) => (
              <Pressable
                key={s}
                onPress={() => void trocarDescanso(s)}
                style={{ minHeight: 40, minWidth: 62 }}
                className={`items-center justify-center rounded-xl border ${
                  exercicio.descansoSegundos === s
                    ? 'border-destaque bg-destaqueFundo'
                    : 'border-borda bg-superficie2'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    exercicio.descansoSegundos === s ? 'text-destaque' : 'text-texto2'
                  }`}>
                  {s === 0 ? 'Off' : fmt.cronometro(s)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Cartao>

        {exercicio.instrucoes ? (
          <Cartao className="p-4">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-texto3">Instruções</Text>
            <Text className="text-[14px] leading-5 text-texto2">{exercicio.instrucoes}</Text>
          </Cartao>
        ) : null}

        {/* Histórico */}
        <View className="gap-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-texto3">
            Histórico de cargas
          </Text>
          {historico.length === 0 ? (
            <Cartao className="p-4">
              <Text className="text-sm text-texto3">Você ainda não registrou este exercício.</Text>
            </Cartao>
          ) : (
            historico.map((h) => (
              <Cartao key={h.treinoId} className="p-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-[13px] font-semibold text-texto2">{fmt.dataRelativa(h.data)}</Text>
                  <Etiqueta>{fmt.volumeCompacto(h.volume)}</Etiqueta>
                </View>
                <Separador />
                <View className="mt-2 gap-1">
                  {h.series.map((s) => (
                    <View key={s.numeroSerie} className="flex-row items-center gap-3">
                      <Text className="w-5 text-[13px] font-bold text-texto3">{s.numeroSerie}</Text>
                      <Text className="text-[15px] font-bold text-texto">
                        {fmt.peso(s.peso)} kg × {s.repeticoes}
                      </Text>
                      {s.tipo !== 'normal' ? (
                        <Ionicons
                          name={s.tipo === 'aquecimento' ? 'flame-outline' : 'flash-outline'}
                          size={13}
                          color={cores.texto3}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
              </Cartao>
            ))
          )}
        </View>
      </ScrollView>
    </Tela>
  );
}
