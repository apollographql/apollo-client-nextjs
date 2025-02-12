import { vercelPreset } from "@vercel/react-router/vite";
import type { Config, Preset } from "@react-router/dev/config";

let presets: Array<Preset> = [];
if (process.env.VERCEL) {
  console.log("Adding Vercel preset");
  presets.push(vercelPreset());
}

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  presets,
} satisfies Config;
