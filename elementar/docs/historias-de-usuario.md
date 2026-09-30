# Histórias de usuário

Formato: *Como jogador, quero … para …*, com critérios de aceitação. Cada história vem de um
caso de uso ([casos-de-uso.md](casos-de-uso.md)) e vira um cartão no Trello.
Prioridade: **M** = obrigatório pela especificação, **E** = extra (vale pontuação adicional).

### HU01 · Ver as instruções (UC01) · M
Como jogador, quero ler como o jogo funciona para saber o que fazer antes de começar.
- [ ] O menu mostra o nome do jogo, uma frase de apresentação e o botão "Como jogar".
- [ ] O modal explica as três respostas (acertou, já digitado, não existe), as condições de fim e a pontuação.
- [ ] O modal fecha pelo X, pelo botão "Entendi" ou pela tecla `Esc`.

### HU02 · Começar uma partida (UC02) · M
Como jogador, quero iniciar uma partida pelo menu para jogar sem configurar nada além do necessário.
- [ ] "Iniciar jogo" abre o modal Nova partida com campo de nome (lembra o último nome usado).
- [ ] "Começar" mostra a tabela em branco, com o cronômetro correndo e o foco no campo de resposta.

### HU03 · Escolher a dificuldade (UC03) · E
Como jogador, quero escolher a dificuldade para o desafio combinar com o que eu sei.
- [ ] Fácil: 15:00, símbolos visíveis como dica, vidas infinitas, pontos ×1.
- [ ] Normal (padrão): 12:00, só o número atômico, 5 vidas, pontos ×2.
- [ ] Difícil: 10:00, casas sem número, 3 vidas, pontos ×3.

### HU04 · Digitar um elemento (UC05, UC06) · M
Como jogador, quero digitar o nome de um elemento e ver a tabela se completar para acompanhar meu progresso.
- [ ] `Enter` ou o botão envia a resposta e limpa o campo.
- [ ] Acentos, maiúsculas e espaços são ignorados (`helio` = `Hélio`), e sinônimos são aceitos (ex.: Azoto, Volfrâmio).
- [ ] **Acertou:** a casa fica verde com símbolo e nome, com animação de virar (como no Termo).
- [ ] **Já digitado:** a casa pisca em amarelo e aparece o aviso "já está na tabela". Não perde vida.
- [ ] **Não existe:** o campo treme em vermelho e aparece "Esse elemento não existe".

### HU05 · Ver pontuação, tempo e vidas (UC07) · M
Como jogador, quero ver meu placar o tempo todo para saber como estou indo.
- [ ] O HUD mostra tempo restante, acertos (x/118), pontos e vidas.
- [ ] Acerto: +10 × multiplicador da dificuldade.
- [ ] Combo: a cada 5 acertos seguidos sem erro, +40 de bônus e a mensagem "Combo".
- [ ] Erro: −1 vida (fora do Fácil) e o combo zera.
- [ ] Com menos de 1 minuto, o cronômetro fica vermelho e aparece um aviso.

### HU06 · Pausar (UC08) · M (recomendado)
Como jogador, quero pausar a partida para sair um momento sem perder tempo.
- [ ] O botão Pausar ou `Esc` para o cronômetro e desfoca a tabela, para ninguém consultar nada durante a pausa.
- [ ] O menu de pausa tem Continuar, Reiniciar partida e Voltar ao menu.

### HU07 · Desistir (UC09) · M
Como jogador, quero desistir para ver as respostas quando não lembrar de mais nada.
- [ ] Desistir pede confirmação.
- [ ] Ao confirmar, a partida vira derrota e a pontuação vai para o ranking.

### HU08 · Vencer (UC10) · M
Como jogador, quero ser recompensado quando completar a tabela para sentir que venci.
- [ ] Com 118/118, aparece "Tabela completa!" com pontos, acertos, tempo e erros.
- [ ] Bônus de vitória: segundos restantes × 2.
- [ ] Se for recorde, aparece o aviso "Novo recorde pessoal!".

### HU09 · Perder (UC10) · M
Como jogador, quero ver o que faltou quando perco para aprender os elementos que esqueci.
- [ ] A derrota acontece quando o tempo zera, quando as vidas acabam ou quando o jogador desiste, e a mensagem diz qual foi o motivo.
- [ ] Os elementos não descobertos aparecem em vermelho na tabela.
- [ ] Uma barra mostra a porcentagem concluída.

### HU10 · Jogar de novo (UC16) · M
Como jogador, quero jogar de novo ou voltar ao menu sem recarregar a página.
- [ ] As telas de vitória e derrota têm Jogar novamente (mesmas configurações) e Menu.
- [ ] O estado é zerado sem `location.reload()`.

### HU11 · Salvar e ver o ranking (UC11, UC15) · M
Como jogador, quero ver as melhores pontuações para comparar com as minhas anteriores e com as de amigos.
- [ ] Toda partida encerrada é salva no `localStorage` com nome, pontos, acertos, tempo, dificuldade e data.
- [ ] A tela de ranking mostra o top 10 com abas por dificuldade e destaca a última partida.
- [ ] Desempate: mais acertos e, depois, menos tempo.

### HU12 · Configurar som e tema (UC12) · E
Como jogador, quero ligar ou desligar os sons e trocar o tema para jogar do meu jeito.
- [ ] Liga/desliga efeitos sonoros (acerto, erro, fim) e música.
- [ ] Alterna entre tema escuro (padrão) e claro, além do modo de alto contraste.
- [ ] As preferências ficam salvas no `localStorage`.

### HU13 · Conquistas (UC13, UC14) · E
Como jogador, quero desbloquear conquistas para ter objetivos além da pontuação.
- [ ] Nove conquistas, por exemplo: Gases nobres (coluna 18), Metais alcalinos (coluna 1), Terras raras (lantanídeos), Relâmpago (10 acertos em 30 s), Sem errar e Mendeleiev (tabela completa).
- [ ] O desbloqueio aparece durante a partida e no resumo final.
- [ ] A tela de conquistas mostra as bloqueadas com cadeado.

### HU14 · Jogar em dupla (UC04) · E
Como jogador, quero jogar com um amigo no mesmo computador para competir.
- [ ] Os jogadores alternam a vez; um erro ou 10 s sem resposta passa a vez.
- [ ] Cada jogador tem uma cor na tabela (verde e azul) e um placar próprio.
- [ ] Vence quem tiver mais acertos quando a tabela completar ou o tempo acabar.

### HU15 · Jogar no celular (requisito não funcional) · M
Como jogador, quero jogar pelo celular para jogar em qualquer lugar.
- [ ] O layout se adapta a partir de 360 px de largura, sem rolagem horizontal na página.
- [ ] Só a tabela rola na horizontal, e o campo de resposta fica fixo no topo, acima do teclado.
- [ ] O celular mostra os últimos acertos, porque a tabela não cabe inteira na tela.
