import { continueRender, delayRender, staticFile } from "remotion";

const FACES: [string, string, string, string?][] = [
  ["Anton", "Anton-400.woff2", "400"],
  ["Montserrat", "Montserrat-500.woff2", "500"],
  ["Montserrat", "Montserrat-700.woff2", "700"],
  ["Montserrat", "Montserrat-800.woff2", "800"],
  ["Montserrat", "Montserrat-900.woff2", "900"],
  ["Montserrat", "Montserrat-800-ext.woff2", "800", "U+0100-02BA, U+20A0-20C0, U+2113, U+2C60-2C7F"],
  ["Montserrat", "Montserrat-900-ext.woff2", "900", "U+0100-02BA, U+20A0-20C0, U+2113, U+2C60-2C7F"],
  ["Caveat", "Caveat-700.woff2", "700"],
];

if (typeof document !== "undefined") {
  const handle = delayRender("Loading fonts");
  Promise.all(
    FACES.map(([family, file, weight, unicodeRange]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, {
        weight,
        ...(unicodeRange ? { unicodeRange } : {}),
      });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}

export const display = "Anton, Impact, sans-serif";
export const body = "Montserrat, Arial, sans-serif";
export const hand = "Caveat, cursive";

export const C = {
  bg: "#060A13",
  bg2: "#0B1222",
  panel: "#101A30",
  line: "#1E2A47",
  green: "#22E58B",
  red: "#FF3B5C",
  gold: "#FFC83D",
  blue: "#3D8BFF",
  purple: "#8B5CFF",
  white: "#F5F7FB",
  muted: "#8A96B3",
  skin: "#C68B59",
  skinShade: "#A8703F",
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
