import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

/**
 * `SafeAreaView` do `react-native-safe-area-context` (e não o do React
 * Native) porque é o único que respeita a barra de gestos do Android e a
 * orientação. Não há equivalente na web: aqui a tela tem "recortes".
 */
export function Tela({
  children,
  edges = ['top'],
  className = '',
}: {
  children?: ReactNode;
  edges?: Edge[];
  className?: string;
}) {
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-fundo ${className}`}>
      {children}
    </SafeAreaView>
  );
}

export function TituloTela({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
      <Text className="text-[28px] font-extrabold text-texto">{children}</Text>
      {acao}
    </View>
  );
}

export function Secao({ titulo, children, acao }: { titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <Text className="text-xs font-bold uppercase tracking-wider text-texto3">{titulo}</Text>
        {acao}
      </View>
      {children}
    </View>
  );
}
