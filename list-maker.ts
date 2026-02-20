import nbt from "prismarine-nbt";
import readline from "node:readline";
import fs from "node:fs";
import { exit } from "node:process";
import { fileURLToPathBuffer } from "node:url";

const rl = readline.createInterface(process.stdin, process.stdout);

class PlayerType {
  static be = 0;
  static je = 0;
}

class UUID {
  constructor(ints: number[], playerType: number) {
    const intArray = ints;
    const uuidString =
      playerType == PlayerType.be
        ? `${parseInt(`${intArray[2].toString(16)}${intArray[3].toString(16)}`)}`
        : ``;
        console.log(uuidString)
        console.log(`${intArray[2].toString(16)}${intArray[3].toString(16)}`)
  }
}

console.log("Player List Maker by xFN10x");

function resolve(baseString: string, ...paths: string[]): string {
  const parsedBase = baseString.replaceAll("\\", "/");
  const parsedPaths = paths.join("/");

  return `${parsedBase}${parsedBase.endsWith("/") ? "" : "/"}${parsedPaths}`;
}

function getUsername(params: UUID) {}

function start() {
  rl.question("Minecraft world folder (type 'exit' to exit): ", (folder) => {
    if (folder == "exit") {
      console.log("Bye!");
      exit();
    }
    try {
      if (fs.existsSync(folder)) {
        const playerDataPath = resolve(folder, "playerdata");
        const levelDat = resolve(folder, "level.dat");
        console.log(levelDat);
        if (fs.existsSync(playerDataPath) && fs.existsSync(levelDat)) {
          var levelName: string | null = null;
          //try to read stuff from level data
          fs.readFile(levelDat, (err, data) => {
            if (err) {
              console.error(
                `Failed to read world data! Trying to proceed anyways! (${err.message})`,
              );
              return;
            }
            nbt
              .parse(data)
              .then((v) => {
                const data = v.parsed.value["Data"];
                if (data !== undefined && data.type === "compound") {
                  const name = data.value["LevelName"]?.value;
                  //console.log(JSON.stringify(v.parsed.value));
                  if (typeof name === "string") {
                    levelName = name;
                  }
                }
              })
              .finally(() => {
                //next step
                console.log(
                  `Detected world: ${levelName === null ? "(name not found)" : levelName} `,
                );
                console.log("Finding players...");
                fs.readdir(playerDataPath, (err, files) => {
                  if (err) {
                    console.error(`Failed to read player data!`);
                    throw err;
                  }

                  var askedForGeyser = false;

                  //now actually parse players
                  files.forEach((v) => {
                    if (v.endsWith(".dat")) {
                      //read je & be players usernames with: https://playerdb.co/
                      // or use geyser for be? https://api.geysermc.org/v2/xbox/gamertag/(uuid as an int, hex->int)
                      fs.readFile(resolve(playerDataPath, v), (err, data) => {
                        if (err) {
                          console.error(
                            `Failed to read player data for file ${v}! Continuing, (${err.message})`,
                          );
                          return;
                        }

                        nbt.parse(data).then((v) => {
                          const parsed = v.parsed;
                          if (parsed.value["UUID"]?.type === "intArray") {
                            const uuidArray = parsed.value["UUID"]?.value;
                            var typeOfPlayer = PlayerType.je;
                            if (uuidArray[0] == 0 && uuidArray[1] == 0) {
                              typeOfPlayer = PlayerType.be;
                              if (!askedForGeyser) {
                                askedForGeyser = true;
                                rl.question(
                                  "A Geyser Xbox UUID was found, do you want to enable Xbox Gamertag lookups? (y/n) ",
                                  (a) => {
                                    if (a === "y") {
                                      typeOfPlayer = PlayerType.je;
                                    } else {
                                      return;
                                    }
                                  },
                                );
                              }
                            }
                            switch (typeOfPlayer) {
                              case PlayerType.je:
                                fetch(
                                  `https://playerdb.co/api/player/minecraft/${getUsername(new UUID(parsed.value["UUID"].value, typeOfPlayer))}`,
                                );
                                break;

                              default:
                                break;
                            }
                            //console.log(`Found Player: ${}`)
                          } else {
                            throw new Error(
                              `Unexpected type while parsing nbt: Type of UUID is ${parsed.value["UUID"]?.type}`,
                            );
                          }
                        });
                      });
                    }
                  });
                });
              });
          });
        } else {
          console.error("Not a Minecraft world!");
          start();
          return;
        }
      } else {
        console.error("That folder doesn't exist!");
        start();
        return;
      }
    } catch (error) {
      console.error(error);
      start();
      return;
    }
  });
}

start();
