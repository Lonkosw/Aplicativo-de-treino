import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  interpolateColors,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../fonts";
import { Phone } from "../Phone";

// Uma linha da tabela de séries: aparece e, meio segundo depois, é concluída.
const SetRow: React.FC<{
  serie: number;
  anterior: string;
  kg: string;
  reps: string;
}> = ({ serie, anterior, kg, reps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name="Set row"
      style={{
        display: "flex",
        alignItems: "center",
        height: 124,
        borderRadius: 20,
        padding: "0 20px",
        marginBottom: 16,
        fontSize: 44,
        fontWeight: 700,
        color: "#F5F5F7",
        backgroundColor: interpolateColors(
          frame,
          [0.5 * fps, 0.7 * fps],
          ["rgba(42,13,17,0)", "rgba(42,13,17,1)"],
        ),
        opacity: interpolate(frame, [0, 0.25 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [0, 0.4 * fps], ["60px 0px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <Audio name="SFX serie" src={staticFile("sfx/pop.wav")} volume={0.3} />
      <Audio name="SFX concluir" from={0.5 * fps - 6} src={staticFile("sfx/mouse-click.wav")} volume={0.8} />
      <div style={{ width: 90, color: "#A0A0A8" }}>{serie}</div>
      <div style={{ flex: 1, color: "#83838B", fontSize: 34, fontWeight: 500 }}>
        {anterior}
      </div>
      <div style={{ width: 130, textAlign: "center" }}>{kg}</div>
      <div style={{ width: 110, textAlign: "center" }}>{reps}</div>
      <Interactive.Div
        name="Check"
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 44,
          color: "#FFFFFF",
          backgroundColor: interpolateColors(
            frame,
            [0.5 * fps, 0.6 * fps],
            ["rgba(46,46,51,1)", "rgba(225,29,43,1)"],
          ),
          scale: interpolate(frame, [0.5 * fps, 0.8 * fps], [0.6, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 10 }),
            output: "perceptual-scale",
          }),
        }}
      >
        ✓
      </Interactive.Div>
    </Interactive.Div>
  );
};

export const Registro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Registro"
      style={{
        backgroundColor: "#0A0A0B",
        fontFamily,
        alignItems: "center",
        paddingTop: 150,
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
          translate: interpolate(frame, [0, 0.6 * fps], ["0px 40px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Registre cada série
      </Interactive.Div>
      <Interactive.Div
        name="Subtitle"
        style={{
          fontSize: 46,
          fontWeight: 500,
          color: "#A0A0A8",
          marginTop: 24,
          marginBottom: 80,
          opacity: interpolate(frame, [0.3 * fps, 0.7 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Peso, repetições e o treino anterior
      </Interactive.Div>
      <Phone
        style={{
          translate: interpolate(frame, [0, 0.8 * fps], ["0px 300px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, color: "#E94E58" }}>
          ● 42:17
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#F5F5F7",
            marginTop: 24,
            marginBottom: 36,
          }}
        >
          Supino reto com barra
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            color: "#83838B",
            padding: "0 20px",
            marginBottom: 16,
          }}
        >
          <div style={{ width: 90 }}>SÉRIE</div>
          <div style={{ flex: 1 }}>ANTERIOR</div>
          <div style={{ width: 130, textAlign: "center" }}>KG</div>
          <div style={{ width: 110, textAlign: "center" }}>REPS</div>
          <div style={{ width: 72 }} />
        </div>
        <Sequence from={1 * fps} layout="none" name="Set 1">
          <SetRow serie={1} anterior="75 × 10" kg="80" reps="10" />
        </Sequence>
        <Sequence from={1.5 * fps} layout="none" name="Set 2">
          <SetRow serie={2} anterior="75 × 8" kg="80" reps="9" />
        </Sequence>
        <Sequence from={2 * fps} layout="none" name="Set 3">
          <SetRow serie={3} anterior="75 × 8" kg="80" reps="8" />
        </Sequence>
        <Sequence from={2.5 * fps} layout="none" name="Set 4">
          <SetRow serie={4} anterior="75 × 6" kg="82,5" reps="6" />
        </Sequence>
        <Audio name="SFX botao" from={3 * fps} src={staticFile("sfx/pop.wav")} volume={0.5} />
        <Interactive.Div
          name="Finish button"
          style={{
            marginTop: "auto",
            height: 120,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 800,
            color: "#FFFFFF",
            backgroundColor: "#E11D2B",
            opacity: interpolate(frame, [3 * fps, 3.2 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            scale: interpolate(frame, [3 * fps, 3.5 * fps], [0.8, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 10 }),
              output: "perceptual-scale",
            }),
          }}
        >
          Finalizar treino
        </Interactive.Div>
      </Phone>
    </AbsoluteFill>
  );
};
