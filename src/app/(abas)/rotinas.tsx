import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

import { Cartao, EstadoVazio } from '@/components/ui/basicos';
import { Botao, BotaoIcone } from '@/components/ui/botao';
import { MenuOpcoes, type Opcao } from '@/components/ui/menu-opcoes';
import { ModalTexto } from '@/components/ui/modal-texto';
import { Tela, TituloTela } from '@/components/ui/tela';
import { cores } from '@/constants/tema';
import { criarRotina, duplicarRotina, excluirRotina, queryRotinas } from '@/db/consultas/rotinas';
import { iniciarTreinoDeRotina, obterTreinoAtivo } from '@/db/consultas/treinos';
import * as fmt from '@/lib/formato';

export default function TelaRotinas() {
  const router = useRouter();
  const { data: rotinas } = useLiveQuery(queryRotinas());
  const [menu, setMenu] = useState<{ id: number; nome: string } | null>(null);
  const [criando, setCriando] = useState(false);

  /**
   * Pede o nome ANTES de criar. Criar direto e abrir o editor deixava uma
   * "Nova rotina" vazia na lista toda vez que o + era tocado sem querer.
   */
  async function criarComNome(nome: string) {
    const criada = await criarRotina(nome);
    router.push(`/rotina/${criada.id}`);
  }

  async function comecarTreino(rotinaId: number) {
    const ativo = await obterTreinoAtivo();
    if (ativo) {
      Alert.alert(
        'Treino em andamento',
        `Você já tem "${ativo.nome}" em andamento. Finalize ou descarte antes de iniciar outro.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver treino', onPress: () => router.push('/treino/ativo') },
        ],
      );
      return;
    }
    await iniciarTreinoDeRotina(rotinaId);
    router.push('/treino/ativo');
  }

  const opcoesDoMenu: Opcao[] = menu
    ? [
        { rotulo: 'Editar', icone: 'create-outline', aoTocar: () => router.push(`/rotina/${menu.id}`) },
        { rotulo: 'Duplicar', icone: 'copy-outline', aoTocar: () => void duplicarRotina(menu.id) },
        {
          rotulo: 'Excluir',
          icone: 'trash-outline',
          destrutiva: true,
          aoTocar: () =>
            Alert.alert(
              'Excluir rotina',
              `"${menu.nome}" será removida. O histórico de treinos é mantido.`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: () => void excluirRotina(menu.id) },
              ],
            ),
        },
      ]
    : [];

  return (
    <Tela>
      <TituloTela
        acao={
          <BotaoIcone
            icone="add"
            cor={cores.destaqueTexto}
            tamanho={26}
            acessibilidade="Nova rotina"
            aoTocar={() => setCriando(true)}
          />
        }>
        Rotinas
      </TituloTela>

      <FlatList
        data={rotinas ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 12, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Cartao className="p-4">
            <View className="flex-row items-start gap-2">
              <View className="flex-1">
                <Text className="text-[17px] font-bold text-texto" numberOfLines={1}>
                  {item.nome}
                </Text>
                <Text className="mt-0.5 text-[13px] text-texto3">
                  {fmt.plural(item.totalExercicios, 'exercício', 'exercícios')}
                </Text>
                {item.notas ? (
                  <Text className="mt-1 text-[13px] text-texto2" numberOfLines={2}>
                    {item.notas}
                  </Text>
                ) : null}
              </View>
              <BotaoIcone
                icone="ellipsis-horizontal"
                acessibilidade="Opções da rotina"
                aoTocar={() => setMenu({ id: item.id, nome: item.nome })}
              />
            </View>

            <View className="mt-3 flex-row gap-2">
              <Botao
                titulo="Iniciar treino"
                icone="play"
                className="flex-1"
                desabilitado={item.totalExercicios === 0}
                aoTocar={() => void comecarTreino(item.id)}
              />
              <Botao
                titulo="Editar"
                variante="secundario"
                icone="create-outline"
                aoTocar={() => router.push(`/rotina/${item.id}`)}
              />
            </View>
          </Cartao>
        )}
        ListEmptyComponent={
          <EstadoVazio
            icone="list"
            titulo="Nenhuma rotina ainda"
            descricao="Crie uma rotina para montar seu treino uma vez e repetir com um toque."
            acao={
              <View className="mt-2 w-56">
                <Botao titulo="Criar rotina" icone="add" aoTocar={() => setCriando(true)} />
              </View>
            }
          />
        }
      />

      <MenuOpcoes
        visivel={menu !== null}
        titulo={menu?.nome}
        opcoes={opcoesDoMenu}
        aoFechar={() => setMenu(null)}
      />

      <ModalTexto
        visivel={criando}
        titulo="Nova rotina"
        descricao="Você pode mudar depois."
        valorInicial=""
        multilinha={false}
        placeholder="Ex.: Push A, Pernas, Costas e bíceps"
        aoSalvar={(nome) => void criarComNome(nome)}
        aoFechar={() => setCriando(false)}
      />
    </Tela>
  );
}
