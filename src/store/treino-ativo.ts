import { create } from 'zustand';

import { atualizarSerie } from '@/db/consultas/treinos';
import {
  RECORDES_ZERADOS,
  recordesQuebrados,
  type Recordes,
  type TipoRecorde,
} from '@/lib/calculos';
import {
  agendarFimDoDescanso,
  cancelarNotificacao,
  toqueLeve,
  toqueSucesso,
  vibrarFimDoDescanso,
} from '@/lib/notificacoes';

export type CampoFoco = 'peso' | 'repeticoes';
export type PosicaoFoco = { serieId: number; campo: CampoFoco };

type Descanso = {
  /** Epoch em ms. Absoluto de propósito: sobrevive ao app ir para segundo
   *  plano, onde `setInterval` é congelado pelo Android. */
  fimEm: number;
  totalSegundos: number;
  nomeExercicio: string;
  notificacaoId: string | null;
};

type Estado = {
  descanso: Descanso | null;
  foco: PosicaoFoco | null;
  /** Buffer do campo em edição (string para permitir "82," em digitação). */
  buffer: string;
  /** O primeiro dígito depois de focar substitui o valor, como numa calculadora. */
  substituir: boolean;
  /** Ordem dos campos para o botão "Próximo" do teclado. */
  sequencia: PosicaoFoco[];
  /** Recordes do histórico (fora deste treino), por exercicioId. */
  basePorExercicio: Record<number, Recordes>;
  /** Recordes batidos agora, por serieId — usado para destacar a linha. */
  recordesDaSessao: Record<number, TipoRecorde[]>;

  iniciarDescanso: (segundos: number, nomeExercicio: string) => Promise<void>;
  ajustarDescanso: (deltaSegundos: number) => Promise<void>;
  encerrarDescanso: (comAlerta: boolean) => Promise<void>;

  focar: (posicao: PosicaoFoco, valorAtual: number) => void;
  desfocar: () => void;
  digitar: (tecla: string) => Promise<void>;
  apagar: () => Promise<void>;
  proximoCampo: () => void;
  definirSequencia: (sequencia: PosicaoFoco[]) => void;

  definirBase: (base: Record<number, Recordes>) => void;
  registrarConclusao: (args: {
    serieId: number;
    exercicioId: number;
    peso: number;
    repeticoes: number;
    tipo: 'normal' | 'aquecimento' | 'falha' | 'dropset';
  }) => TipoRecorde[];
  limparConclusao: (serieId: number) => void;
  limparSessao: () => void;
};

function formatarBuffer(valor: number) {
  if (!valor) return '';
  return Number.isInteger(valor) ? String(valor) : String(valor).replace('.', ',');
}

function interpretarBuffer(buffer: string, campo: CampoFoco) {
  if (!buffer) return 0;
  const numero = Number(buffer.replace(',', '.'));
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return campo === 'peso' ? Math.round(numero * 10) / 10 : Math.round(numero);
}

