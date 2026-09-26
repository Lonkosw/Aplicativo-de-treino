import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Descanso } from "./scenes/Descanso";
import { Evolucao } from "./scenes/Evolucao";
import { Final } from "./scenes/Final";
import { Hook } from "./scenes/Hook";
import { Recursos } from "./scenes/Recursos";
import { Registro } from "./scenes/Registro";

// 6 cenas (90+150+135+120+105+105 = 705) menos 5 transições de 15 = 630 frames.
export const PromoVideo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Hook" durationInFrames={90}>
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-bottom" })}
      timing={linearTiming({ durationInFrames: 15 })}
    />
    <TransitionSeries.Sequence name="Registro" durationInFrames={150}>
      <Registro />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-right" })}
      timing={linearTiming({ durationInFrames: 15 })}
    />
    <TransitionSeries.Sequence name="Descanso" durationInFrames={135}>
      <Descanso />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-right" })}
      timing={linearTiming({ durationInFrames: 15 })}
    />
    <TransitionSeries.Sequence name="Evolucao" durationInFrames={120}>
      <Evolucao />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={slide({ direction: "from-right" })}
      timing={linearTiming({ durationInFrames: 15 })}
    />
    <TransitionSeries.Sequence name="Recursos" durationInFrames={105}>
      <Recursos />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: 15 })}
    />
    <TransitionSeries.Sequence name="Final" durationInFrames={105}>
      <Final />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
