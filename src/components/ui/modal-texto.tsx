import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { DURACAO } from '@/constants/tema';

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
  teclado = 'default',
  exigeTexto = false,
  rotuloSalvar = 'Salvar',
  aoSalvar,
  aoFechar,
}: {
  visivel: boolean;
  titulo: string;
  descricao?: string;
  valorInicial?: string;
  placeholder?: string;
  multilinha?: boolean;
  teclado?: 'default' | 'numeric';
  /** Quando verdadeiro, o botão de salvar fica inativo com o campo vazio. */
  exigeTexto?: boolean;
  rotuloSalvar?: string;
  aoSalvar: (valor: string) => void;
  aoFechar: () => void;
}) {
  const [texto, setTexto] = useState(valorInicial);

  // O Modal não desmonta entre aberturas: sincronizamos o valor ao abrir.
  useEffect(() => {
    if (visivel) setTexto(valorInicial);
  }, [visivel, valorInicial]);

  const podeSalvar = !exigeTexto || texto.trim().length > 0;

  return (
    <Modal visible={visivel} transparent animationType="none" onRequestClose={aoFechar}>
      <Animated.View
        entering={FadeIn.duration(DURACAO.rapida)}
        exiting={FadeOut.duration(DURACAO.rapida)}
        className="flex-1">
        <Pressable
          onPress={aoFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          className="flex-1 justify-center bg-black/70 px-6">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Pressable interno com onPress vazio impede que tocar no card
                feche o modal (equivalente a stopPropagation). */}
            <Animated.View entering={ZoomIn.duration(DURACAO.media).withInitialValues({ transform: [{ scale: 0.94 }] })}>
              <Pressable
                onPress={() => {}}
                className="gap-4 rounded-3xl border border-borda bg-superficie p-5">
                <View className="gap-1">
                  <Text className="text-lg font-bold text-texto">{titulo}</Text>
                  {descricao ? <Text className="text-[13px] text-texto2">{descricao}</Text> : null}
                </View>

                <CampoTexto
                  valor={texto}
                  aoMudar={setTexto}
                  placeholder={placeholder}
                  multilinha={multilinha}
                  teclado={teclado}
                  autoFoco
                />

                <View className="flex-row gap-3">
                  <Botao titulo="Cancelar" variante="secundario" className="flex-1" aoTocar={aoFechar} />
                  <Botao
                    titulo={rotuloSalvar}
                    className="flex-1"
                    desabilitado={!podeSalvar}
                    aoTocar={() => {
                      aoSalvar(texto);
                      aoFechar();
                    }}
                  />
                </View>
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
