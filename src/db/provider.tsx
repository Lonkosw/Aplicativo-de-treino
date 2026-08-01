import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { cores } from '@/constants/tema';

// Caminho relativo de propósito: `drizzle/` fica fora de `src/`, que é a
// raiz do alias `@/`.
import migrations from '../../drizzle/migrations';

import { db } from './client';
import { popularExerciciosSeVazio } from './seed';

type Estado = 'migrando' | 'populando' | 'pronto' | 'erro';

/**
 * Nada pode ser renderizado antes de as migrations rodarem — as telas
 * consultam o banco no primeiro render. Na web isso seria trabalho do
 * servidor; aqui é um gate de UI na raiz do app.
 */
export function BancoProvider({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [estado, setEstado] = useState<Estado>('migrando');
  const [erroSeed, setErroSeed] = useState<Error | null>(null);

  useEffect(() => {
    if (!success) return;
    let cancelado = false;
    setEstado('populando');
    popularExerciciosSeVazio()
      .then(() => {
        if (!cancelado) setEstado('pronto');
      })
      .catch((e: Error) => {
        if (cancelado) return;
        setErroSeed(e);
        setEstado('erro');
      });
    return () => {
      cancelado = true;
    };
  }, [success]);

  const falha = error ?? erroSeed;
  if (falha) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-fundo px-8">
        <Text className="text-center text-base font-semibold text-destaqueTexto">
          Não foi possível preparar o banco de dados
        </Text>
        <Text className="text-center text-sm text-texto2">{falha.message}</Text>
      </View>
    );
  }

  if (estado !== 'pronto') {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-fundo">
        <ActivityIndicator color={cores.destaqueTexto} />
        <Text className="text-sm text-texto3">
          {estado === 'migrando' ? 'Preparando banco...' : 'Carregando exercícios...'}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
