import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { CabecalhoPilha } from '@/components/cabecalho-pilha';
import { CampoTexto, Chip } from '@/components/ui/basicos';
import { Botao } from '@/components/ui/botao';
import { Tela } from '@/components/ui/tela';
import { criarExercicio, queryEquipamentos, queryGruposMusculares } from '@/db/consultas/exercicios';

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

export default function TelaNovoExercicio() {
  const router = useRouter();
  const { data: grupos } = useLiveQuery(queryGruposMusculares());
  const { data: equipamentos } = useLiveQuery(queryEquipamentos());

  const [nome, setNome] = useState('');
  const [grupo, setGrupo] = useState<string | null>(null);
  const [equipamento, setEquipamento] = useState<string | null>(null);
  const [instrucoes, setInstrucoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  const podeSalvar = nome.trim().length > 0 && !!grupo && !!equipamento;

  async function salvar() {
    if (!grupo || !equipamento || !nome.trim() || salvando) return;
    setSalvando(true);
    try {
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

  return (
    <Tela edges={['top', 'bottom']}>
      <CabecalhoPilha titulo="Novo exercício" />
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
        <Botao titulo="Salvar exercício" aoTocar={salvar} desabilitado={!podeSalvar} carregando={salvando} />
      </View>
    </Tela>
  );
}
