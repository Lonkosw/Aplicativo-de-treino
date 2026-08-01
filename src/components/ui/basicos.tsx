import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ALVO_TOQUE, cores } from '@/constants/tema';

export function Cartao({
  children,
  className = '',
  aoTocar,
}: {
  children: ReactNode;
  className?: string;
  aoTocar?: () => void;
}) {
  const conteudo = `rounded-2xl border border-borda bg-superficie ${className}`;
  if (!aoTocar) return <View className={conteudo}>{children}</View>;
  return (
    <Pressable onPress={aoTocar} className={`${conteudo} active:bg-superficie2`}>
      {children}
    </Pressable>
  );
}

export function Etiqueta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-md bg-superficie2 px-2 py-0.5 ${className}`}>
      <Text className="text-[11px] font-semibold text-texto2">{children}</Text>
    </View>
  );
}

export function Chip({
  rotulo,
  ativo,
  aoTocar,
}: {
  rotulo: string;
  ativo: boolean;
  aoTocar: () => void;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      style={{ minHeight: ALVO_TOQUE }}
      className={`justify-center rounded-full border px-4 ${
        ativo ? 'border-destaque bg-destaqueFundo' : 'border-borda bg-superficie'
      }`}>
      <Text className={`text-sm font-semibold ${ativo ? 'text-destaqueTexto' : 'text-texto2'}`}>{rotulo}</Text>
    </Pressable>
  );
}

/** Faixa horizontal de chips de filtro. */
export function FiltroChips({
  opcoes,
  selecionado,
  aoSelecionar,
  rotuloTodos = 'Todos',
}: {
  opcoes: string[];
  selecionado: string | null;
  aoSelecionar: (valor: string | null) => void;
  rotuloTodos?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5"
      keyboardShouldPersistTaps="handled">
      <Chip rotulo={rotuloTodos} ativo={selecionado === null} aoTocar={() => aoSelecionar(null)} />
      {opcoes.map((o) => (
        <Chip key={o} rotulo={o} ativo={selecionado === o} aoTocar={() => aoSelecionar(o)} />
      ))}
    </ScrollView>
  );
}

export function CampoBusca({
  valor,
  aoMudar,
  placeholder = 'Buscar',
  autoFoco,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  placeholder?: string;
  autoFoco?: boolean;
}) {
  return (
    <View
      style={{ minHeight: ALVO_TOQUE }}
      className="flex-row items-center gap-2 rounded-2xl border border-bordaCampo bg-superficie2 px-4">
      <Ionicons name="search" size={18} color={cores.texto3} />
      <TextInput
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.texto3}
        autoFocus={autoFoco}
        autoCorrect={false}
        returnKeyType="search"
        className="flex-1 text-base text-texto"
      />
      {valor.length > 0 ? (
        <Pressable onPress={() => aoMudar('')} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={cores.texto3} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function CampoTexto({
  valor,
  aoMudar,
  rotulo,
  placeholder,
  multilinha,
  teclado = 'default',
  autoFoco,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  rotulo?: string;
  placeholder?: string;
  multilinha?: boolean;
  teclado?: 'default' | 'numeric';
  autoFoco?: boolean;
}) {
  return (
    <View className="gap-1.5">
      {rotulo ? (
        <Text className="text-xs font-bold uppercase tracking-wider text-texto3">{rotulo}</Text>
      ) : null}
      <TextInput
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.texto3}
        multiline={multilinha}
        keyboardType={teclado}
        autoFocus={autoFoco}
        style={{ minHeight: multilinha ? 88 : ALVO_TOQUE, textAlignVertical: multilinha ? 'top' : 'center' }}
        // `bordaCampo` e nao `borda`: e a borda que diz "isto e editavel".
        className="rounded-2xl border border-bordaCampo bg-superficie2 px-4 py-3 text-base text-texto"
      />
    </View>
  );
}

export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <View className="items-center gap-3 px-10 py-14">
      <Ionicons name={icone} size={40} color={cores.texto3} />
      <Text className="text-center text-base font-bold text-texto2">{titulo}</Text>
      {descricao ? <Text className="text-center text-sm text-texto3">{descricao}</Text> : null}
      {acao}
    </View>
  );
}

/** Bloco número + rótulo usado nos resumos. */
export function Metrica({
  valor,
  rotulo,
  destaque,
  className = '',
}: {
  valor: string;
  rotulo: string;
  destaque?: boolean;
  className?: string;
}) {
  return (
    <View className={`flex-1 items-center gap-0.5 ${className}`}>
      {/* Numero e rotulo em UMA linha: "12.450 kg" ou "semanas seguidas"
          estouram a coluna de ~96dp e quebravam o alinhamento da fileira. */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        className={`text-numero ${destaque ? 'text-destaqueTexto' : 'text-texto'}`}>
        {valor}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        className="text-[11px] font-semibold uppercase tracking-wide text-texto3">
        {rotulo}
      </Text>
    </View>
  );
}

export function Separador() {
  return <View className="h-px bg-borda" />;
}
