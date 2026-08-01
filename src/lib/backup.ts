import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from '@/db/client';
import {
  config,
  exercicios,
  rotinaExercicios,
  rotinas,
  series,
  treinoExercicios,
  treinos,
} from '@/db/schema';

export const FORMATO = 'treino-backup';
export const VERSAO = 1;

type Tabelas = {
  exercicios: unknown[];
  rotinas: unknown[];
  rotinaExercicios: unknown[];
  treinos: unknown[];
  treinoExercicios: unknown[];
  series: unknown[];
  config: unknown[];
};

export type ArquivoBackup = {
  formato: typeof FORMATO;
  versao: number;
  geradoEm: string;
  dados: Tabelas;
};

/**
 * Não há nuvem: este arquivo é a única proteção contra perda total do
 * histórico. Por isso o dump é do banco inteiro, com os ids preservados —
 * a restauração precisa reconstruir as chaves estrangeiras exatamente.
 */
export async function montarBackup(): Promise<ArquivoBackup> {
  const [
    linhasExercicios,
    linhasRotinas,
    linhasRotinaExercicios,
    linhasTreinos,
    linhasTreinoExercicios,
    linhasSeries,
    linhasConfig,
  ] = await Promise.all([
    db.select().from(exercicios),
    db.select().from(rotinas),
    db.select().from(rotinaExercicios),
    db.select().from(treinos),
    db.select().from(treinoExercicios),
    db.select().from(series),
    db.select().from(config),
  ]);

  return {
    formato: FORMATO,
    versao: VERSAO,
    geradoEm: new Date().toISOString(),
    dados: {
      exercicios: linhasExercicios,
      rotinas: linhasRotinas,
      rotinaExercicios: linhasRotinaExercicios,
      treinos: linhasTreinos,
      treinoExercicios: linhasTreinoExercicios,
      series: linhasSeries,
      config: linhasConfig,
    },
  };
}

function nomeDoArquivo(agora = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `treino-backup-${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(
    agora.getDate(),
  )}-${pad(agora.getHours())}${pad(agora.getMinutes())}.json`;
}

export type ResultadoExportacao = { ok: true; arquivo: string } | { ok: false; erro: string };

/**
 * Grava o JSON no diretório de cache e abre o share sheet do Android.
 * O app não tem permissão para escrever direto no armazenamento externo —
 * quem escolhe o destino é o usuário, pelo seletor do sistema.
 */
export async function exportarBackup(): Promise<ResultadoExportacao> {
  try {
    const backup = await montarBackup();
    const arquivo = new File(Paths.cache, nomeDoArquivo());
    if (arquivo.exists) arquivo.delete();
    arquivo.create();
    arquivo.write(JSON.stringify(backup));

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, erro: 'Compartilhamento indisponível neste aparelho.' };
    }

    await Sharing.shareAsync(arquivo.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Salvar backup do Treino',
      UTI: 'public.json',
    });

    return { ok: true, arquivo: arquivo.name };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'Falha ao exportar.' };
  }
}

export type Resumo = {
  exercicios: number;
  rotinas: number;
  treinos: number;
  series: number;
  geradoEm: string;
};

function ehLista(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

/** Valida o formato antes de deixar o usuário confirmar a sobrescrita. */
export function validarBackup(bruto: unknown): { ok: true; backup: ArquivoBackup; resumo: Resumo } | { ok: false; erro: string } {
  if (typeof bruto !== 'object' || bruto === null) return { ok: false, erro: 'Arquivo não é um JSON válido.' };

  const b = bruto as Partial<ArquivoBackup>;
  if (b.formato !== FORMATO) {
    return { ok: false, erro: 'Este arquivo não é um backup do Treino.' };
  }
  if (typeof b.versao !== 'number' || b.versao > VERSAO) {
    return { ok: false, erro: `Backup na versão ${b.versao}, incompatível com esta versão do app.` };
  }
  if (typeof b.dados !== 'object' || b.dados === null) {
    return { ok: false, erro: 'Backup sem a seção de dados.' };
  }

  const tabelas: (keyof Tabelas)[] = [
    'exercicios',
    'rotinas',
    'rotinaExercicios',
    'treinos',
    'treinoExercicios',
    'series',
    'config',
  ];
  for (const t of tabelas) {
    if (!ehLista(b.dados[t])) return { ok: false, erro: `Tabela "${t}" ausente ou corrompida.` };
  }

  const backup = b as ArquivoBackup;
  return {
    ok: true,
    backup,
    resumo: {
      exercicios: backup.dados.exercicios.length,
      rotinas: backup.dados.rotinas.length,
      treinos: backup.dados.treinos.length,
      series: backup.dados.series.length,
      geradoEm: backup.geradoEm,
    },
  };
}

/** Datas viajam como texto ISO no JSON e voltam como Date para o Drizzle. */
function comData<T extends Record<string, unknown>>(linha: T, campos: string[]) {
  const copia: Record<string, unknown> = { ...linha };
  for (const campo of campos) {
    const valor = copia[campo];
    if (typeof valor === 'string' || typeof valor === 'number') copia[campo] = new Date(valor);
  }
  return copia;
}

/**
 * Restauração destrutiva: apaga tudo e reinsere. A ordem respeita as
 * chaves estrangeiras (filhos primeiro ao apagar, pais primeiro ao inserir).
 */
export function restaurarBackup(backup: ArquivoBackup) {
  const d = backup.dados;

  /**
   * Callback SÍNCRONA com `.run()`. O driver expo-sqlite do Drizzle emite
   * `commit` assim que a callback retorna — com uma callback `async` o
   * commit sairia antes das escritas e um erro no meio da restauração
   * deixaria o banco vazio, sem rollback. Aqui, se qualquer insert falhar,
   * o `rollback` devolve os dados antigos intactos.
   */
  db.transaction((tx) => {
    tx.delete(series).run();
    tx.delete(treinoExercicios).run();
    tx.delete(treinos).run();
    tx.delete(rotinaExercicios).run();
    tx.delete(rotinas).run();
    tx.delete(exercicios).run();
    tx.delete(config).run();

    const emLotes = (linhas: unknown[], inserir: (lote: never[]) => void) => {
      for (let i = 0; i < linhas.length; i += 100) {
        inserir(linhas.slice(i, i + 100) as never[]);
      }
    };

    emLotes(d.exercicios, (lote) => tx.insert(exercicios).values(lote).run());
    emLotes(
      d.rotinas.map((r) => comData(r as Record<string, unknown>, ['criadoEm'])),
      (lote) => tx.insert(rotinas).values(lote).run(),
    );
    emLotes(d.rotinaExercicios, (lote) => tx.insert(rotinaExercicios).values(lote).run());
    emLotes(
      d.treinos.map((t) => comData(t as Record<string, unknown>, ['iniciadoEm', 'finalizadoEm'])),
      (lote) => tx.insert(treinos).values(lote).run(),
    );
    emLotes(d.treinoExercicios, (lote) => tx.insert(treinoExercicios).values(lote).run());
    emLotes(d.series, (lote) => tx.insert(series).values(lote).run());
    emLotes(d.config, (lote) => tx.insert(config).values(lote).run());
  });
}

export type ArquivoEscolhido = { conteudo: string; nome: string } | null;

/** Abre o seletor de arquivos do Android e devolve o conteúdo em texto. */
export async function escolherArquivoDeBackup(): Promise<ArquivoEscolhido> {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (resultado.canceled || !resultado.assets?.length) return null;

  const asset = resultado.assets[0];
  const arquivo = new File(asset.uri);
  return { conteudo: await arquivo.text(), nome: asset.name };
}
