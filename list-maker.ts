import nbt from "prismarine-nbt";
import readline from "node:readline";
import fs from "node:fs";

const rl = readline.createInterface(process.stdin, process.stdout);

console.log("test");

function start() {
  rl.question("Minecraft world folder: ", (folder) => {
    try {
      if (fs.existsSync(folder)) {
    
      } else {
        console.log("That folder doesn't exist!")
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

start()