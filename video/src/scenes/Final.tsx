import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../fonts";

export const Final: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Final"
      style={{
        backgroundColor: "#0A0A0B",
        fontFamily,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Interactive.Div
        name="Glow"
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(225,29,43,0.3) 0%, rgba(225,29,43,0) 60%)",
          opacity: interpolate(frame, [0, 1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <Img
        name="Icon"
        src={staticFile("icone.png")}
        style={{
          width: 340,
          height: 340,
          borderRadius: 80,
          border: "3px solid #2E2E33",
          scale: interpolate(frame, [0, 0.7 * fps], [0.3, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 11 }),
            output: "perceptual-scale",
          }),
          rotate: interpolate(frame, [0, 0.7 * fps], ["-30deg", "0deg"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 11 }),
          }),
        }}
      />
      <Interactive.Div
        name="App name"
        style={{
          fontSize: 180,
          fontWeight: 900,
          color: "#F5F5F7",
          letterSpacing: -6,
          marginTop: 60,
          opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0.4 * fps, 1 * fps], ["0px 50px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Treino
      </Interactive.Div>
      <Interactive.Div
        name="Tagline"
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "#A0A0A8",
          marginTop: 12,
          opacity: interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Seu treino. Seu progresso.
      </Interactive.Div>
      <Interactive.Div
        name="CTA"
        style={{
          marginTop: 110,
          padding: "36px 90px",
          borderRadius: 999,
          backgroundColor: "#E11D2B",
          fontSize: 56,
          fontWeight: 800,
          color: "#FFFFFF",
          opacity: interpolate(frame, [1.3 * fps, 1.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [1.3 * fps, 1.9 * fps], [0.6, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 10 }),
            output: "perceptual-scale",
          }),
        }}
      >
        Baixe o APK grátis
      </Interactive.Div>
      <Interactive.Div
        name="Platform"
        style={{
          fontSize: 44,
          fontWeight: 500,
          color: "#83838B",
          marginTop: 36,
          opacity: interpolate(frame, [1.8 * fps, 2.1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Para Android
      </Interactive.Div>
    </AbsoluteFill>
  );
};
