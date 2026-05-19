import esbuild from "esbuild";
import process from "node:process";
import { readFileSync } from "node:fs";

const mode = process.argv[2] ?? "production";
const isDev = mode === "development";

const manifest = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url)));

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "cjs",
  target: "es2022",
  platform: "browser",
  outfile: "main.js",
  sourcemap: isDev ? "inline" : false,
  external: ["obsidian"],
  define: {
    __PLUGIN_VERSION__: JSON.stringify(manifest.version)
  }
});

if (isDev) {
  await ctx.watch();
  console.log("watching...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
