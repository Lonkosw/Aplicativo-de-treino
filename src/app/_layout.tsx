import '@/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { cores } from '@/constants/tema';
import { BancoProvider } from '@/db/provider';
import { prepararNotificacoes } from '@/lib/notificacoes';

/**
 * Ordem dos providers importa e não tem paralelo na web:
 * - `GestureHandlerRootView` precisa ser a raiz para qualquer gesto
 *   (arrastar para reordenar, swipe) funcionar.
 * - `SafeAreaProvider` mede os recortes da tela uma única vez e distribui
 *   por contexto.
 * - `BancoProvider` segura o render até as migrations rodarem.
 */
export default function LayoutRaiz() {
  useEffect(() => {
    void prepararNotificacoes();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <SafeAreaProvider>
        {/* Sem `backgroundColor`: no Android edge-to-edge a barra de status
            é sempre transparente e a cor vem do fundo da tela. */}
        <StatusBar style="light" />
        <BancoProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: cores.fundo },
              animation: 'slide_from_right',
            }}>
            <Stack.Screen name="(abas)" />
            <Stack.Screen name="treino/ativo" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="treino/resumo" options={{ animation: 'fade' }} />
            <Stack.Screen name="selecionar-exercicios" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="exercicio/novo" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
        </BancoProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
