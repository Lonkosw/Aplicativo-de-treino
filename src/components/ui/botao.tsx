import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ALVO_TOQUE, cores } from '@/constants/tema';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';
type Tamanho = 'normal' | 'grande';

const FUNDO: Record<Variante, string> = {
  primario: 'bg-destaque active:bg-destaqueEscuro',
  secundario: 'bg-superficie2 active:bg-superficie3 border border-borda',
  fantasma: 'bg-transparent active:bg-superficie2',
  perigo: 'bg-destaqueFundo active:bg-destaqueEscuro border border-destaque/40',
};

const TEXTO: Record<Variante, string> = {
  primario: 'text-white',
  secundario: 'text-texto',
  fantasma: 'text-texto2',
  perigo: 'text-destaque',
};

const COR_ICONE: Record<Variante, string> = {
  primario: '#FFFFFF',
  secundario: cores.texto,
  fantasma: cores.texto2,
  perigo: cores.destaque,
};

export function Botao({
  titulo,
  aoTocar,
  variante = 'primario',
  tamanho = 'normal',
  icone,
  desabilitado,
  carregando,
  className = '',
}: {
  titulo: string;
  aoTocar: () => void;
  variante?: Variante;
  tamanho?: Tamanho;
  icone?: ComponentProps<typeof Ionicons>['name'];
  desabilitado?: boolean;
  carregando?: boolean;
  className?: string;
}) {
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      onPress={aoTocar}
      disabled={inativo}
      // 48dp é o mínimo de alvo de toque: o app é usado de pé, com uma mão.
      style={{ minHeight: tamanho === 'grande' ? 60 : ALVO_TOQUE }}
      className={`flex-row items-center justify-center gap-2 rounded-2xl px-5 ${FUNDO[variante]} ${
        inativo ? 'opacity-40' : ''
      } ${className}`}>
      {carregando ? (
        <ActivityIndicator color={COR_ICONE[variante]} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={tamanho === 'grande' ? 22 : 18} color={COR_ICONE[variante]} /> : null}
          <Text
            className={`font-bold ${TEXTO[variante]} ${tamanho === 'grande' ? 'text-lg' : 'text-base'}`}>
            {titulo}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Botão só de ícone, com área de toque garantida. */
export function BotaoIcone({
  icone,
  aoTocar,
  cor = cores.texto2,
  tamanho = 22,
  className = '',
  acessibilidade,
}: {
  icone: ComponentProps<typeof Ionicons>['name'];
  aoTocar: () => void;
  cor?: string;
  tamanho?: number;
  className?: string;
  acessibilidade?: string;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityLabel={acessibilidade}
      accessibilityRole="button"
      hitSlop={8}
      style={{ minWidth: ALVO_TOQUE, minHeight: ALVO_TOQUE }}
      className={`items-center justify-center rounded-xl active:bg-superficie2 ${className}`}>
      <Ionicons name={icone} size={tamanho} color={cor} />
    </Pressable>
  );
}

export function LinhaBotoes({ children }: { children: ReactNode }) {
  return <View className="flex-row gap-3">{children}</View>;
}
