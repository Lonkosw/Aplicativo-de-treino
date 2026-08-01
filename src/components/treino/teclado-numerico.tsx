import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores } from '@/constants/tema';
import { usarTreinoAtivo } from '@/store/treino-ativo';

/**
 * Teclado próprio em vez do teclado do sistema.
 *
 * Motivo: o teclado numérico do Android muda de layout entre fabricantes,
 * abre e fecha com animação e rouba metade da tela. Aqui os alvos têm
 * ~56dp, ficam sempre no mesmo lugar e incluem ações do domínio (±2,5 kg,
 * concluir série, próximo campo) — é o que faz caber em 2 toques.
 */
function Tecla({
  children,
  aoTocar,
  variante = 'normal',
  desabilitada,
}: {
  children: React.ReactNode;
  aoTocar: () => void;
  variante?: 'normal' | 'acao' | 'confirmar';
  desabilitada?: boolean;
}) {
  const fundo =
    variante === 'confirmar'
      ? 'bg-destaque active:bg-destaqueEscuro'
      : variante === 'acao'
        ? 'bg-superficie3 active:bg-borda'
        : 'bg-superficie2 active:bg-superficie3';

  return (
    <Pressable
      onPress={aoTocar}
      disabled={desabilitada}
      style={{ height: 54 }}
      className={`flex-1 items-center justify-center rounded-xl ${fundo} ${
        desabilitada ? 'opacity-30' : ''
      }`}>
      {children}
    </Pressable>
  );
}

function Digito({ valor, aoTocar }: { valor: string; aoTocar: (v: string) => void }) {
  return (
    <Tecla aoTocar={() => aoTocar(valor)}>
      <Text className="text-2xl font-bold text-texto">{valor}</Text>
    </Tecla>
  );
}

export function TecladoNumerico({ aoConcluirSerie }: { aoConcluirSerie: (serieId: number) => void }) {
  const insets = useSafeAreaInsets();
  const foco = usarTreinoAtivo((s) => s.foco);
  const digitar = usarTreinoAtivo((s) => s.digitar);
  const apagar = usarTreinoAtivo((s) => s.apagar);
  const incrementar = usarTreinoAtivo((s) => s.incrementar);
  const proximoCampo = usarTreinoAtivo((s) => s.proximoCampo);
  const desfocar = usarTreinoAtivo((s) => s.desfocar);

  if (!foco) return null;
  const ehPeso = foco.campo === 'peso';

  return (
    <View
      style={{ paddingBottom: insets.bottom + 8 }}
      className="border-t border-borda bg-superficie px-3 pt-2">
      <View className="mb-2 flex-row items-center justify-between px-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-texto3">
          {ehPeso ? 'Peso (kg)' : 'Repetições'}
        </Text>
        <Pressable onPress={desfocar} hitSlop={12} className="flex-row items-center gap-1">
          <Text className="text-xs font-bold uppercase tracking-wider text-texto2">Fechar</Text>
          <Ionicons name="chevron-down" size={14} color={cores.texto2} />
        </Pressable>
      </View>

      <View className="gap-2">
        <View className="flex-row gap-2">
          <Digito valor="1" aoTocar={(v) => void digitar(v)} />
          <Digito valor="2" aoTocar={(v) => void digitar(v)} />
          <Digito valor="3" aoTocar={(v) => void digitar(v)} />
          <Tecla aoTocar={() => void apagar()} variante="acao">
            <Ionicons name="backspace-outline" size={22} color={cores.texto} />
          </Tecla>
        </View>

        <View className="flex-row gap-2">
          <Digito valor="4" aoTocar={(v) => void digitar(v)} />
          <Digito valor="5" aoTocar={(v) => void digitar(v)} />
          <Digito valor="6" aoTocar={(v) => void digitar(v)} />
          <Tecla aoTocar={() => void incrementar(-1)} variante="acao">
            <Text className="text-base font-bold text-texto">{ehPeso ? '−2,5' : '−1'}</Text>
          </Tecla>
        </View>

        <View className="flex-row gap-2">
          <Digito valor="7" aoTocar={(v) => void digitar(v)} />
          <Digito valor="8" aoTocar={(v) => void digitar(v)} />
          <Digito valor="9" aoTocar={(v) => void digitar(v)} />
          <Tecla aoTocar={() => void incrementar(1)} variante="acao">
            <Text className="text-base font-bold text-texto">{ehPeso ? '+2,5' : '+1'}</Text>
          </Tecla>
        </View>

        <View className="flex-row gap-2">
          <Tecla aoTocar={() => void digitar(',')} desabilitada={!ehPeso}>
            <Text className="text-2xl font-bold text-texto">,</Text>
          </Tecla>
          <Digito valor="0" aoTocar={(v) => void digitar(v)} />
          <Tecla aoTocar={proximoCampo} variante="acao">
            <Ionicons name="arrow-forward" size={22} color={cores.texto} />
          </Tecla>
          <Tecla aoTocar={() => aoConcluirSerie(foco.serieId)} variante="confirmar">
            <Ionicons name="checkmark" size={26} color="#FFFFFF" />
          </Tecla>
        </View>
      </View>
    </View>
  );
}
