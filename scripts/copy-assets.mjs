import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist/store", { recursive: true });

await copyFile(
  "src/store/tokenBucket.lua",
  "dist/store/tokenBucket.lua"
);

console.log("Lua assets copied successfully.");