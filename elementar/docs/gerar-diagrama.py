# Gera docs/casos-de-uso.svg (diagrama de casos de uso do ELEMENTAR).
# Uso: python3 docs/gerar-diagrama.py
import math, os

W, H = 1240, 900
RX, RY = 112, 34
C1, C2, C3 = 390, 720, 1040

casos = {
  'instr':  (C1, 110, 'UC01 Consultar', 'instruções'),
  'inic':   (C1, 230, 'UC02 Iniciar', 'partida'),
  'jogar':  (C1, 400, 'UC05 Jogar', 'partida'),
  'rank':   (C1, 620, 'UC11 Consultar', 'ranking'),
  'config': (C1, 720, 'UC12 Configurar', 'preferências'),
  'conq':   (C1, 820, 'UC13 Consultar', 'conquistas'),
  'dupla':  (C2, 110, 'UC04 Jogar em dupla', '(multiplayer local)'),
  'dific':  (C2, 230, 'UC03 Selecionar', 'dificuldade'),
  'valid':  (C2, 340, 'UC06 Validar', 'resposta'),
  'pausa':  (C2, 440, 'UC08 Pausar', 'partida'),
  'desist': (C2, 530, 'UC09 Desistir', 'da partida'),
  'encer':  (C2, 650, 'UC10 Encerrar partida', '(vitória / derrota)'),
  'pontos': (C3, 230, 'UC07 Atualizar', 'pontuação'),
  'conqd':  (C3, 380, 'UC14 Desbloquear', 'conquista'),
  'salvar': (C3, 650, 'UC15 Salvar', 'pontuação'),
  'nov':    (C3, 780, 'UC16 Jogar', 'novamente'),
}

# (origem, destino, tipo). include: base -> incluído. extend: extensão -> base.
relacoes = [
  ('inic', 'dific', 'include'),
  ('dupla', 'inic', 'extend'),
  ('jogar', 'valid', 'include'),
  ('valid', 'pontos', 'include'),
  ('conqd', 'valid', 'extend'),
  ('pausa', 'jogar', 'extend'),
  ('desist', 'jogar', 'extend'),
  ('jogar', 'encer', 'include'),
  ('encer', 'salvar', 'include'),
  ('nov', 'encer', 'extend'),
]
ator_liga = ['instr', 'inic', 'jogar', 'rank', 'config', 'conq']
AX, AY = 90, 450

def borda(cx, cy, tx, ty):
    """Ponto na elipse (cx, cy) na direção de (tx, ty)."""
    dx, dy = tx - cx, ty - cy
    t = 1 / math.sqrt((dx / RX) ** 2 + (dy / RY) ** 2)
    return cx + dx * t, cy + dy * t

s = []
s.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="Arial, Helvetica, sans-serif">')
s.append('''<defs>
  <marker id="seta" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse">
    <path d="M1 1 L11 6 L1 11" fill="none" stroke="#333" stroke-width="1.6"/>
  </marker>
</defs>
<rect width="100%" height="100%" fill="#ffffff"/>''')
s.append(f'<rect x="220" y="40" width="{W - 250}" height="{H - 60}" rx="6" fill="#fbfaf8" stroke="#333" stroke-width="1.6"/>')
s.append(f'<text x="{220 + (W - 250) / 2}" y="68" text-anchor="middle" font-size="20" font-weight="bold">ELEMENTAR — jogo da tabela periódica</text>')

# ator
s.append(f'''<g stroke="#333" stroke-width="2" fill="none">
  <circle cx="{AX}" cy="{AY - 50}" r="16"/>
  <line x1="{AX}" y1="{AY - 34}" x2="{AX}" y2="{AY + 10}"/>
  <line x1="{AX - 26}" y1="{AY - 18}" x2="{AX + 26}" y2="{AY - 18}"/>
  <line x1="{AX}" y1="{AY + 10}" x2="{AX - 20}" y2="{AY + 44}"/>
  <line x1="{AX}" y1="{AY + 10}" x2="{AX + 20}" y2="{AY + 44}"/>
</g>
<text x="{AX}" y="{AY + 68}" text-anchor="middle" font-size="16" font-weight="bold">Jogador</text>''')

for k in ator_liga:
    cx, cy = casos[k][:2]
    x2, y2 = cx - RX, cy  # liga na ponta esquerda para a linha não cruzar outros casos
    s.append(f'<line x1="{AX + 30}" y1="{AY - 10}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#333" stroke-width="1.4"/>')

for a, b, tipo in relacoes:
    ax, ay = casos[a][:2]; bx, by = casos[b][:2]
    x1, y1 = borda(ax, ay, bx, by); x2, y2 = borda(bx, by, ax, ay)
    cor = '#1f7a6d' if tipo == 'include' else '#9a6a12'
    s.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#333" stroke-width="1.4" stroke-dasharray="7 5" marker-end="url(#seta)"/>')
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    rot = f'&lt;&lt;{tipo}&gt;&gt;'
    s.append(f'<rect x="{mx - 42}" y="{my - 11}" width="84" height="18" fill="#fbfaf8"/>')
    s.append(f'<text x="{mx}" y="{my + 3}" text-anchor="middle" font-size="13" font-style="italic" fill="{cor}">{rot}</text>')

for k, (cx, cy, l1, l2) in casos.items():
    s.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{RX}" ry="{RY}" fill="#e6f4f1" stroke="#333" stroke-width="1.6"/>')
    s.append(f'<text x="{cx}" y="{cy - 3}" text-anchor="middle" font-size="14">{l1}</text>')
    s.append(f'<text x="{cx}" y="{cy + 15}" text-anchor="middle" font-size="14">{l2}</text>')

s.append('</svg>')
destino = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'casos-de-uso.svg')
open(destino, 'w').write('\n'.join(s))
print('ok', destino)
