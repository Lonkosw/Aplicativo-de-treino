import { Ionicons } from '@expo/vector-icons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Cartao, Etiqueta, Metrica } from '@/components/ui/basicos';
import { Botao } from '@/components/ui/botao';
import { Secao, Tela, TituloTela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import { resumoDaSemana, type ResumoPeriodo } from '@/db/consultas/estatisticas';
import { queryRotinas } from '@/db/consultas/rotinas';
import {
  iniciarTreinoDeRotina,
  iniciarTreinoVazio,
  queryHistoricoTreinos,
  queryTreinoAtivo,
} from '@/db/consultas/treinos';
import * as fmt from '@/lib/formato';

const RESUMO_VAZIO: ResumoPeriodo = { treinos: 0, volume: 0, segundos: 0, series: 0 };

export default function TelaInicio() {
  const router = useRouter();
  const { data: ativos } = useLiveQuery(queryTreinoAtivo());
  const { data: rotinas } = useLiveQuery(queryRotinas());
  const { data: historico } = useLiveQuery(queryHistoricoTreinos(5));

  const [semana, setSemana] = useState<ResumoPeriodo>(RESUMO_VAZIO);

  // Agregações não passam pelo useLiveQuery (são várias consultas), então
  // recarregam sempre que a aba ganha foco — inclusive ao voltar de um treino.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      resumoDaSemana().then((r) => ativo && setSemana(r));
      return () => {
        ativo = false;
      };
    }, [historico]),
  );

  const treinoAtivo = ativos?.[0] ?? null;

  async function comecarVazio() {
    if (treinoAtivo) {
      router.push('/treino/ativo');
      return;
    }
    await iniciarTreinoVazio();
    router.push('/treino/ativo');
  }

  async function comecarRotina(rotinaId: number) {
    if (treinoAtivo) {
      router.push('/treino/ativo');
      return;
    }
    await iniciarTreinoDeRotina(rotinaId);
    router.push('/treino/ativo');
  }

  return (
    <Tela>
      <ScrollView contentContainerStyle={{ paddingBottom: 32, gap: 22 }}>
        <TituloTela>Início</TituloTela>

        {/* Treino em andamento tem precedência sobre tudo */}
        {treinoAtivo ? (
          <View className="px-5">
            <Pressable
              onPress={() => router.push('/treino/ativo')}
              className="flex-row items-center gap-3 rounded-2xl border border-destaque bg-destaqueFundo p-4 active:bg-destaqueEscuro">
              <Ionicons name="fitness" size={26} color={cores.destaque} />
              <View className="flex-1">
                <Text className="text-[16px] font-bold text-texto">{treinoAtivo.nome}</Text>
                <Text className="text-[13px] text-destaque">
                  Treino em andamento · começou {fmt.dataRelativa(treinoAtivo.iniciadoEm).toLowerCase()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={cores.destaque} />
            </Pressable>
          </View>
        ) : (
          <View className="px-5">
            <Botao
              titulo="Iniciar treino vazio"
              icone="play"
              tamanho="grande"
              aoTocar={() => void comecarVazio()}
            />
          </View>
        )}

        {/* Resumo da semana */}
        <View className="px-5">
          <Cartao className="p-4">
            <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-texto3">
              Esta semana
            </Text>
            <View className="flex-row">
              <Metrica valor={String(semana.treinos)} rotulo="Treinos" destaque={semana.treinos > 0} />
              <Metrica valor={fmt.volumeCompacto(semana.volume)} rotulo="Volume" />
              <Metrica valor={fmt.duracaoCurta(semana.segundos)} rotulo="Tempo" />
            </View>
          </Cartao>
        </View>

        {/* Rotinas para começar com um toque */}
        <Secao
          titulo="Começar uma rotina"
          acao={
            <Pressable onPress={() => router.push('/rotinas')} hitSlop={8}>
              <Text className="text-[13px] font-bold text-destaque">Ver todas</Text>
            </Pressable>
          }>
          {rotinas?.length ? (
            <View className="gap-2 px-5">
              {rotinas.slice(0, 4).map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => void comecarRotina(r.id)}
                  disabled={r.totalExercicios === 0}
                  style={{ minHeight: 60 }}
                  className={`flex-row items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 active:bg-superficie2 ${
                    r.totalExercicios === 0 ? 'opacity-50' : ''
                  }`}>
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-superficie2">
                    <Ionicons name="play" size={16} color={cores.destaque} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-texto" numberOfLines={1}>
                      {r.nome}
                    </Text>
                    <Text className="text-[12px] text-texto3">
                      {fmt.plural(r.totalExercicios, 'exercício', 'exercícios')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="px-5">
              <Cartao className="gap-3 p-4">
                <Text className="text-[14px] text-texto2">
                  Você ainda não tem rotinas. Crie uma para repetir o mesmo treino com um toque.
                </Text>
                <Botao
                  titulo="Criar rotina"
                  variante="secundario"
                  icone="add"
                  aoTocar={() => router.push('/rotinas')}
                />
              </Cartao>
            </View>
          )}
        </Secao>

        {/* Últimos treinos */}
        {historico?.length ? (
          <Secao titulo="Últimos treinos">
            <View className="gap-2 px-5">
              {historico.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => router.push(`/treino/${t.id}`)}
                  style={{ minHeight: 60 }}
                  className="flex-row items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 active:bg-superficie2">
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-texto" numberOfLines={1}>
                      {t.nome}
                    </Text>
                    <Text className="text-[12px] text-texto3">
                      {fmt.dataRelativa(t.iniciadoEm)} · {fmt.duracaoCurta(t.duracaoSegundos)} ·{' '}
                      {fmt.plural(t.totalSeries, 'série', 'séries')}
                    </Text>
                  </View>
                  <Etiqueta>{fmt.volumeCompacto(t.volume)}</Etiqueta>
                </Pressable>
              ))}
            </View>
          </Secao>
        ) : null}
      </ScrollView>
    </Tela>
  );
}
