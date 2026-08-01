import type { Serie, TipoSerie } from '@/db/schema';

/** Séries de aquecimento não entram em volume nem em recorde. */
export function contaParaVolume(tipo: TipoSerie, concluida: boolean) {
  return concluida && tipo !== 'aquecimento';
}

/** Volume de uma série = peso × repetições (kg). */
export function volumeSerie(peso: number, repeticoes: number) {
  return peso * repeticoes;
}

type SerieParcial = Pick<Serie, 'peso' | 'repeticoes' | 'tipo' | 'concluida'>;

/** Volume total: soma das séries concluídas, ignorando aquecimento. */
export function volumeTotal(series: SerieParcial[]) {
  return series.reduce(
    (soma, s) => (contaParaVolume(s.tipo, s.concluida) ? soma + volumeSerie(s.peso, s.repeticoes) : soma),
    0,
  );
}

export function seriesValidas(series: SerieParcial[]) {
  return series.filter((s) => contaParaVolume(s.tipo, s.concluida));
}

/**
 * 1RM estimado pela fórmula de Epley: peso × (1 + reps/30).
 * Com 1 repetição a fórmula devolve o próprio peso.
 */
export function epley1RM(peso: number, repeticoes: number) {
  if (peso <= 0 || repeticoes <= 0) return 0;
  return peso * (1 + repeticoes / 30);
}

export type Recordes = {
  /** Maior peso levantado em uma série. */
  maiorPeso: number;
  /** Maior volume (peso × reps) em uma única série. */
  maiorVolumeSerie: number;
  /** Maior 1RM estimado. */
  maior1RM: number;
};

export const RECORDES_ZERADOS: Recordes = { maiorPeso: 0, maiorVolumeSerie: 0, maior1RM: 0 };

export function calcularRecordes(series: SerieParcial[]): Recordes {
  return seriesValidas(series).reduce<Recordes>(
    (acc, s) => ({
      maiorPeso: Math.max(acc.maiorPeso, s.peso),
      maiorVolumeSerie: Math.max(acc.maiorVolumeSerie, volumeSerie(s.peso, s.repeticoes)),
      maior1RM: Math.max(acc.maior1RM, epley1RM(s.peso, s.repeticoes)),
    }),
    { ...RECORDES_ZERADOS },
  );
}

export type TipoRecorde = 'peso' | 'volume' | '1rm';

const TOLERANCIA = 0.001;

/**
 * Compara uma série recém-concluída com os recordes anteriores do exercício.
 * Retorna quais recordes ela quebrou — chamado no instante do check, para
 * o app poder sinalizar na hora.
 */
export function recordesQuebrados(
  serie: { peso: number; repeticoes: number; tipo: TipoSerie },
  anteriores: Recordes,
): TipoRecorde[] {
  if (serie.tipo === 'aquecimento' || serie.peso <= 0 || serie.repeticoes <= 0) return [];

  const quebrados: TipoRecorde[] = [];
  if (serie.peso > anteriores.maiorPeso + TOLERANCIA) quebrados.push('peso');
  if (volumeSerie(serie.peso, serie.repeticoes) > anteriores.maiorVolumeSerie + TOLERANCIA) {
    quebrados.push('volume');
  }
  if (epley1RM(serie.peso, serie.repeticoes) > anteriores.maior1RM + TOLERANCIA) {
    quebrados.push('1rm');
  }
  return quebrados;
}

export const ROTULO_RECORDE: Record<TipoRecorde, string> = {
  peso: 'Peso máximo',
  volume: 'Volume na série',
  '1rm': '1RM estimado',
};

/** Início da semana (segunda-feira, 00:00) para agrupamentos semanais. */
export function inicioDaSemana(data: Date) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  // getDay(): 0 = domingo. Queremos segunda como primeiro dia.
  const diasDesdeSegunda = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diasDesdeSegunda);
  return d;
}

/**
 * Sequência de semanas consecutivas com pelo menos um treino, contando de
 * trás para frente a partir da semana atual. A semana atual ainda sem
 * treino não zera a sequência — só a semana anterior vazia zera.
 */
export function sequenciaDeSemanas(datasDeTreino: Date[]) {
  if (datasDeTreino.length === 0) return 0;

  const semanas = new Set(datasDeTreino.map((d) => inicioDaSemana(d).getTime()));
  const cursor = inicioDaSemana(new Date());

  if (!semanas.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 7);
    if (!semanas.has(cursor.getTime())) return 0;
  }

  let total = 0;
  while (semanas.has(cursor.getTime())) {
    total += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return total;
}
