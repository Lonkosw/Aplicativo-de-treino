#!/usr/bin/env python3
"""
Gera os ícones e a splash do app em assets/.

    python3 scripts/gerar-icones.py

O desenho é uma barra com anilhas, em vermelho sobre fundo quase preto —
as mesmas cores do tema. Sem dependência de arquivo de design: se você
quiser mudar o ícone, mexa nas constantes abaixo e rode de novo.

Requer Pillow:  pip install pillow
"""

from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "assets"

FUNDO = (10, 10, 11, 255)  # cores.fundo
DESTAQUE = (225, 29, 43, 255)  # cores.destaque
TRANSPARENTE = (0, 0, 0, 0)


def desenhar_halter(tamanho: int, cor, escala: float = 1.0):
    """
    Halter com duas anilhas de cada lado, desenhado na diagonal.

    Na horizontal o desenho fica largo e baixo e vira um risco fino no
    tamanho do launcher; a 45° ele ocupa a diagonal do quadrado e continua
    legível em 48dp.
    """
    # Desenha em 4x e reduz no fim: a rotação fica sem serrilhado.
    ss = 4
    lado = tamanho * ss
    img = Image.new("RGBA", (lado, lado), TRANSPARENTE)
    d = ImageDraw.Draw(img)

    c = lado / 2
    u = lado / 100 * escala

    def peca(x0, y0, x1, y1, raio):
        d.rounded_rectangle([c + x0 * u, c + y0 * u, c + x1 * u, c + y1 * u], radius=raio * u, fill=cor)

    # Barra central
    peca(-30, -5, 30, 5, 5)
    # Anilhas internas (as maiores)
    peca(-25, -25, -13, 25, 6)
    peca(13, -25, 25, 25, 6)
    # Anilhas externas
    peca(-38, -15, -28, 15, 5)
    peca(28, -15, 38, 15, 5)

    img = img.rotate(-45, resample=Image.BICUBIC, expand=False)
    return img.resize((tamanho, tamanho), Image.LANCZOS)


def sobre_fundo(tamanho: int, escala: float = 1.0, fundo=FUNDO):
    img = Image.new("RGBA", (tamanho, tamanho), fundo)
    img.alpha_composite(desenhar_halter(tamanho, DESTAQUE, escala))
    return img


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)

    # Ícone principal (Play Store / launcher legado)
    sobre_fundo(1024, 1.0).save(DESTINO / "icone.png")

    # Ícone adaptativo do Android: o sistema recorta em círculo/squircle,
    # então o desenho precisa caber na área segura central (~66%).
    sobre_fundo(1024, 0.62).save(DESTINO / "icone-adaptativo.png")

    # Camada monocromática (tema dinâmico do Android 13+): só a silhueta.
    mono = Image.new("RGBA", (1024, 1024), TRANSPARENTE)
    mono.alpha_composite(desenhar_halter(1024, (255, 255, 255, 255), 0.62))
    mono.save(DESTINO / "icone-monocromatico.png")

    # Splash: imagem pequena e centralizada, o fundo vem do app.json.
    splash = Image.new("RGBA", (512, 512), TRANSPARENTE)
    splash.alpha_composite(desenhar_halter(512, DESTAQUE, 1.0))
    splash.save(DESTINO / "splash.png")

    # Favicon do build web (usado só em desenvolvimento).
    sobre_fundo(48, 1.0).save(DESTINO / "favicon.png")

    for arquivo in sorted(DESTINO.glob("*.png")):
        print(f"{arquivo.relative_to(RAIZ)}  {Image.open(arquivo).size}")


if __name__ == "__main__":
    main()
