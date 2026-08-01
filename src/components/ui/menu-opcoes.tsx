import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ALVO_TOQUE, DURACAO, cores } from '@/constants/tema';

export type Opcao = {
  rotulo: string;
  icone?: ComponentProps<typeof Ionicons>['name'];
  destrutiva?: boolean;
  marcada?: boolean;
  aoTocar: () => void;
};

/**
 * Menu em folha inferior.
 *
 * `Alert.alert` no Android é um AlertDialog nativo e aceita no máximo três
 * botões — os demais são silenciosamente descartados. Qualquer menu com
 * mais opções precisa ser construído à mão. De quebra, os alvos aqui têm
 * 56dp e ficam ao alcance do polegar.
 */
export function MenuOpcoes({
  visivel,
  titulo,
  subtitulo,
  opcoes,
  aoFechar,
}: {
  visivel: boolean;
  titulo?: string;
  subtitulo?: string;
  opcoes: Opcao[];
  aoFechar: () => void;
}) {
  const insets = useSafeAreaInsets();

  /**
   * Fecha a folha ANTES de executar a ação, e só executa depois que ela
   * terminou de sair.
   *
   * No Android, abrir um `Modal` enquanto outro ainda está sendo desmontado
   * faz o segundo simplesmente não aparecer. Como várias opções daqui abrem
   * um diálogo de texto ("Notas do exercício", "Renomear treino"), sem esta
   * espera o toque parecia não fazer nada.
   */
  function escolher(opcao: Opcao) {
    aoFechar();
    setTimeout(opcao.aoTocar, DURACAO.lenta);
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={aoFechar}>
      <Pressable onPress={aoFechar} className="flex-1 justify-end bg-black/70">
        <Pressable
          onPress={() => {}}
          style={{ paddingBottom: insets.bottom + 12 }}
          className="rounded-t-3xl border-t border-borda bg-superficie px-3 pt-3">
          <View className="mb-2 items-center">
            <View className="h-1 w-10 rounded-full bg-borda" />
          </View>

          {titulo ? (
            <View className="px-3 pb-2">
              <Text className="text-[15px] font-bold text-texto" numberOfLines={1}>
                {titulo}
              </Text>
              {subtitulo ? (
                <Text className="text-[13px] text-texto3" numberOfLines={1}>
                  {subtitulo}
                </Text>
              ) : null}
            </View>
          ) : null}

          {opcoes.map((o) => (
            <Pressable
              key={o.rotulo}
              onPress={() => escolher(o)}
              accessibilityRole="button"
              accessibilityLabel={o.rotulo}
              accessibilityState={{ selected: o.marcada }}
              style={{ minHeight: 56 }}
              className="flex-row items-center gap-3 rounded-2xl px-3 active:bg-superficie2">
              {o.icone ? (
                <Ionicons
                  name={o.icone}
                  size={20}
                  color={o.destrutiva ? cores.destaqueTexto : cores.texto2}
                />
              ) : null}
              <Text
                className={`flex-1 text-[16px] font-semibold ${
                  o.destrutiva ? 'text-destaqueTexto' : 'text-texto'
                }`}>
                {o.rotulo}
              </Text>
              {o.marcada ? <Ionicons name="checkmark" size={20} color={cores.destaqueTexto} /> : null}
            </Pressable>
          ))}

          <Pressable
            onPress={aoFechar}
            style={{ minHeight: ALVO_TOQUE, marginTop: 8 }}
            className="items-center justify-center rounded-2xl bg-superficie2 active:bg-superficie3">
            <Text className="text-[16px] font-bold text-texto2">Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
