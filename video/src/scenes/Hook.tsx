import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../fonts";

// Uma linha da nota bagunçada, digitada letra por letra.
const LinhaNota: React.FC<{ texto: string }> = ({ texto }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letras = Math.round(
    interpolate(frame, [0, 0.4 * fps], [0, texto.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <div
      style={{
        fontSize: 50,
        fontWeight: 500,
        color: "#D4D4D8",
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {texto.slice(0, letras)}
    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Hook"
      style={{
        backgroundColor: "#0A0A0B",
        fontFamily,
        alignItems: "center",
        paddingTop: 260,
      }}
    >
      <Audio name="SFX pergunta" src={staticFile("sfx/pop.wav")} volume={0.5} />
      <Audio name="SFX nota" from={0.4 * fps} src={staticFile("sfx/pop.wav")} volume={0.4} />
      <Audio name="SFX digitando 1" from={0.7 * fps} src={staticFile("sfx/typing.wav")} volume={0.45} />
      <Audio name="SFX digitando 2" from={1.2 * fps} src={staticFile("sfx/typing.wav")} volume={0.45} />
      <Audio name="SFX digitando 3" from={1.7 * fps} src={staticFile("sfx/typing.wav")} volume={0.45} />
      <Audio name="SFX nota some" from={2.6 * fps} src={staticFile("sfx/whoosh.wav")} volume={0.5} />
      <Audio name="SFX resposta" from={2.9 * fps} src={staticFile("sfx/whip.wav")} volume={0.8} />
      <Interactive.Div
        name="Question"
        style={{
          fontSize: 108,
          fontWeight: 900,
          color: "#F5F5F7",
          letterSpacing: -3,
          lineHeight: 1.05,
          textAlign: "center",
          opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0, 0.5 * fps], ["0px 50px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Ainda anota treino
        <br />
        no bloco de notas?
      </Interactive.Div>
      <Interactive.Div
        name="Notes card"
        style={{
          marginTop: 120,
          width: 840,
          height: 560,
          padding: "56px 64px",
          borderRadius: 40,
          backgroundColor: "#1C1C1F",
          border: "2px solid #2E2E33",
          rotate: "-3deg",
          opacity: interpolate(
            frame,
            [0.4 * fps, 0.7 * fps, 2.6 * fps, 3.1 * fps],
            [0, 1, 1, 0.15],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          scale: interpolate(frame, [2.6 * fps, 3.1 * fps], [1, 0.9], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
          filter: `blur(${interpolate(frame, [2.6 * fps, 3.1 * fps], [0, 8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#83838B",
            marginBottom: 20,
          }}
        >
          Notas · treino seg??
        </div>
        <Sequence from={0.7 * fps} layout="none" name="Note 1">
          <LinhaNota texto="supino 80 x 8 ou 10 ??" />
        </Sequence>
        <Sequence from={1.2 * fps} layout="none" name="Note 2">
          <LinhaNota texto="agach. 100kg (acho)" />
        </Sequence>
        <Sequence from={1.7 * fps} layout="none" name="Note 3">
          <LinhaNota texto="descanso: esqueci kkk" />
        </Sequence>
      </Interactive.Div>
      <Interactive.Div
        name="Answer"
        style={{
          position: "absolute",
          top: 1180,
          fontSize: 108,
          fontWeight: 900,
          color: "#E11D2B",
          letterSpacing: -3,
          opacity: interpolate(frame, [2.9 * fps, 3.2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [2.9 * fps, 3.4 * fps], [1.25, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        Tem jeito melhor.
      </Interactive.Div>
    </AbsoluteFill>
  );
};
