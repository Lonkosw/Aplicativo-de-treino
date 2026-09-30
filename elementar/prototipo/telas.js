// Protótipo estático das telas do ELEMENTAR 118.
// Uso: prototipo.html?tela=jogo&disp=mobile&tema=claro

const ICONES = {
  ajuda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 9a3 3 0 1 1 4.2 2.8c-.8.4-1.2 1-1.2 1.9V15"/><circle cx="12" cy="19" r=".6" fill="currentColor"/></svg>',
  trofeu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 20h8"/></svg>',
  medalha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><circle cx="12" cy="14" r="6"/><path d="M8.5 9 6 2h4l2 5 2-5h4l-2.5 7"/><path d="m12 11.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3Z" fill="currentColor" stroke-width="1"/></svg>',
  config: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.5 7.5 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.5 7.5 0 0 0-1.7 1l-2.5-1-2 3.5L6.5 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.8 1.7 1l.4 2.6h4l.4-2.6c.6-.2 1.2-.6 1.7-1l2.5 1 2-3.5ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" transform="translate(-1 0)"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z"/></svg>',
  bandeira: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>',
  coracao: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11Z"/></svg>',
  voltar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  enter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5v6a3 3 0 0 1-3 3H5M9 10l-4 4 4 4"/></svg>',
  reiniciar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg>',
  casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z"/></svg>',
  cadeado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  raio: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7Z"/></svg>',
  relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
  balao: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6v2h-1v5.5l5.6 9.3A2.1 2.1 0 0 1 17.8 22H6.2a2.1 2.1 0 0 1-1.8-3.2L10 9.5V4H9Z"/></svg>',
  pessoas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5.5 5"/></svg>',
};

const p = new URLSearchParams(location.search);
const TELA = p.get('tela') || 'menu';
const MOBILE = p.get('disp') === 'mobile';
const TEMA = p.get('tema') || 'escuro';

// ---------- Estados de exemplo ----------
const PARTIDA_MEIO = [1,2,3,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,26,27,28,29,30,35,
  36,47,50,53,54,55,56,74,78,79,80,82,86,88,92,94,24,25,33,34,5,4];
const FALTARAM = [21,39,43,59,61,63,64,65,66,67,68,69,70,71,72,73,75,76,77,81,85,89,91,93,
  97,98,101,103,104,106,107,111];
const TODOS = ELEMENTOS.map(e => e[0]);

function simbolo(z) { return ELEMENTOS[z - 1][1]; }
function nome(z) { return ELEMENTOS[z - 1][2]; }

// ---------- Componentes ----------
function topo(voltar = false) {
  const esq = voltar
    ? `<div class="icone">${ICONES.voltar}</div><div class="icone" style="visibility:hidden"></div>`
    : `<div class="icone">${ICONES.ajuda}</div><div class="icone">${ICONES.trofeu}</div>`;
  return `<header class="topo">
    <div class="grupo">${esq}</div>
    <div class="logo">ELEMENTAR<span class="sim">118</span></div>
    <div class="grupo"><div class="icone">${ICONES.medalha}</div><div class="icone">${ICONES.config}</div></div>
  </header>`;
}

function vidas(total, restantes) {
  let h = '';
  for (let i = 0; i < total; i++) h += `<i class="${i < restantes ? '' : 'perdida'}">${ICONES.coracao}</i>`;
  return `<div class="vidas">${h}</div>`;
}

function hud({ tempo = '08:37', acertos = 47, pontos = 940, vidasTotal = 5, vidasRest = 4, alerta = false } = {}) {
  const botoes = MOBILE
    ? `<div class="botao" style="padding:10px">${ICONES.pausa}</div>`
    : `<div class="botao">${ICONES.pausa} Pausar</div><div class="botao perigo">${ICONES.bandeira} Desistir</div>`;
  return `<section class="hud">
    <div class="stat tempo ${alerta ? 'alerta' : ''}"><small>Tempo</small><b>${tempo}</b></div>
    <div class="stat"><small>Acertos</small><b>${acertos}<span style="font-size:.6em;color:var(--texto-suave)">/118</span></b></div>
    <div class="stat"><small>Pontos</small><b>${pontos}</b></div>
    <div class="stat"><small>Vidas</small>${vidas(vidasTotal, vidasRest)}</div>
    ${botoes}
  </section>`;
}

