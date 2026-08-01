import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { CabecalhoPilha } from '@/components/cabecalho-pilha';
import { CampoTexto, Chip } from '@/components/ui/basicos';
import { Botao } from '@/components/ui/botao';
import { Tela } from '@/components/ui/tela';
import {
  atualizarExercicio,
  criarExercicio,
  obterExercicio,
  queryEquipamentos,
  queryGruposMusculares,
} from '@/db/consultas/exercicios';

function SeletorChips({
  rotulo,
  opcoes,
  selecionado,
  aoSelecionar,
}: {
  rotulo: string;
  opcoes: string[];
  selecionado: string | null;
  aoSelecionar: (v: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase tracking-wider text-texto3">{rotulo}</Text>
      <View className="flex-row flex-wrap gap-2">
        {opcoes.map((o) => (
          <Chip key={o} rotulo={o} ativo={selecionado === o} aoTocar={() => aoSelecionar(o)} />
        ))}
      </View>
    </View>
  );
}

/**
 * Serve para criar E para editar: `/exercicio/novo` cria,
 * `/exercicio/novo?id=12` edita o exercício customizado 12. Duplicar a
 * tela só para mudar o botão não valeria a manutenção.
 */
export default function TelaExercicioCustomizado() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editandoId = id ? Number(id) : null;
  const router = useRouter();

  const { data: grupos } = useLiveQuery(queryGruposMusculares());
  const { data: equipamentos } = useLiveQuery(queryEquipamentos());

  const [nome, setNome] = useState('');
  const [grupo, setGrupo] = useState<string | null>(null);
  const [equipamento, setEquipamento] = useState<string | null>(null);
  const [instrucoes, setInstrucoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(editandoId !== null);

  useEffect(() => {
    if (editandoId === null) return;
    let ativo = true;
    obterExercicio(editandoId).then((ex) => {
      if (!ativo || !ex) return;
      setNome(ex.nome);
      setGrupo(ex.grupoMuscularPrimario);
      setEquipamento(ex.equipamento);
      setInstrucoes(ex.instrucoes ?? '');
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [editandoId]);

  const podeSalvar = nome.trim().length > 0 && !!grupo && !!equipamento;

  async function salvar() {
    if (!grupo || !equipamento || !nome.trim() || salvando) return;
    setSalvando(true);
    try {
      if (editandoId !== null) {
        await atualizarExercicio(editandoId, {
          nome,
          grupoMuscularPrimario: grupo,
          equipamento,
          instrucoes: instrucoes || null,
        });
        router.back();
        return;
      }
      const criado = await criarExercicio({
        nome,
        grupoMuscularPrimario: grupo,
        equipamento,
        instrucoes: instrucoes || null,
      });
      router.replace(`/exercicio/${criado.id}`);
    } catch {
      setSalvando(false);
      Alert.alert('Erro', 'Não foi possível salvar o exercício.');
    }
  }

  if (carregando) return <Tela />;

  return (
    <Tela edges={['top', 'bottom']}>
      <CabecalhoPilha titulo={editandoId !== null ? 'Editar exercício' : 'Novo exercício'} />
      {/* No Android o teclado cobre os campos de baixo; este wrapper empurra
          o conteúdo. Na web o navegador faz isso sozinho. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">
          <CampoTexto rotulo="Nome" valor={nome} aoMudar={setNome} placeholder="Ex.: Remada baixa neutra" />

          <SeletorChips
            rotulo="Grupo muscular"
            opcoes={grupos?.map((g) => g.valor) ?? []}
            selecionado={grupo}
            aoSelecionar={setGrupo}
          />

          <SeletorChips
            rotulo="Equipamento"
            opcoes={equipamentos?.map((e) => e.valor) ?? []}
            selecionado={equipamento}
            aoSelecionar={setEquipamento}
          />

          <CampoTexto
            rotulo="Instruções (opcional)"
            valor={instrucoes}
            aoMudar={setInstrucoes}
            placeholder="Notas de execução, pegada, ajuste do banco..."
            multilinha
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <View className="border-t border-borda p-5">
        <Botao
          titulo={editandoId !== null ? 'Salvar alterações' : 'Criar exercício'}
          aoTocar={salvar}
          desabilitado={!podeSalvar}
          carregando={salvando}
          tamanho="grande"
        />
        {!podeSalvar ? (
          <Text className="mt-2 text-center text-[12px] text-texto3">
            Preencha o nome, o grupo muscular e o equipamento.
          </Text>
        ) : null}
      </View>
    </Tela>
  );
}
