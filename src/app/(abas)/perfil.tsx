import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { BarrasProporcionais, GraficoBarras } from '@/components/grafico-barras';
import { Cartao, Metrica } from '@/components/ui/basicos';
import { Botao } from '@/components/ui/botao';
import { Tela, TituloTela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import {
  totaisGerais,
  volumePorGrupoMuscular,
  volumePorSemana,
  type FatiaGrupo,
  type PontoSemana,
} from '@/db/consultas/estatisticas';
import { queryHistoricoTreinos } from '@/db/consultas/treinos';
import { escolherArquivoDeBackup, exportarBackup, restaurarBackup, validarBackup } from '@/lib/backup';
import * as fmt from '@/lib/formato';

type Totais = { treinos: number; segundos: number; volume: number; sequenciaSemanas: number };

const TOTAIS_VAZIOS: Totais = { treinos: 0, segundos: 0, volume: 0, sequenciaSemanas: 0 };

export default function TelaPerfil() {
  const router = useRouter();
  const [totais, setTotais] = useState<Totais>(TOTAIS_VAZIOS);
  const [semanas, setSemanas] = useState<PontoSemana[]>([]);
  const [grupos, setGrupos] = useState<FatiaGrupo[]>([]);
  const [ocupado, setOcupado] = useState<'exportando' | 'importando' | null>(null);

  const recarregar = useCallback(async () => {
    const [t, s, g] = await Promise.all([totaisGerais(), volumePorSemana(8), volumePorGrupoMuscular(30)]);
    setTotais(t);
    setSemanas(s);
    setGrupos(g);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void recarregar();
    }, [recarregar]),
  );

  async function exportar() {
    setOcupado('exportando');
    const resultado = await exportarBackup();
    setOcupado(null);
    if (!resultado.ok) Alert.alert('Não foi possível exportar', resultado.erro);
  }

  async function importar() {
    setOcupado('importando');
    try {
      const escolhido = await escolherArquivoDeBackup();
      if (!escolhido) return;

      let bruto: unknown;
      try {
        bruto = JSON.parse(escolhido.conteudo);
      } catch {
        Alert.alert('Arquivo inválido', 'Não foi possível ler o JSON.');
        return;
      }

      const validacao = validarBackup(bruto);
      if (!validacao.ok) {
        Alert.alert('Backup inválido', validacao.erro);
        return;
      }

      const { resumo, backup } = validacao;
      // Confirmação explícita: a restauração apaga tudo o que existe hoje.
      Alert.alert(
        'Restaurar backup?',
        `Arquivo de ${fmt.dataRelativa(new Date(resumo.geradoEm))}\n\n` +
          `${resumo.treinos} treinos · ${resumo.series} séries · ${resumo.rotinas} rotinas · ${resumo.exercicios} exercícios\n\n` +
          'TODOS os dados atuais do app serão apagados e substituídos. Não há como desfazer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Substituir tudo',
            style: 'destructive',
            onPress: async () => {
              try {
                await restaurarBackup(backup);
                await recarregar();
                Alert.alert('Backup restaurado', 'Seus dados foram substituídos com sucesso.');
              } catch (e) {
                Alert.alert(
                  'Falha na restauração',
                  e instanceof Error ? e.message : 'Erro desconhecido. Nada foi alterado.',
                );
              }
            },
          },
        ],
      );
    } finally {
      setOcupado(null);
    }
  }

  return (
    <Tela>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: 20 }}>
        <TituloTela>Perfil</TituloTela>

        <View className="px-5">
          <Cartao className="p-4">
            <View className="flex-row">
              <Metrica valor={String(totais.treinos)} rotulo="Treinos" />
              <Metrica
                valor={String(totais.sequenciaSemanas)}
                rotulo={totais.sequenciaSemanas === 1 ? 'semana' : 'semanas'}
                destaque={totais.sequenciaSemanas > 0}
              />
              <Metrica valor={fmt.duracaoCurta(totais.segundos)} rotulo="Tempo" />
            </View>
            <View className="mt-3 border-t border-borda pt-3">
              <Text className="text-center text-[13px] text-texto3">
                Volume acumulado: <Text className="font-bold text-texto">{fmt.volume(totais.volume)}</Text>
              </Text>
            </View>
          </Cartao>
        </View>

        <View className="px-5">
          <Pressable
            onPress={() => router.push('/historico')}
            accessibilityRole="button"
            accessibilityLabel="Abrir histórico completo de treinos"
            style={{ minHeight: 56 }}
            className="flex-row items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 active:bg-superficie2">
            <Ionicons name="time-outline" size={20} color={cores.texto2} />
            <Text className="flex-1 text-[15px] font-semibold text-texto">Histórico completo</Text>
            <Ionicons name="chevron-forward" size={16} color={cores.texto3} />
          </Pressable>
        </View>

        <View className="px-5">
          <Cartao className="p-4">
            <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-texto3">
              Volume por semana (8 semanas)
            </Text>
            <GraficoBarras
              barras={semanas.map((s) => ({
                valor: Math.round(s.volume),
                rotulo: fmt.dataCurta(s.inicio),
              }))}
            />
          </Cartao>
        </View>

        <View className="px-5">
          <Cartao className="p-4">
            <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-texto3">
              Volume por grupo muscular (30 dias)
            </Text>
            <BarrasProporcionais
              itens={grupos.map((g) => ({ rotulo: g.grupo, valor: g.volume }))}
              formatarValor={fmt.volumeCompacto}
            />
          </Cartao>
        </View>

        <View className="px-5">
          <Cartao className="gap-3 p-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-texto3">Backup</Text>
            <Text className="text-[13px] leading-5 text-texto2">
              Não existe nuvem: tudo fica só neste aparelho. Exporte um backup de tempos em tempos e
              guarde o arquivo em outro lugar — é a única proteção contra perder o histórico.
            </Text>
            <Botao
              titulo="Exportar backup"
              icone="share-outline"
              carregando={ocupado === 'exportando'}
              aoTocar={() => void exportar()}
            />
            <Botao
              titulo="Importar backup"
              variante="secundario"
              icone="download-outline"
              carregando={ocupado === 'importando'}
              aoTocar={() => void importar()}
            />
          </Cartao>
        </View>

      </ScrollView>
    </Tela>
  );
}