export const usarTreinoAtivo = create<Estado>((set, get) => ({
  descanso: null,
  foco: null,
  buffer: '',
  substituir: true,
  sequencia: [],
  basePorExercicio: {},
  recordesDaSessao: {},

  // -- descanso ------------------------------------------------------------

  async iniciarDescanso(segundos, nomeExercicio) {
    if (segundos <= 0) return;
    await cancelarNotificacao(get().descanso?.notificacaoId ?? null);
    const notificacaoId = await agendarFimDoDescanso(segundos, nomeExercicio);
    set({
      descanso: {
        fimEm: Date.now() + segundos * 1000,
        totalSegundos: segundos,
        nomeExercicio,
        notificacaoId,
      },
    });
  },

  async ajustarDescanso(deltaSegundos) {
    const atual = get().descanso;
    if (!atual) return;
    const restante = Math.max(0, Math.round((atual.fimEm - Date.now()) / 1000)) + deltaSegundos;
    if (restante <= 0) {
      await get().encerrarDescanso(false);
      return;
    }
    await cancelarNotificacao(atual.notificacaoId);
    const notificacaoId = await agendarFimDoDescanso(restante, atual.nomeExercicio);
    set({
      descanso: {
        ...atual,
        fimEm: Date.now() + restante * 1000,
        totalSegundos: Math.max(atual.totalSegundos, restante),
        notificacaoId,
      },
    });
  },

  async encerrarDescanso(comAlerta) {
    const atual = get().descanso;
    if (!atual) return;
    await cancelarNotificacao(atual.notificacaoId);
    set({ descanso: null });
    if (comAlerta) vibrarFimDoDescanso();
  },

  // -- teclado numérico ----------------------------------------------------

  focar(posicao, valorAtual) {
    toqueLeve();
    set({ foco: posicao, buffer: formatarBuffer(valorAtual), substituir: true });
  },

  desfocar() {
    set({ foco: null, buffer: '', substituir: true });
  },

  async digitar(tecla) {
    const { foco, buffer, substituir } = get();
    if (!foco) return;

    let novo = substituir ? '' : buffer;

    if (tecla === ',') {
      if (foco.campo !== 'peso' || novo.includes(',')) return;
      novo = novo === '' ? '0,' : `${novo},`;
    } else {
      // Uma casa decimal em kg, no máximo.
      const [, decimais] = novo.split(',');
      if (decimais !== undefined && decimais.length >= 1) return;
      if (novo.replace(',', '').length >= 5) return;
      novo = novo === '0' ? tecla : novo + tecla;
    }

    set({ buffer: novo, substituir: false });
    await atualizarSerie(foco.serieId, { [foco.campo]: interpretarBuffer(novo, foco.campo) });
  },

  async apagar() {
    const { foco, buffer, substituir } = get();
    if (!foco) return;
    const novo = substituir ? '' : buffer.slice(0, -1);
    set({ buffer: novo, substituir: false });
    await atualizarSerie(foco.serieId, { [foco.campo]: interpretarBuffer(novo, foco.campo) });
  },

  proximoCampo() {
    const { foco, sequencia } = get();
    if (!foco) return;
    const i = sequencia.findIndex((p) => p.serieId === foco.serieId && p.campo === foco.campo);
    const proximo = i >= 0 ? sequencia[i + 1] : undefined;
    if (!proximo) {
      get().desfocar();
      return;
    }
    toqueLeve();
    set({ foco: proximo, buffer: '', substituir: true });
  },

  definirSequencia(sequencia) {
    set({ sequencia });
  },

  // -- recordes ------------------------------------------------------------

  definirBase(base) {
    set({ basePorExercicio: base });
  },

  registrarConclusao({ serieId, exercicioId, peso, repeticoes, tipo }) {
    const base = get().basePorExercicio[exercicioId] ?? RECORDES_ZERADOS;
    const quebrados = recordesQuebrados({ peso, repeticoes, tipo }, base);

    if (quebrados.length) {
      toqueSucesso();
      // A base sobe junto: a próxima série só é recorde se superar esta.
      set((s) => ({
        basePorExercicio: {
          ...s.basePorExercicio,
          [exercicioId]: {
            maiorPeso: Math.max(base.maiorPeso, peso),
            maiorVolumeSerie: Math.max(base.maiorVolumeSerie, peso * repeticoes),
            maior1RM: Math.max(base.maior1RM, peso * (1 + repeticoes / 30)),
          },
        },
        recordesDaSessao: { ...s.recordesDaSessao, [serieId]: quebrados },
      }));
    } else {
      toqueLeve();
    }
    return quebrados;
  },

  limparConclusao(serieId) {
    set((s) => {
      if (!s.recordesDaSessao[serieId]) return s;
      const copia = { ...s.recordesDaSessao };
      delete copia[serieId];
      return { recordesDaSessao: copia };
    });
  },

  limparSessao() {
    void cancelarNotificacao(get().descanso?.notificacaoId ?? null);
    set({
      descanso: null,
      foco: null,
      buffer: '',
      substituir: true,
      sequencia: [],
      basePorExercicio: {},
      recordesDaSessao: {},
    });
  },
}));