function entrada(texto = '', estado = '') {
  const conteudo = texto
    ? `${texto}<span class="cursor"></span>`
    : `<span class="cursor"></span><span class="dica">&nbsp;Digite o nome de um elemento…</span>`;
  return `<section class="entrada">
    <div class="campo ${estado}">${conteudo}</div>
    <div class="botao primario">${MOBILE ? ICONES.enter : 'Enter ' + ICONES.enter}</div>
  </section>`;
}

function toast(tipo, rotulo, msg, topoPx) {
  return `<div class="toast" style="top:${topoPx}px"><span class="tag ${tipo}">${rotulo}</span>${msg}</div>`;
}

// modo: 'numero' (normal), 'simbolo' (fácil: dica), 'nada' (difícil)
function tabela({ certos = [], faltou = [], novo = null, repetido = null, j2 = [], modo = 'numero', classe = '' } = {}) {
  const setCerto = new Set(certos), setFaltou = new Set(faltou), setJ2 = new Set(j2);
  let h = '';
  for (const [z, s, n] of ELEMENTOS) {
    const [lin, col] = posicao(z);
    let cls = 'cel', dentro = '';
    const num = modo === 'nada' && !setCerto.has(z) && !setJ2.has(z) ? '' : `<span class="n">${z}</span>`;
    if (setCerto.has(z) || setJ2.has(z)) {
      cls += setJ2.has(z) ? ' j2' : ' certo';
      if (z === novo) cls += ' novo';
      if (z === repetido) cls = 'cel repetido';
      dentro = `${num}<span class="s">${s}</span><span class="nome">${n}</span>`;
    } else if (setFaltou.has(z)) {
      cls += ' faltou';
      dentro = `${num}<span class="s">${s}</span><span class="nome">${n}</span>`;
    } else {
      dentro = num + (modo === 'simbolo' ? `<span class="s fantasma">${s}</span>` : '');
    }
    h += `<div class="${cls}" style="grid-row:${lin};grid-column:${col}">${dentro}</div>`;
  }
  // marcadores dos blocos f
  h += `<div class="cel marca" style="grid-row:6;grid-column:3"><span class="n">57–71</span></div>`;
  h += `<div class="cel marca" style="grid-row:7;grid-column:3"><span class="n">89–103</span></div>`;
  return `<div class="tabela ${classe}">${h}</div>`;
}

function legenda() {
  return `<div class="legenda">
    <span><i style="background:var(--certo)"></i>Acertou</span>
    <span><i style="background:var(--repetido)"></i>Já digitado</span>
    <span><i style="background:var(--erro)"></i>Não existe</span>
    <span><i style="background:var(--celula)"></i>Falta descobrir</span>
  </div>`;
}

function recentes(lista) {
  if (!MOBILE) return '';
  return `<div class="recentes"><em>Últimos:</em>${lista.map(z => `<span>${simbolo(z)} · ${nome(z)}</span>`).join('')}</div>`;
}

function areaTabela(opts) {
  return `<section class="area-tabela">${tabela(opts)}</section>${MOBILE ? '<div class="deslize">← arraste para ver a tabela inteira →</div>' : ''}`;
}

function jogo({ toastHtml = '', campo = '', estadoCampo = '', tab = {}, hudOpts = {} } = {}) {
  return topo() + hud(hudOpts) + entrada(campo, estadoCampo) + recentes([26, 79, 47]) + areaTabela(tab) + toastHtml;
}

