import nbt from "prismarine-nbt";
import readline from "node:readline";
import fs from "node:fs";
import { exit } from "node:process";

const rl = readline.createInterface(process.stdin, process.stdout);

class PlayerType {
  static be = 1;
  static je = 0;
}

class UUID {
  toString;
  playerType: number;
  constructor(ints: number[], playerType: number) {
    function getUUIDPart(part: number, array: number[]): string {
      return (array[part] >>> 0).toString(16);
    }
    const intArray = ints;
    const uuidString = `${getUUIDPart(0, intArray)}${getUUIDPart(1, intArray)}${getUUIDPart(2, intArray)}${getUUIDPart(3, intArray)}`;
    this.toString = function (): string {
      return uuidString;
    };
    this.playerType = playerType;
  }
}

console.clear();
console.log("Player List Maker by xFN10x");

function resolve(baseString: string, ...paths: string[]): string {
  const parsedBase = baseString.replaceAll("\\", "/");
  const parsedPaths = paths.join("/");

  return `${parsedBase}${parsedBase.endsWith("/") ? "" : "/"}${parsedPaths}`;
}

function getUsername(id: UUID): Promise<string | void> {
  const url = `https://playerdb.co/api/player/minecraft/${id.toString()}`;
  //console.info(`Fetching: ${url}`);
  var name;
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        console.log(
          `Failed to resolve username. ${res.status}: ${res.statusText} `,
        );
        return undefined;
      }
      return res.json();
    })
    .then((js) => {
      if (js === undefined) return;
      if (js.success) {
        //console.log(`Success! ${JSON.stringify(js)}`);
        return js.data.player.username;
      } else {
        console.error(`Failed to lookup username; ${JSON.stringify(js)}`);
      }
    });
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
              .finally(async () => {
                //next step
                console.log(
                  `Detected world: ${levelName === null ? "(name not found)" : levelName} `,
                );
                console.log("Finding players...");
                await fs.promises
                  .readdir(playerDataPath)
                  .then(async (files) => {
                    var askedForGeyser = false;
                    var playersAndData = new Map<string, Record<string, any>>();

                    //now actually parse players
                    for (const v of files) {
                      if (v.endsWith(".dat")) {
                        //read je & be players usernames with: https://playerdb.co/
                        // or use geyser for be? https://api.geysermc.org/v2/xbox/gamertag/(uuid as an int, hex->int)
                        await fs.promises
                          .readFile(resolve(playerDataPath, v))
                          .then(async (data) => {
                            await nbt.parse(data).then(async (v) => {
                              const parsed = v.parsed;
                              if (parsed.value["UUID"]?.type === "intArray") {
                                const uuidArray = parsed.value["UUID"]?.value;
                                var typeOfPlayer = PlayerType.je;
                                if (uuidArray[0] == 0 && uuidArray[1] == 0) {
                                  if (!askedForGeyser) {
                                    askedForGeyser = true;
                                    const a = await new Promise<string>((res) =>
                                      rl.question(
                                        "A Geyser Xbox UUID was found, do you want to enable Xbox Gamertag lookups? (y/n) ",
                                        res,
                                      ),
                                    );
                                    if (a === "y") {
                                      typeOfPlayer = PlayerType.be;
                                    } else {
                                      return;
                                    }
                                  }
                                }
                                const uuid = parsed.value["UUID"]?.value;
                                const Uuid = new UUID(uuid, typeOfPlayer);
                                const name = await getUsername(Uuid);
                                if (!name)
                                {
                                  console.error("Failed to get player.")
                                  return;
                                }
                                playersAndData.set(name, parsed.value);
                                console.log(
                                  `Found Player: ${name} (${Uuid.toString()})`,
                                );
                              } else {
                                throw new Error(
                                  `Unexpected type while parsing nbt: Type of UUID is ${parsed.value["UUID"]?.type}`,
                                );
                              }
                            });
                          });
                      }
                    }

                    console.log("Players found.");
                    rl.question(
                      "How do you want this list? ('md', 'txt', default: txt) ",
                      (a) => {
                        console.log("Writing file...");
                        var data = new String();
                        switch (a) {
                          case "md":
                            data += `**Players & Cords in _${levelName}_**\n\n`;
                            playersAndData.forEach((v, k) => {
                              data += `- **\`${k}\`**: ${v}\n`;
                            });
                            break;

                          default:
                            data += `Players & Cords in ${levelName}\n`;
                            playersAndData.forEach((v, k) => {
                              data += `- ${k}: ${v}\n`;
                            });
                            break;
                        }
                        const path = `output.${a === "md" ? "md" : "txt"}`;
                        fs.writeFile(path, data.toString(), () => {
                          console.log(`File wrote to: ${path}`);
                        });
                        return;
                      },
                    );
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
