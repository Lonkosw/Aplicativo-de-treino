import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../fonts";

const RAIO = 300;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export const Descanso: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1:30 de descanso comprimido em ~2,5 s de vídeo.
  const segundos = Math.round(
    interpolate(frame, [0.5 * fps, 3 * fps], [90, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const relogio = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

  return (
    <AbsoluteFill
      name="Descanso"
      style={{
        backgroundColor: "#0A0A0B",
        fontFamily,
        alignItems: "center",
        paddingTop: 200,
      }}
    >
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
        Descanso na medida
      </Interactive.Div>
      <Interactive.Div
        name="Subtitle"
        style={{
          fontSize: 46,
          fontWeight: 500,
          color: "#A0A0A8",
          textAlign: "center",
          marginTop: 24,
          padding: "0 100px",
          lineHeight: 1.3,
          opacity: interpolate(frame, [0.3 * fps, 0.7 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        O celular avisa quando acabar, mesmo com o app fechado
      </Interactive.Div>
      <Interactive.Div
        name="Timer"
        style={{
          position: "relative",
          width: 720,
          height: 720,
          marginTop: 140,
          scale: interpolate(frame, [0, 0.6 * fps], [0.7, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
        }}
      >
        <svg width={720} height={720} viewBox="0 0 720 720">
          <circle cx={360} cy={360} r={RAIO} fill="none" stroke="#1C1C1F" strokeWidth={36} />
          <circle
            cx={360}
            cy={360}
            r={RAIO}
            fill="none"
            stroke="#E11D2B"
            strokeWidth={36}
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={interpolate(
              frame,
              [0.5 * fps, 3 * fps],
              [0, CIRCUNFERENCIA],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )}
            transform="rotate(-90 360 360)"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 190,
              fontWeight: 800,
              color: "#F5F5F7",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {relogio}
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#A0A0A8" }}>
            descanso
          </div>
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="Notification"
        style={{
          position: "absolute",
          bottom: 180,
          width: 880,
          padding: "36px 44px",
          borderRadius: 36,
          backgroundColor: "#1C1C1F",
          border: "2px solid #2E2E33",
          fontSize: 44,
          fontWeight: 700,
          color: "#F5F5F7",
          opacity: interpolate(frame, [3 * fps, 3.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [3 * fps, 3.5 * fps], ["0px 120px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 14 }),
          }),
        }}
      >
        🔔 Descanso encerrado. Bora pra próxima série!
      </Interactive.Div>
    </AbsoluteFill>
  );
};
