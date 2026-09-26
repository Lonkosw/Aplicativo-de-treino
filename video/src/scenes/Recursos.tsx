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

const Card: React.FC<{ destaque: string; texto: string }> = ({
  destaque,
  texto,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Feature card"
      style={{
        width: 880,
        padding: "48px 56px",
        marginBottom: 40,
        borderRadius: 40,
        backgroundColor: "#141416",
        border: "2px solid #2E2E33",
        opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [0, 0.6 * fps], ["-140px 0px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          color: "#E11D2B",
          letterSpacing: -3,
          lineHeight: 1,
        }}
      >
        {destaque}
      </div>
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#F5F5F7",
          marginTop: 16,
        }}
      >
        {texto}
      </div>
    </Interactive.Div>
  );
};

export const Recursos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Recursos"
      style={{
        backgroundColor: "#0A0A0B",
        fontFamily,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 100,
          fontWeight: 900,
          color: "#F5F5F7",
          letterSpacing: -3,
          marginBottom: 80,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Tudo no seu bolso
      </Interactive.Div>
      <div style={{ height: 1060 }}>
        <Sequence from={0.3 * fps} layout="none" name="Exercicios">
          <Card destaque="873" texto="exercícios em português" />
        </Sequence>
        <Sequence from={0.8 * fps} layout="none" name="Offline">
          <Card destaque="100% offline" texto="sem conta e sem nuvem" />
        </Sequence>
        <Sequence from={1.3 * fps} layout="none" name="Rotinas">
          <Card destaque="Rotinas" texto="monte uma vez, repita sempre" />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
