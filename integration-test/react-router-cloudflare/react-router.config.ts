import { vercelPreset } from "@vercel/react-router/vite";
import type { Config, Preset } from "@react-router/dev/config";

let presets: Array<Preset> = [];
if (process.env.VERCEL) {
  console.log("Adding Vercel preset");
  presets.push(vercelPreset());
}

export default {
  ssr: true,
  presets,
  future: {
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
