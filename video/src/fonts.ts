import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Inter local (public/fonts): o render não depende de acesso ao Google Fonts.
export const fontFamily = "Inter";

for (const weight of ["500", "700", "800", "900"]) {
  loadFont({
    family: fontFamily,
    url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`),
    weight,
  });
}
