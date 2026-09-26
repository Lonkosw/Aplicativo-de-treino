import { Audio } from "@remotion/media";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { staticFile } from "remotion";
import { zoomFade } from "./zoom-fade";
import { Descanso } from "./scenes/Descanso";
import { Evolucao } from "./scenes/Evolucao";
import { Final } from "./scenes/Final";
import { Hook } from "./scenes/Hook";
import { Offline } from "./scenes/Offline";
import { Registro } from "./scenes/Registro";

// 120 BPM: uma batida = 15 frames. Cenas (120+135+135+120+105+120 = 735)
// menos 5 transições de 15 = 660 frames (22 s), a duração da trilha.
// As transições terminam nas entradas da música (4 s, 8 s, 12 s...).
export const PromoVideo: React.FC = () => (
  <>
    <Audio name="Trilha" src={staticFile("trilha.mp3")} />
    <TransitionSeries>
      <TransitionSeries.Sequence name="Hook" durationInFrames={120}>
        <Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={zoomFade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Registro" durationInFrames={135}>
        <Registro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={zoomFade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Descanso" durationInFrames={135}>
        <Descanso />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={zoomFade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Evolucao" durationInFrames={120}>
        <Evolucao />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={zoomFade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Offline" durationInFrames={105}>
        <Offline />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={zoomFade()}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence name="Final" durationInFrames={120}>
        <Final />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </>
);
