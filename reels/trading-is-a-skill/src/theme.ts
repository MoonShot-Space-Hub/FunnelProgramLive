import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Montserrat (SIL Open Font License, see public/fonts/OFL.txt), bundled locally
// so rendering never depends on reaching Google Fonts.
export const fontFamily = "Montserrat";

const subsets = [
  {
    file: "montserrat-latin-wght-normal.woff2",
    range:
      "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  },
  {
    file: "montserrat-latin-ext-wght-normal.woff2",
    range:
      "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  },
];

for (const s of subsets) {
  loadFont({
    family: fontFamily,
    url: staticFile(`fonts/${s.file}`),
    weight: "100 900",
    unicodeRange: s.range,
    format: "woff2",
  });
}

export const C = {
  bg: "#060A13",
  bg2: "#0D1526",
  panel: "#111A2E",
  panelBorder: "#22304F",
  text: "#FFFFFF",
  muted: "#8FA0BF",
  green: "#22C55E",
  greenSoft: "#4ADE80",
  red: "#EF4444",
  yellow: "#FFD60A",
  blue: "#3B82F6",
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
