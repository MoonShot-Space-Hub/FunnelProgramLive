import { AbsoluteFill } from "remotion";
import { Avatar, REST } from "./Avatar";
import { C } from "../theme";

/** Still used to eyeball the character design. */
export const AvatarTest: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg2 }}>
      <div style={{ position: "absolute", left: 40, top: 360 }}>
        <Avatar
          mouthOpen={0.6}
          mouthWide={0.4}
          blink={0}
          brow={0.3}
          browAngle={0}
          smile={0.4}
          tilt={0}
          nod={0}
          lookX={0}
          lookY={0}
          breathe={0}
          armL={{ a1: 25, a2: -140, a3: 0, hand: "point" }}
          armR={REST}
        />
      </div>
    </AbsoluteFill>
  );
};
