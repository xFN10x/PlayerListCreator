import nbt from "prismarine-nbt";
import readline from "node:readline";
import fs from "node:fs";
import { exit } from "node:process";

const rl = readline.createInterface(process.stdin, process.stdout);

console.log("Player List Maker by xFN10x");

function resolve(baseString: string, ...paths: string[]): string {
  const parsedBase = baseString.replaceAll("\\", "/");
  const parsedPaths = paths.join("/");

  return `${parsedBase}${parsedBase.endsWith("/") ? "" : "/"}${paths}`;
}

function start() {
  rl.question("Minecraft world folder (type 'exit' to exit): ", (folder) => {
    if (folder == "exit") {
      console.log("Bye!");
      exit();
    }
    try {
      if (fs.existsSync(folder)) {
        const playerDataPath = resolve(folder, "playerdata");
        if (fs.existsSync(playerDataPath)) {
        } else {
          console.log("Not a Minecraft world!");
          start();
          return;
        }
      } else {
        console.log("That folder doesn't exist!");
        start();
        return;
      }
    } catch (error) {
      console.log(error);
      start();
      return;
    }
  });
}

start();
