import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { BotaoIcone } from '@/components/ui/botao';

/**
 * Cabeçalho próprio em vez do header do Stack: precisamos do mesmo fundo
 * quase preto e de títulos longos truncando em uma linha.
 */
export function CabecalhoPilha({
  titulo,
  subtitulo,
  acao,
  aoVoltar,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
  aoVoltar?: () => void;
}) {
  const router = useRouter();
  const voltar = aoVoltar ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));

  return (
    <View className="flex-row items-center gap-2 border-b border-borda px-2 pb-2 pt-1">
      <BotaoIcone icone="chevron-back" aoTocar={voltar} acessibilidade="Voltar" tamanho={26} />
      <View className="flex-1">
        <Text className="text-[17px] font-bold text-texto" numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text className="text-[12px] text-texto3" numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {acao}
    </View>
  );
}
