import "./index.css";
import { Composition, Folder } from "remotion";
import { PromoVideo } from "./PromoVideo";
import { Descanso } from "./scenes/Descanso";
import { Evolucao } from "./scenes/Evolucao";
import { Final } from "./scenes/Final";
import { Hook } from "./scenes/Hook";
import { Offline } from "./scenes/Offline";
import { Registro } from "./scenes/Registro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoTreino"
        component={PromoVideo}
        durationInFrames={660}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Cenas">
        <Composition id="Hook" component={Hook} durationInFrames={120} fps={30} width={1080} height={1920} />
        <Composition id="Registro" component={Registro} durationInFrames={135} fps={30} width={1080} height={1920} />
        <Composition id="Descanso" component={Descanso} durationInFrames={135} fps={30} width={1080} height={1920} />
        <Composition id="Evolucao" component={Evolucao} durationInFrames={120} fps={30} width={1080} height={1920} />
        <Composition id="Offline" component={Offline} durationInFrames={105} fps={30} width={1080} height={1920} />
        <Composition id="Final" component={Final} durationInFrames={120} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
