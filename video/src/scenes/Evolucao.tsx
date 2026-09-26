import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../fonts";

// Carga máxima no supino, semana a semana.
const SEMANAS = [70, 72.5, 75, 75, 80, 82.5, 85, 90, 92.5, 100];
const ALTURA_MAX = 760;

// Sem <Sequence>: a barra precisa ocupar espaço no flex antes de crescer.
const Barra: React.FC<{ kg: number; recorde: boolean; inicio: number }> = ({
  kg,
  recorde,
  inicio,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const altura = ((kg - 50) / 50) * ALTURA_MAX;

  return (
    <div
      style={{
        width: 64,
        height: altura,
        borderRadius: 14,
        backgroundColor: recorde ? "#E11D2B" : "#626268",
        transformOrigin: "bottom",
        scale: `1 ${interpolate(frame, [inicio, inicio + 0.5 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}`,
      }}
    />
  );
};

export const Evolucao: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Evolucao"
      style={{
        backgroundColor: "#0A0A0B",
        fontFamily,
        alignItems: "center",
        paddingTop: 200,
      }}
    >
      <Audio name="SFX barras" from={0.5 * fps} src={staticFile("sfx/rise.wav")} volume={0.5} />
      <Audio name="SFX recorde" from={2.5 * fps - 4} src={staticFile("sfx/ding.wav")} volume={0.7} />
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 100,
          fontWeight: 900,
          color: "#F5F5F7",
          letterSpacing: -3,
          textAlign: "center",
          lineHeight: 1.05,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Veja sua evolução
      </Interactive.Div>
      <Interactive.Div
        name="Subtitle"
        style={{
          fontSize: 46,
          fontWeight: 500,
          color: "#A0A0A8",
          marginTop: 24,
          opacity: interpolate(frame, [0.3 * fps, 0.7 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Gráficos e recordes de cada exercício
      </Interactive.Div>
      <Interactive.Div
        name="Record badge"
        style={{
          marginTop: 110,
          padding: "28px 48px",
          borderRadius: 999,
          backgroundColor: "#2A0D11",
          border: "3px solid #E11D2B",
          fontSize: 48,
          fontWeight: 800,
          color: "#F5F5F7",
          opacity: interpolate(frame, [2.5 * fps, 2.7 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [2.5 * fps, 3 * fps], [0.4, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 9 }),
            output: "perceptual-scale",
          }),
        }}
      >
        🏆 Novo recorde · <span style={{ color: "#E94E58" }}>100 kg</span>
      </Interactive.Div>
      <Interactive.Div
        name="Chart"
        style={{
          position: "absolute",
          bottom: 220,
          left: 100,
          right: 100,
          height: ALTURA_MAX,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderBottom: "3px solid #2E2E33",
        }}
      >
        {SEMANAS.map((kg, i) => (
          <Barra
            key={i}
            kg={kg}
            recorde={i === SEMANAS.length - 1}
            inicio={(0.5 + i * 0.15) * fps}
          />
        ))}
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          bottom: 140,
          fontSize: 36,
          fontWeight: 500,
          color: "#83838B",
        }}
      >
        Supino reto · últimas 10 semanas
      </div>
    </AbsoluteFill>
  );
};
