# Casos de uso

![Diagrama de casos de uso](casos-de-uso.png)

Fonte editável: [`casos-de-uso.puml`](casos-de-uso.puml) (PlantUML). A imagem é gerada por
[`gerar-diagrama.py`](gerar-diagrama.py).

Ator único: **Jogador** (no modo em dupla, os dois jogadores usam o mesmo dispositivo e são o
mesmo ator).

## Por que cada `<<include>>` e `<<extend>>`

**`<<include>>`**: o caso base *sempre* executa o incluído.

| Base | Incluído | Motivo |
|---|---|---|
| UC02 Iniciar partida | UC03 Selecionar dificuldade | Toda partida precisa de uma dificuldade (tempo, vidas, multiplicador). O Normal vem pré-selecionado. |
| UC05 Jogar partida | UC06 Validar resposta | Cada nome enviado passa pela validação. |
| UC06 Validar resposta | UC07 Atualizar pontuação | Toda validação mexe no placar: soma pontos, tira vida ou quebra o combo. |
| UC05 Jogar partida | UC10 Encerrar partida | Toda partida termina em vitória ou derrota. |
| UC10 Encerrar partida | UC15 Salvar pontuação | Todo resultado vai para o ranking no `localStorage`. |

**`<<extend>>`**: o caso de extensão acontece *só às vezes*, sob uma condição.

| Extensão | Base | Condição (ponto de extensão) |
|---|---|---|
| UC04 Jogar em dupla | UC02 Iniciar partida | O jogador escolhe o modo "2 jogadores". |
| UC08 Pausar partida | UC05 Jogar partida | O jogador aperta Pausar ou `Esc`. |
| UC09 Desistir da partida | UC05 Jogar partida | O jogador aperta Desistir e confirma. |
| UC14 Desbloquear conquista | UC06 Validar resposta | O acerto completa a condição de alguma conquista. |
| UC16 Jogar novamente | UC10 Encerrar partida | O jogador escolhe "Jogar novamente" no fim da partida. |

## Descrição resumida

| ID | Caso de uso | Resumo | Telas |
|---|---|---|---|
| UC01 | Consultar instruções | Abre o modal "Como jogar". | 02 |
| UC02 | Iniciar partida | Informa o nome, escolhe modo e dificuldade e começa com a tabela em branco. | 01, 03 |
| UC03 | Selecionar dificuldade | Fácil, Normal ou Difícil. | 03 |
| UC04 | Jogar em dupla | Dois jogadores alternam a vez; cada um tem uma cor na tabela. | 18 |
| UC05 | Jogar partida | Digita nomes de elementos até o tempo ou as vidas acabarem. | 04–09 |
| UC06 | Validar resposta | Normaliza o texto (sem acento, maiúscula ou espaço) e compara com os 118 nomes e sinônimos. Resultado: acerto, repetido ou inexistente. | 04, 05, 06 |
| UC07 | Atualizar pontuação | Soma pontos, aplica combo, desconta vida. | 04, 05, 07 |
| UC08 | Pausar partida | Para o cronômetro e esconde a tabela. | 10 |
| UC09 | Desistir da partida | Pede confirmação e encerra como derrota. | 11 |
| UC10 | Encerrar partida | Vitória (118/118) ou derrota (tempo, vidas ou desistência); mostra o resumo e revela os que faltaram. | 12, 13, 14 |
| UC11 | Consultar ranking | Top 10 por dificuldade. | 15 |
| UC12 | Configurar preferências | Som, música, tema claro/escuro, alto contraste, apagar dados. | 17, 19 |
| UC13 | Consultar conquistas | Lista as bloqueadas e as desbloqueadas. | 16 |
| UC14 | Desbloquear conquista | Mostra a conquista e salva no `localStorage`. | 12 |
| UC15 | Salvar pontuação | Grava nome, pontos, acertos, tempo, dificuldade e data. | — |
| UC16 | Jogar novamente | Reinicia com as mesmas configurações, sem recarregar a página. | 12, 13 |
