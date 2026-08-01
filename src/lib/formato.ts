/** Formatação pt-BR usada em toda a interface. */

/** 3725 -> "1:02:05" | 125 -> "2:05" — para o cronômetro do treino. */
export function cronometro(segundos: number) {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(seg)}` : `${m}:${pad(seg)}`;
}

/** 3725 -> "1h 2min" | 125 -> "2min" — para resumos e listas. */
export function duracaoCurta(segundos: number) {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}min` : `${h}h`;
  return `${m}min`;
}

/** 80 -> "80" | 82.5 -> "82,5" — uma casa decimal, sem zero à toa. */
export function peso(kg: number) {
  const arredondado = Math.round(kg * 10) / 10;
  return Number.isInteger(arredondado)
    ? String(arredondado)
    : arredondado.toFixed(1).replace('.', ',');
}

/** 12450 -> "12.450 kg" */
export function volume(kg: number) {
  return `${Math.round(kg).toLocaleString('pt-BR')} kg`;
}

/** 12450 -> "12,5 t" quando o número fica grande demais para caber. */
export function volumeCompacto(kg: number) {
  if (kg >= 1000) {
    const t = Math.round(kg / 100) / 10;
    return `${String(t).replace('.', ',')} t`;
  }
  return `${Math.round(kg)} kg`;
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** "Hoje, 19:30" | "Ontem, 07:15" | "qua, 12 mar" */
export function dataRelativa(data: Date) {
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diffDias = Math.round((hoje.getTime() - dia.getTime()) / 86_400_000);

  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDias === 0) return `Hoje, ${hora}`;
  if (diffDias === 1) return `Ontem, ${hora}`;
  if (diffDias < 7) return `${DIAS[data.getDay()]}, ${hora}`;
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}

/** "12 mar" — rótulo curto de eixo de gráfico. */
export function dataCurta(data: Date) {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function plural(n: number, singular: string, pluralForma: string) {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}
