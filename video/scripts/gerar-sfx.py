"""Sintetiza os efeitos sonoros próprios do vídeo em public/sfx/.

Os demais efeitos (click, ding, notificação, whip) vêm de remotion.media.

  swoosh.wav  troca de cena: ruído filtrado que sobe e desce ("swap")
  pop.wav     elemento surgindo na tela
  typing.wav  0,4 s de teclas (uma linha digitada)
  tick.wav    tique do timer de descanso
  rise.wav    10 notas subindo, uma por barra do gráfico (a cada 0,15 s)

Uso: python3 scripts/gerar-sfx.py
"""

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(3)


def t_de(seg):
    return np.arange(int(seg * SR)) / SR


def salvar(nome, x, pan=0.0):
    x = x / np.max(np.abs(x)) * 0.7
    estereo = np.stack([x * (1 - pan), x * (1 + pan)], axis=1)
    wavfile.write(f"public/sfx/{nome}", SR, (estereo * 32767).astype(np.int16))


def bandpass_varrido(ruido, f_ini, f_fim, q=2.0, blocos=64):
    """Passa-banda cujo centro vai de f_ini a f_fim (em blocos)."""
    saida = np.zeros_like(ruido)
    tam = len(ruido) // blocos + 1
    for i in range(blocos):
        fc = f_ini * (f_fim / f_ini) ** (i / (blocos - 1))
        lo, hi = fc / (1 + 1 / q), fc * (1 + 1 / q)
        sos = butter(2, [lo, min(hi, SR / 2 - 100)], btype="band", fs=SR, output="sos")
        # Filtra com margem para não gerar clique na emenda.
        a, b = max(0, i * tam - 512), min(len(ruido), (i + 1) * tam)
        y = sosfilt(sos, ruido[a:b])
        saida[i * tam : b] = y[i * tam - a :]
    return saida


# Swoosh: 0,5 s, pico em ~0,25 s, sobe de 400 Hz a 4 kHz e volta um pouco.
t = t_de(0.5)
ruido = rng.standard_normal(len(t))
varrido = bandpass_varrido(ruido, 350, 4500, q=1.6)
env = np.sin(np.pi * np.clip(t / 0.5, 0, 1)) ** 2.2
salvar("swoosh.wav", varrido * env)

# Pop: seno com queda rápida de afinação + um estalo curto.
t = t_de(0.12)
freq = 900 * np.exp(-t * 30) + 380
fase = 2 * np.pi * np.cumsum(freq) / SR
pop = np.sin(fase) * np.exp(-t * 38)
pop[: int(0.004 * SR)] += rng.standard_normal(int(0.004 * SR)) * 0.3
salvar("pop.wav", pop)

# Teclas: 8 toques curtos com timbre levemente variado.
t_total = t_de(0.45)
typing = np.zeros(len(t_total))
for i in range(8):
    inicio = int((i * 0.05 + rng.uniform(0, 0.012)) * SR)
    tt = t_de(0.03)
    clique = rng.standard_normal(len(tt)) * np.exp(-tt * 260)
    corpo = np.sin(2 * np.pi * rng.uniform(1800, 2600) * tt) * np.exp(-tt * 180) * 0.5
    som = sosfilt(butter(2, 1200, btype="high", fs=SR, output="sos"), clique + corpo)
    typing[inicio : inicio + len(som)] += som * rng.uniform(0.6, 1.0)
salvar("typing.wav", typing)

# Tique: clique agudo e seco, estilo relógio.
t = t_de(0.05)
tick = (np.sin(2 * np.pi * 3200 * t) + 0.5 * np.sin(2 * np.pi * 5100 * t)) * np.exp(-t * 160)
salvar("tick.wav", tick)

# Notas subindo (pentatônica de Lá menor), uma a cada 0,15 s.
notas = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
t_total = t_de(0.15 * len(notas) + 0.4)
rise = np.zeros(len(t_total))
for i, n in enumerate(notas):
    f = 440 * 2 ** ((n - 69) / 12)
    tt = t_de(0.35)
    som = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 14)
    som *= np.minimum(1, tt / 0.003)
    inicio = int(i * 0.15 * SR)
    rise[inicio : inicio + len(som)] += som * (0.6 + 0.04 * i)
salvar("rise.wav", rise)

print("ok")