// ---------- Telas ----------
const TELAS = {
  menu() {
    const mini = tabela({ certos: [1, 2, 6, 7, 8, 26, 29, 47, 79, 80, 10, 18, 11, 17, 92, 13], classe: 'mini' });
    return topo() + `<main class="menu">
      <div class="logo">ELEMENTAR<span class="sim">118</span></div>
      <p class="slogan">Quantos dos <b>118 elementos</b> da tabela periódica<br>você consegue lembrar?</p>
      ${MOBILE ? '' : mini}
      <div class="botoes">
        <div class="botao primario grande">${ICONES.play} Iniciar jogo</div>
        <div class="botao grande">${ICONES.trofeu} Ranking</div>
        <div class="botao grande fantasma">${ICONES.ajuda} Como jogar</div>
      </div>
      <div class="recorde"><span>Seu recorde: <b>1.980 pts</b></span><span>Melhor tabela: <b>97/118</b></span></div>
    </main>`;
  },

  'como-jogar'() {
    return TELAS.menu() + `<div class="overlay"><div class="modal">
      <div class="fechar">${ICONES.x}</div>
      <h2>Como jogar</h2>
      <p class="sub">Complete a tabela periódica antes do tempo acabar.</p>
      <p>Digite o nome de um elemento e aperte <b>Enter</b>. Se ele existir, a casa dele se preenche na tabela.</p>
      <hr>
      <div class="exemplo"><div class="cel certo"><span class="n">26</span><span class="s">Fe</span><span class="nome">Ferro</span></div>
        <p><b>Acertou:</b> a casa fica verde e você ganha pontos.</p></div>
      <div class="exemplo"><div class="cel repetido"><span class="n">29</span><span class="s">Cu</span><span class="nome">Cobre</span></div>
        <p><b>Já digitado:</b> a casa pisca em amarelo. Não perde nada.</p></div>
      <div class="exemplo"><div class="cel" style="background:var(--erro)"><span class="s" style="font-size:18px">?</span></div>
        <p><b>Não existe:</b> o campo treme e você perde uma vida.</p></div>
      <hr>
      <ul>
        <li>Acentos e maiúsculas não importam: <i>helio</i> = <i>Hélio</i>.</li>
        <li>A partida acaba quando o tempo zera, as vidas acabam ou você desiste.</li>
        <li>Complete os 118 para vencer e ganhar bônus pelo tempo que sobrou.</li>
      </ul>
      <div class="acoes"><div class="botao primario bloco">Entendi</div></div>
    </div></div>`;
  },

  'nova-partida'() {
    return TELAS.menu() + `<div class="overlay"><div class="modal">
      <div class="fechar">${ICONES.x}</div>
      <h2>Nova partida</h2>
      <div class="rotulo">Seu nome</div>
      <div class="input">Ana<span class="cursor" style="display:inline-block;width:2px;height:1em;background:var(--texto);vertical-align:-2px"></span></div>
      <div class="rotulo">Modo</div>
      <div class="segmento"><span class="sel">Solo</span><span>2 jogadores</span></div>
      <div class="rotulo">Dificuldade</div>
      <div class="opcoes">
        <div class="opcao"><b>Fácil</b><span class="t">15:00</span><small>Símbolos aparecem como dica · vidas infinitas · pontos ×1</small></div>
        <div class="opcao sel"><b>Normal</b><span class="t">12:00</span><small>Só o número atômico · 5 vidas · pontos ×2</small></div>
        <div class="opcao"><b>Difícil</b><span class="t">10:00</span><small>Tabela sem números · 3 vidas · pontos ×3</small></div>
      </div>
      <div class="acoes"><div class="botao primario grande bloco">${ICONES.play} Começar</div></div>
    </div></div>`;
  },

  jogo() {
    return jogo({
      tab: { certos: PARTIDA_MEIO, novo: 79 },
      toastHtml: toast('certo', '+20', 'Acertou! <b>Ouro (Au)</b>', MOBILE ? 250 : 196),
    }) + (MOBILE ? '' : legenda());
  },

  'jogo-erro'() {
    return jogo({
      campo: 'Kryptonita', estadoCampo: 'erro',
      tab: { certos: PARTIDA_MEIO },
      hudOpts: { vidasRest: 3 },
      toastHtml: toast('erro', '−1 vida', 'Esse elemento não existe', MOBILE ? 250 : 196),
    }) + (MOBILE ? '' : legenda());
  },

  'jogo-repetido'() {
    return jogo({
      campo: 'Cobre', estadoCampo: 'repetido',
      tab: { certos: PARTIDA_MEIO, repetido: 29 },
      toastHtml: toast('repetido', 'Já foi', '<b>Cobre</b> já está na tabela', MOBILE ? 250 : 196),
    }) + (MOBILE ? '' : legenda());
  },

  'jogo-combo'() {
    return jogo({
      tab: { certos: [...PARTIDA_MEIO, 76, 77], novo: 77 },
      hudOpts: { acertos: 50, pontos: 1040 },
      toastHtml: toast('certo', '<span style="display:inline-flex;width:14px;vertical-align:-2px">' + ICONES.raio + '</span> Combo ×5', '5 acertos seguidos! <b>+40 bônus</b>', MOBILE ? 250 : 196),
    }) + (MOBILE ? '' : legenda());
  },

  'jogo-facil'() {
    return jogo({ tab: { certos: PARTIDA_MEIO.slice(0, 20), modo: 'simbolo' }, hudOpts: { tempo: '13:12', acertos: 20, pontos: 200, vidasTotal: 0 } })
      .replace(/<div class="stat"><small>Vidas<\/small><div class="vidas"><\/div><\/div>/, '<div class="stat"><small>Vidas</small><b>∞</b></div>')
      + (MOBILE ? '' : legenda());
  },

  'jogo-ultimo-minuto'() {
    return jogo({ tab: { certos: TODOS.filter(z => !FALTARAM.includes(z)) }, hudOpts: { tempo: '00:42', acertos: 86, pontos: 1720, vidasRest: 1, alerta: true },
      toastHtml: toast('erro', `<span style="display:inline-flex;width:14px;vertical-align:-2px">${ICONES.relogio}</span>`, 'Menos de 1 minuto!', MOBILE ? 250 : 196) }) + (MOBILE ? '' : legenda());
  },

  pausa() {
    return topo() + hud({}) + entrada() + areaTabela({ certos: PARTIDA_MEIO, classe: 'oculta' }) + `<div class="overlay"><div class="modal" style="width:${MOBILE ? '' : '420px'}">
      <h2>Pausado</h2>
      <p class="sub">A tabela fica escondida enquanto o jogo está pausado.</p>
      <div class="resumo" style="grid-template-columns:repeat(3,1fr)">
        <div><b>08:37</b><small>Tempo</small></div><div><b>47</b><small>Acertos</small></div><div><b>940</b><small>Pontos</small></div>
      </div>
      <div class="acoes" style="flex-direction:column">
        <div class="botao primario grande bloco">${ICONES.play} Continuar</div>
        <div class="botao bloco">${ICONES.reiniciar} Reiniciar partida</div>
        <div class="botao bloco fantasma">${ICONES.casa} Voltar ao menu</div>
      </div>
    </div></div>`;
  },

  'confirmar-desistir'() {
    return topo() + hud({}) + entrada() + areaTabela({ certos: PARTIDA_MEIO, classe: 'oculta' }) + `<div class="overlay"><div class="modal" style="width:${MOBILE ? '' : '420px'}">
      <h2>Desistir?</h2>
      <p class="sub">Os elementos que faltam serão revelados e a partida termina como derrota. Sua pontuação ainda vai para o ranking.</p>
      <div class="acoes">
        <div class="botao">Continuar jogando</div>
        <div class="botao perigo">${ICONES.bandeira} Desistir</div>
      </div>
    </div></div>`;
  },

  vitoria() {
    return topo() + hud({ tempo: '02:18', acertos: 118, pontos: 2636, vidasRest: 3 }) + areaTabela({ certos: TODOS }) + `<div class="overlay"><div class="modal">
      <div class="fechar">${ICONES.x}</div>
      <h2>Tabela completa! 🎉</h2>
      <p class="sub">Você lembrou dos 118 elementos com 2:18 de sobra.</p>
      <div class="resumo">
        <div><b>2.636</b><small>Pontos</small></div><div><b>118</b><small>Acertos</small></div>
        <div><b>09:42</b><small>Tempo</small></div><div><b>2</b><small>Erros</small></div>
      </div>
      <p style="font-size:14px;color:var(--texto-suave);text-align:center">2.360 pelos acertos + 276 de bônus de tempo (138 s × 2)</p>
      <div class="selo"><div class="medalha">${ICONES.trofeu}</div><div><b>Novo recorde pessoal!</b><small>1º lugar no ranking Normal</small></div></div>
      <div class="selo"><div class="medalha">${ICONES.medalha}</div><div><b>Conquista: Mendeleiev</b><small>Complete a tabela inteira</small></div></div>
      <div class="acoes">
        <div class="botao primario">${ICONES.reiniciar} Jogar novamente</div>
        <div class="botao">${ICONES.trofeu} Ranking</div>
        <div class="botao fantasma">${ICONES.casa} Menu</div>
      </div>
    </div></div>`;
  },

  derrota() {
    return topo() + hud({ tempo: '00:00', acertos: 86, pontos: 1720, vidasRest: 2, alerta: true }) + areaTabela({ certos: TODOS.filter(z => !FALTARAM.includes(z)), faltou: FALTARAM }) + `<div class="overlay" style="place-items:${MOBILE ? 'end center' : 'center'};padding-bottom:${MOBILE ? '12px' : '0'}"><div class="modal">
      <div class="fechar">${ICONES.x}</div>
      <h2>Tempo esgotado!</h2>
      <p class="sub">Faltaram 32 elementos. Eles estão marcados em vermelho na tabela.</p>
      <div class="barra"><i style="width:73%"></i></div>
      <p style="font-size:13px;color:var(--texto-suave);text-align:right;margin-bottom:10px">86 de 118 (73%)</p>
      <div class="resumo">
        <div><b>1.720</b><small>Pontos</small></div><div><b>86</b><small>Acertos</small></div>
        <div><b>12:00</b><small>Tempo</small></div><div><b>3</b><small>Erros</small></div>
      </div>
      <div class="acoes">
        <div class="botao primario">${ICONES.reiniciar} Jogar novamente</div>
        <div class="botao">Ver tabela</div>
        <div class="botao fantasma">${ICONES.casa} Menu</div>
      </div>
    </div></div>`;
  },

  'sem-vidas'() {
    return TELAS.derrota().replace('Tempo esgotado!', 'Suas vidas acabaram!').replace('00:00', '04:51')
      .replace('<b>12:00</b><small>Tempo</small>', '<b>07:09</b><small>Tempo</small>').replace('<b>3</b><small>Erros</small>', '<b>5</b><small>Erros</small>')
      .replace(/vidas"><i class="">/, 'vidas"><i class="perdida">');
  },

  ranking() {
    const linhas = [
      ['Ana', 2636, '118', '09:42', true], ['Pedro', 2410, '118', '11:05'], ['Julia', 1980, '99', '12:00'],
      ['Lucas', 1720, '86', '12:00'], ['Marina', 1540, '77', '12:00'], ['Rafa', 1300, '65', '12:00'],
      ['Bia', 1160, '58', '09:31'], ['Theo', 980, '49', '12:00'],
    ];
    const tr = linhas.map(([n, pts, ac, t, voce], i) => `<tr class="${voce ? 'voce' : ''}">
      <td>${i < 3 ? `<span class="pos p${i + 1}">${i + 1}</span>` : i + 1}</td>
      <td>${n}${voce ? ' <span class="pill" style="background:rgba(255,255,255,.25)">você</span>' : ''}</td>
      <td class="num">${pts.toLocaleString('pt-BR')}</td><td class="num">${ac}${MOBILE ? '' : '/118'}</td>${MOBILE ? '' : `<td class="num">${t}</td><td class="num">01/10/2026</td>`}</tr>`).join('');
    return topo(true) + `<main class="pagina">
      <h1>Ranking</h1>
      <div class="segmento" style="margin-bottom:12px"><span>Fácil</span><span class="sel">Normal</span><span>Difícil</span></div>
      <table class="ranking">
        <tr><th>#</th><th>Jogador</th><th class="num">Pontos</th><th class="num">Acertos</th>${MOBILE ? '' : '<th class="num">Tempo</th><th class="num">Data</th>'}</tr>
        ${tr}
      </table>
      <div class="acoes" style="margin-top:auto;padding-top:14px">
        <div class="botao primario">${ICONES.play} Jogar</div>
        <div class="botao fantasma">${ICONES.casa} Menu</div>
      </div>
    </main>`;
  },

  conquistas() {
    const lista = [
      ['Primeiro contato', 'Acerte seu primeiro elemento', true, ICONES.balao],
      ['Gases nobres', 'Complete toda a coluna 18', true, ICONES.balao],
      ['Metais alcalinos', 'Complete toda a coluna 1', true, ICONES.balao],
      ['Relâmpago', 'Acerte 10 elementos em 30 segundos', true, ICONES.raio],
      ['Sem errar', 'Termine uma partida sem nenhum erro', false, ICONES.coracao],
      ['Terras raras', 'Complete todos os lantanídeos', false, ICONES.medalha],
      ['Meio caminho', 'Acerte 59 elementos numa partida', true, ICONES.medalha],
      ['Mendeleiev', 'Complete a tabela inteira', false, ICONES.trofeu],
      ['Mestre', 'Complete a tabela no Difícil', false, ICONES.trofeu],
    ];
    const cards = lista.map(([t, d, ok, ic]) => `<div class="conquista ${ok ? '' : 'bloq'}"><div class="medalha">${ok ? ic : ICONES.cadeado}</div><div><b>${t}</b><small>${d}</small></div></div>`).join('');
    return topo(true) + `<main class="pagina" style="max-width:980px">
      <h1>Conquistas</h1>
      <p style="text-align:center;color:var(--texto-suave);margin:-8px 0 14px">5 de 9 desbloqueadas</p>
      <div class="conquistas">${cards}</div>
    </main>`;
  },

  config() {
    return TELAS.menu() + `<div class="overlay"><div class="modal">
      <div class="fechar">${ICONES.x}</div>
      <h2>Configurações</h2>
      <div class="linha-config"><div><p>Efeitos sonoros</p><small>Som de acerto, erro e fim de jogo</small></div><div class="chave on"></div></div>
      <div class="linha-config"><div><p>Música de fundo</p></div><div class="chave"></div></div>
      <div class="linha-config"><div><p>Tema claro</p><small>O padrão é o tema escuro</small></div><div class="chave"></div></div>
      <div class="linha-config"><div><p>Alto contraste</p><small>Cores para daltonismo</small></div><div class="chave"></div></div>
      <div class="linha-config" style="border:0"><div><p>Apagar ranking e conquistas</p><small>Remove os dados salvos neste navegador</small></div><div class="botao perigo" style="padding:8px 14px;font-size:14px">Apagar</div></div>
    </div></div>`;
  },

  multiplayer() {
    const a = [1, 6, 8, 26, 29, 47, 79, 11, 17, 20, 2, 10, 18, 13, 30, 50, 82, 80];
    const b = [7, 3, 9, 19, 12, 14, 15, 16, 28, 27, 53, 92, 78, 54];
    return topo() + `<section class="hud">
        <div class="stat tempo"><small>Tempo</small><b>07:15</b></div>
        <div class="jog vez"><span class="cor" style="background:var(--certo)"></span><div><small>Ana · sua vez</small><b>18</b></div></div>
        <div class="jog b"><span class="cor" style="background:var(--jogador2)"></span><div><small>Pedro</small><b>14</b></div></div>
        ${MOBILE ? `<div class="botao" style="padding:10px">${ICONES.pausa}</div>` : `<div class="botao">${ICONES.pausa} Pausar</div>`}
      </section>` + entrada() + areaTabela({ certos: a, j2: b }) +
      toast('certo', 'Vez da Ana', 'Cada um tem 10 s por jogada', MOBILE ? 250 : 196);
  },
};

// ---------- Montagem ----------
document.title = `ELEMENTAR 118 · ${TELA}`;
const frame = document.createElement('div');
frame.className = `frame ${MOBILE ? 'mobile' : ''} ${TEMA === 'claro' ? 'tema-claro' : ''}`;
frame.innerHTML = (TELAS[TELA] || TELAS.menu)();
document.body.appendChild(frame);
if (TEMA === 'claro') document.body.classList.add('tema-claro');
