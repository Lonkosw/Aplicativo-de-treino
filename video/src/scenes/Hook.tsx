import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../fonts";

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Hook"
      style={{
        backgroundColor: "#0A0A0B",
        fontFamily,
        justifyContent: "center",
        padding: "0 100px",
      }}
    >
      <Interactive.Div
        name="Glow"
        style={{
          position: "absolute",
          left: -300,
          top: 500,
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(225,29,43,0.35) 0%, rgba(225,29,43,0) 65%)",
          scale: interpolate(frame, [0, 3 * fps], [0.8, 1.1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      />
      <Interactive.Div
        name="Line 1"
        style={{
          fontSize: 124,
          whiteSpace: "nowrap",
          fontWeight: 900,
          color: "#F5F5F7",
          letterSpacing: -4,
          lineHeight: 1.05,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0, 0.6 * fps], ["0px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Cada série.
      </Interactive.Div>
      <Interactive.Div
        name="Line 2"
        style={{
          fontSize: 124,
          whiteSpace: "nowrap",
          fontWeight: 900,
          color: "#F5F5F7",
          letterSpacing: -4,
          lineHeight: 1.05,
          opacity: interpolate(frame, [0.5 * fps, 0.9 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0.5 * fps, 1.1 * fps], ["0px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Cada quilo.
      </Interactive.Div>
      <Interactive.Div
        name="Line 3"
        style={{
          fontSize: 124,
          whiteSpace: "nowrap",
          fontWeight: 900,
          color: "#E11D2B",
          letterSpacing: -4,
          lineHeight: 1.05,
          opacity: interpolate(frame, [1 * fps, 1.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [1 * fps, 1.6 * fps], [1.4, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 14 }),
            output: "perceptual-scale",
          }),
          transformOrigin: "left center",
        }}
      >
        Cada recorde.
      </Interactive.Div>
    </AbsoluteFill>
  );
};
