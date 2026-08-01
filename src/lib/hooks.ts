import { useEffect, useState } from 'react';

/**
 * Atrasa a propagação de um valor.
 *
 * Usado na busca de exercícios: a base tem ~870 linhas e o `useLiveQuery`
 * refaz a consulta a cada mudança. Sem o atraso, cada letra digitada dispara
 * uma varredura da tabela e o campo engasga em aparelho modesto.
 */
export function useValorAtrasado<T>(valor: T, ms = 250) {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);

  return atrasado;
}
