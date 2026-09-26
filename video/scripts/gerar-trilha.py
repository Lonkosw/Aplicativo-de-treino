"""Sintetiza a trilha do vídeo promocional (eletrônica limpa, 120 BPM, Lá menor).

Tudo é gerado por código, então não há direitos autorais envolvidos.
A estrutura acompanha a linha do tempo do vídeo (22 s = 11 compassos):

  0-4 s    intro: pad + arpejo abrindo o filtro (gancho da pergunta)
  4 s      entrada da batida, junto com a primeira tela do app
  8 s      entram as palmas
  18-18.5  virada; batida para e fica só o acorde final
  18.5-22  final (logo e CTA), com fade

Uso: python3 scripts/gerar-trilha.py public/trilha.wav
"""

import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
DURACAO = 22.0
N = int(SR * DURACAO)
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def lowpass(x, fc):
    return sosfilt(butter(2, fc, fs=SR, output="sos"), x)


def highpass(x, fc):
    return sosfilt(butter(2, fc, btype="high", fs=SR, output="sos"), x)


def saw(f, t):
    return 2 * ((f * t) % 1.0) - 1


def add(buf, sinal, inicio):
    i = int(inicio * SR)
    if i >= len(buf):
        return
    fim = min(len(buf), i + len(sinal))
    buf[i:fim] += sinal[: fim - i]


# Am, F, C, G (tríades, oitava 4) e as fundamentais do baixo.
ACORDES = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
BAIXOS = [45, 41, 48, 43]


def acorde_em(tempo):
    return int(tempo // BAR) % 4


t_total = np.arange(N) / SR

# --- Pad: serras desafinadas por acorde, filtradas e com ataque lento.
pad = np.zeros(N)


def camada_pad(notas, inicio, dur, release):
    t = np.arange(int(dur * SR)) / SR
    s = sum(saw(hz(n) * d, t) for n in notas for d in (0.997, 1.003))
    env = np.clip(np.minimum(t / 0.4, (dur - t) / release), 0, 1)
    add(pad, s * env / 6, inicio)


# Compassos normais até a virada de 18 s; depois o Lá menor final até o fim.
for compasso in range(9):
    camada_pad(ACORDES[compasso % 4], compasso * BAR, BAR, 0.15)
camada_pad(ACORDES[0] + [45], 18.5, DURACAO - 18.5, 0.3)
pad = lowpass(pad, 1400)

# --- Arpejo em semicolcheias: filtro abre durante a intro.
arp = np.zeros(N)
passo = BEAT / 4
padrao = [0, 1, 2, 1, 0, 2, 1, 2]
k = 0
tempo = 0.0
while tempo < 18.5:
    notas = ACORDES[acorde_em(tempo)]
    nota = notas[padrao[k % 8]] + 12
    t = np.arange(int(0.22 * SR)) / SR
    brilho = min(1.0, 0.35 + tempo / 4 * 0.65)
    s = (saw(hz(nota), t) * 0.5 + np.sin(2 * np.pi * hz(nota) * t)) * np.exp(-t * 18)
    add(arp, s * (0.10 + 0.08 * brilho), tempo)
    k += 1
    tempo += passo
# Acorde final dedilhado.
for i, n in enumerate([57, 60, 64, 69]):
    t = np.arange(int(3 * SR)) / SR
    s = np.sin(2 * np.pi * hz(n + 12) * t) * np.exp(-t * 1.6)
    add(arp, s * 0.16, 18.5 + i * 0.06)
arp = lowpass(arp, 5000)

# --- Bateria (4 s a 18 s).
kick = np.zeros(N)
hat = np.zeros(N)
clap = np.zeros(N)
bumbos = []
t = np.arange(int(0.35 * SR)) / SR
som_kick = np.sin(2 * np.pi * (45 * t + 90 * (1 - np.exp(-t * 30)) / 30)) * np.exp(-t * 9)
som_hat = highpass(rng.standard_normal(int(0.05 * SR)), 7000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 70)
tc = np.arange(int(0.2 * SR)) / SR
som_clap = lowpass(highpass(rng.standard_normal(len(tc)), 900), 5000) * np.exp(-tc * 22)
tempo = 4.0
while tempo < 18.0 - 1e-6:
    add(kick, som_kick, tempo)
    bumbos.append(tempo)
    add(hat, som_hat * 0.25, tempo + BEAT / 2)
    batida = round((tempo - 4.0) / BEAT) % 4
    if tempo >= 8.0 and batida in (1, 3):
        add(clap, som_clap * 0.35, tempo)
    tempo += BEAT
# Impacto final no acorde de 18,5 s.
add(kick, som_kick, 18.5)
bumbos.append(18.5)

# --- Baixo no contratempo (4 s a 18 s).
baixo = np.zeros(N)
tempo = 4.0
while tempo < 18.0 - 1e-6:
    nota = BAIXOS[acorde_em(tempo)]
    tb = np.arange(int(BEAT / 2 * 0.9 * SR)) / SR
    s = (np.sin(2 * np.pi * hz(nota) * tb) + 0.3 * saw(hz(nota), tb)) * np.minimum(1, tb / 0.005) * np.exp(-tb * 4)
    add(baixo, s * 0.35, tempo + BEAT / 2)
    tempo += BEAT
baixo = lowpass(baixo, 600)

# --- Subida de ruído antes da entrada da batida e impacto em 4 s.
fx = np.zeros(N)
tr = np.arange(int(2.0 * SR)) / SR
subida = highpass(rng.standard_normal(len(tr)), 2000) * (tr / 2.0) ** 2 * 0.18
add(fx, subida, 2.0)
ti = np.arange(int(1.5 * SR)) / SR
add(fx, lowpass(rng.standard_normal(len(ti)), 3000) * np.exp(-ti * 3) * 0.15, 4.0)

# --- Sidechain: pad e arpejo "respiram" com o bumbo.
duck = np.ones(N)
for b in bumbos:
    i = int(b * SR)
    tt = np.arange(int(0.3 * SR)) / SR
    curva = 1 - 0.55 * np.exp(-tt * 12)
    fim = min(N, i + len(curva))
    duck[i:fim] = np.minimum(duck[i:fim], curva[: fim - i])

mix = (pad * 0.9 + arp) * duck + kick * 0.9 + hat + clap + baixo + fx

# Fade de entrada curto e de saída a partir de 20 s.
mix *= np.minimum(1, t_total / 0.05)
mix *= np.clip((DURACAO - t_total) / 2.0, 0, 1)

# Estéreo: arpejo e hats levemente abertos.
esq = mix + 0.15 * (arp - hat)
dir_ = mix - 0.15 * (arp - hat)
estereo = np.stack([esq, dir_], axis=1)
estereo = np.tanh(estereo / np.max(np.abs(estereo)) * 1.2) * 0.89

wavfile.write(sys.argv[1], SR, (estereo * 32767).astype(np.int16))
print("ok", sys.argv[1], f"{DURACAO}s")
