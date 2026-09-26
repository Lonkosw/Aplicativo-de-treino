import "./index.css";
import { Composition, Folder } from "remotion";
import { PromoVideo } from "./PromoVideo";
import { Descanso } from "./scenes/Descanso";
import { Evolucao } from "./scenes/Evolucao";
import { Final } from "./scenes/Final";
import { Hook } from "./scenes/Hook";
import { Recursos } from "./scenes/Recursos";
import { Registro } from "./scenes/Registro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoTreino"
        component={PromoVideo}
        durationInFrames={630}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Cenas">
        <Composition id="Hook" component={Hook} durationInFrames={90} fps={30} width={1080} height={1920} />
        <Composition id="Registro" component={Registro} durationInFrames={150} fps={30} width={1080} height={1920} />
        <Composition id="Descanso" component={Descanso} durationInFrames={135} fps={30} width={1080} height={1920} />
        <Composition id="Evolucao" component={Evolucao} durationInFrames={120} fps={30} width={1080} height={1920} />
        <Composition id="Recursos" component={Recursos} durationInFrames={105} fps={30} width={1080} height={1920} />
        <Composition id="Final" component={Final} durationInFrames={105} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
