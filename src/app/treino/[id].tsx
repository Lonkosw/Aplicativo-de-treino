import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { CabecalhoPilha } from '@/components/cabecalho-pilha';
import { Cartao, EstadoVazio, Metrica, Separador } from '@/components/ui/basicos';
import { BotaoIcone } from '@/components/ui/botao';
import { MenuOpcoes } from '@/components/ui/menu-opcoes';
import { ModalTexto } from '@/components/ui/modal-texto';
import { Tela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import {
  atualizarNotasDoTreino,
  corrigirDuracao,
  detalheDoTreino,
  excluirTreino,
  renomearTreino,
  type DetalheTreino,
} from '@/db/consultas/treinos';
import * as fmt from '@/lib/formato';

export default function TelaDetalheTreino() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const treinoId = Number(id);
  const router = useRouter();

  const [detalhe, setDetalhe] = useState<DetalheTreino | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);
  const [editando, setEditando] = useState<'nome' | 'duracao' | 'notas' | null>(null);

  const recarregar = useCallback(async () => {
    const d = await detalheDoTreino(treinoId);
    setDetalhe(d);
    setCarregando(false);
  }, [treinoId]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

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
            icone="ellipsis-horizontal"
            acessibilidade="Opções do treino"
            aoTocar={() => setMenuAberto(true)}
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
              className="text-[15px] font-bold text-destaqueTexto"
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

      <MenuOpcoes
        visivel={menuAberto}
        titulo={detalhe.treino.nome}
        subtitulo={fmt.dataRelativa(detalhe.treino.iniciadoEm)}
        opcoes={[
          { rotulo: 'Renomear treino', icone: 'text-outline', aoTocar: () => setEditando('nome') },
          {
            rotulo: 'Corrigir duração',
            icone: 'time-outline',
            aoTocar: () => setEditando('duracao'),
          },
          {
            rotulo: 'Notas do treino',
            icone: 'document-text-outline',
            aoTocar: () => setEditando('notas'),
          },
          {
            rotulo: 'Excluir treino',
            icone: 'trash-outline',
            destrutiva: true,
            aoTocar: confirmarExclusao,
          },
        ]}
        aoFechar={() => setMenuAberto(false)}
      />

      <ModalTexto
        visivel={editando === 'nome'}
        titulo="Nome do treino"
        valorInicial={detalhe.treino.nome}
        multilinha={false}
        exigeTexto
        placeholder="Ex.: Push A"
        aoSalvar={async (t) => {
          await renomearTreino(treinoId, t);
          await recarregar();
        }}
        aoFechar={() => setEditando(null)}
      />

      <ModalTexto
        visivel={editando === 'duracao'}
        titulo="Duração em minutos"
        descricao="Use isto quando esquecer de finalizar o treino na hora."
        valorInicial={String(Math.round(detalhe.treino.duracaoSegundos / 60))}
        multilinha={false}
        teclado="numeric"
        exigeTexto
        placeholder="Ex.: 65"
        aoSalvar={async (t) => {
          const minutos = Number(t.replace(',', '.'));
          if (!Number.isFinite(minutos) || minutos < 0) return;
          await corrigirDuracao(treinoId, minutos);
          await recarregar();
        }}
        aoFechar={() => setEditando(null)}
      />

      <ModalTexto
        visivel={editando === 'notas'}
        titulo="Notas do treino"
        valorInicial={detalhe.treino.notas ?? ''}
        placeholder="Como foi o treino, energia, dores, o que ajustar"
        aoSalvar={async (t) => {
          await atualizarNotasDoTreino(treinoId, t);
          await recarregar();
        }}
        aoFechar={() => setEditando(null)}
      />
    </Tela>
  );
}
