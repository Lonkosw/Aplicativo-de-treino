import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";

type Props = Record<string, never>;

// A cena nova entra por cima com fade e um leve zoom de aproximação;
// a antiga recua um pouco por baixo.
const ZoomFade: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const entrando = presentationDirection === "entering";
  return (
    <AbsoluteFill
      style={{
        opacity: entrando ? presentationProgress : 1,
        scale: entrando
          ? interpolate(presentationProgress, [0, 1], [1.08, 1])
          : interpolate(presentationProgress, [0, 1], [1, 0.94]),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const zoomFade = (): TransitionPresentation<Props> => ({
  component: ZoomFade,
  props: {},
});
