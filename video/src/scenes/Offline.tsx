import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../fonts";

// Palavra que ocupa a tela por uma batida (0,5 s) e dá lugar à próxima.
const Palavra: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Interactive.Div
        name="Word"
        style={{
          fontSize: 150,
          fontWeight: 900,
          color: "#F5F5F7",
          letterSpacing: -5,
          opacity: interpolate(frame, [0, 0.1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 0.5 * fps], [1.12, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        {texto}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const Offline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Offline"
      style={{ backgroundColor: "#0A0A0B", fontFamily }}
    >
      <Sequence durationInFrames={0.5 * fps} name="Sem conta" layout="none">
        <Palavra texto="Sem conta." />
      </Sequence>
      <Sequence from={0.5 * fps} durationInFrames={0.5 * fps} name="Sem login" layout="none">
        <Palavra texto="Sem login." />
      </Sequence>
      <Sequence from={1 * fps} durationInFrames={0.5 * fps} name="Sem nuvem" layout="none">
        <Palavra texto="Sem nuvem." />
      </Sequence>
      <Sequence from={1.5 * fps} name="Offline" layout="none">
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Interactive.Div
            name="Offline title"
            style={{
              fontSize: 170,
              fontWeight: 900,
              color: "#E11D2B",
              letterSpacing: -6,
              opacity: interpolate(frame, [1.5 * fps, 1.6 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              scale: interpolate(frame, [1.5 * fps, 2 * fps], [0.8, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 12 }),
                output: "perceptual-scale",
              }),
            }}
          >
            100% offline
          </Interactive.Div>
          <Interactive.Div
            name="Offline subtitle"
            style={{
              fontSize: 50,
              fontWeight: 500,
              color: "#A0A0A8",
              marginTop: 28,
              opacity: interpolate(frame, [1.9 * fps, 2.2 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: interpolate(frame, [1.9 * fps, 2.3 * fps], ["0px 30px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            Seus treinos ficam no seu celular
          </Interactive.Div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
