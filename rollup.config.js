// rollup.config.js
const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve");
const commonJs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");

const entryPoints = [
  "./src/handler.ts"
];
const configs = entryPoints.map((entryPoint) => ({
  input: entryPoint,
  output: {
    dir: "layer",
    format: "cjs",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.layer.json",
    }),
    commonJs(),
    nodeResolve({ exportConditions: ["node"] }),
    json(),
  ],
}));
module.exports = configs;
