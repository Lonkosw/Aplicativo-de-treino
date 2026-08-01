import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';

import { CampoTexto } from './basicos';
import { Botao } from './botao';

/**
 * `Alert.prompt` só existe no iOS, então qualquer entrada de texto em
 * diálogo precisa de um `Modal` próprio no Android.
 */
export function ModalTexto({
  visivel,
  titulo,
  descricao,
  valorInicial = '',
  placeholder,
  multilinha = true,
  aoSalvar,
  aoFechar,
}: {
  visivel: boolean;
  titulo: string;
  descricao?: string;
  valorInicial?: string;
  placeholder?: string;
  multilinha?: boolean;
  aoSalvar: (valor: string) => void;
  aoFechar: () => void;
}) {
  const [texto, setTexto] = useState(valorInicial);

  // O Modal não desmonta entre aberturas: sincronizamos o valor ao abrir.
  useEffect(() => {
    if (visivel) setTexto(valorInicial);
  }, [visivel, valorInicial]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
      <Pressable onPress={aoFechar} className="flex-1 justify-center bg-black/70 px-6">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Pressable interno com onPress vazio impede que tocar no card
              feche o modal (equivalente a stopPropagation). */}
          <Pressable onPress={() => {}} className="gap-4 rounded-3xl border border-borda bg-superficie p-5">
            <View className="gap-1">
              <Text className="text-lg font-bold text-texto">{titulo}</Text>
              {descricao ? <Text className="text-[13px] text-texto3">{descricao}</Text> : null}
            </View>

            <CampoTexto valor={texto} aoMudar={setTexto} placeholder={placeholder} multilinha={multilinha} />

            <View className="flex-row gap-3">
              <Botao titulo="Cancelar" variante="secundario" className="flex-1" aoTocar={aoFechar} />
              <Botao
                titulo="Salvar"
                className="flex-1"
                aoTocar={() => {
                  aoSalvar(texto);
                  aoFechar();
                }}
              />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
