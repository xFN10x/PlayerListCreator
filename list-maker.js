"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_readline_1 = __importDefault(require("node:readline"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_process_1 = require("node:process");
const promises_1 = require("node:timers/promises");
const node_module_1 = require("node:module");
if (node_fs_1.default.existsSync("lib/nbt.js"))
    require = (0, node_module_1.createRequire)(`${process.cwd()}/lib/nbt.js`);
else
    require = (0, node_module_1.createRequire)(`${process.cwd()}/node_modules/prismarine-nbt/nbt.js`);
const prismarine_nbt_1 = __importDefault(require("prismarine-nbt"));
const rl = node_readline_1.default.createInterface(process.stdin, process.stdout);
class PlayerType {
    static be = 1;
    static je = 0;
}
class UUID {
    toString;
    playerType;
    constructor(ints, playerType) {
        function getUUIDPart(part, array) {
            return (array[part] >>> 0).toString(16);
        }
        const intArray = ints;
        var uuidString;
        if (playerType == PlayerType.je)
            uuidString = `${getUUIDPart(0, intArray)}${getUUIDPart(1, intArray)}${getUUIDPart(2, intArray)}${getUUIDPart(3, intArray)}`;
        else
            uuidString = `${getUUIDPart(2, intArray)}${getUUIDPart(3, intArray)}`;
        this.toString = function () {
            return uuidString;
        };
        this.playerType = playerType;
    }
}
console.clear();
console.log("Player List Maker by xFN10x");
function resolve(baseString, ...paths) {
    const parsedBase = baseString.replaceAll("\\", "/");
    const parsedPaths = paths.join("/");
    return `${parsedBase}${parsedBase.endsWith("/") ? "" : "/"}${parsedPaths}`;
}
function posToString(pos) {
    if (!pos || !Array.isArray(pos))
        return `(Failed to get coords Type: ${typeof pos})`;
    var sb = new String();
    for (const number of pos) {
        if (pos.indexOf(number) == pos.length - 1)
            sb += `${number.toFixed(0)}`;
        else
            sb += `${number.toFixed(0)}, `;
    }
    return sb.toString();
}
function getUsername(id) {
    var url;
    switch (id.playerType) {
        case PlayerType.je:
            url = `https://playerdb.co/api/player/minecraft/${id.toString()}`;
            return fetch(url)
                .then((res) => {
                if (!res.ok) {
                    console.log(`Failed to resolve username. ${res.status}: ${res.statusText} (${url})`);
                    return undefined;
                }
                return res.json();
            })
                .then((js) => {
                if (js === undefined)
                    return;
                if (js.success) {
                    return js.data.player.username;
                }
                else {
                    console.error(`Failed to lookup username; ${JSON.stringify(js)}`);
                }
            });
        default:
            url = `https://api.geysermc.org/v2/xbox/gamertag/${parseInt(id.toString(), 16)}`;
            return fetch(url)
                .then((res) => {
                if (!res.ok) {
                    console.log(`Failed to resolve username. ${res.status}: ${res.statusText} (${url})`);
                    return undefined;
                }
                return res.json();
            })
                .then((js) => {
                if (js === undefined)
                    return;
                return "(Bedrock) " + js.gamertag;
            });
    }
}
function start() {
    rl.question("Minecraft world folder (type 'exit' to exit): ", (folder) => {
        if (folder == "exit") {
            console.log("Bye!");
            (0, node_process_1.exit)();
        }
        try {
            if (node_fs_1.default.existsSync(folder)) {
                const playerDataPath = resolve(folder, "playerdata");
                const levelDat = resolve(folder, "level.dat");
                //console.log(levelDat);
                if (node_fs_1.default.existsSync(playerDataPath) && node_fs_1.default.existsSync(levelDat)) {
                    var levelName = null;
                    //try to read stuff from level data
                    node_fs_1.default.readFile(levelDat, (err, data) => {
                        if (err) {
                            console.error(`Failed to read world data! Trying to proceed anyways! (${err.message})`);
                            return;
                        }
                        prismarine_nbt_1.default
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
                            console.log(`Detected world: ${levelName === null ? "(name not found)" : levelName} `);
                            console.log("Finding players...");
                            await node_fs_1.default.promises
                                .readdir(playerDataPath)
                                .then(async (files) => {
                                var askedForGeyser = false;
                                var playersAndData = new Map();
                                //now actually parse players
                                var geyserEnabled = false;
                                for (const v of files) {
                                    if (v.endsWith(".dat")) {
                                        //read je & be players usernames with: https://playerdb.co/
                                        // or use geyser for be? https://api.geysermc.org/v2/xbox/gamertag/(uuid as an int, hex->int)
                                        await node_fs_1.default.promises
                                            .readFile(resolve(playerDataPath, v))
                                            .then(async (data) => {
                                            await prismarine_nbt_1.default.parse(data).then(async (v) => {
                                                const parsed = v.parsed;
                                                if (parsed.value["UUID"]?.type === "intArray") {
                                                    const uuidArray = parsed.value["UUID"]?.value;
                                                    var typeOfPlayer = PlayerType.je;
                                                    if (uuidArray[0] == 0 && uuidArray[1] == 0) {
                                                        if (!askedForGeyser) {
                                                            askedForGeyser = true;
                                                            const a = await new Promise((res) => rl.question("A Geyser Xbox UUID was found, do you want to enable Xbox Gamertag lookups? (y/n) ", res));
                                                            if (a === "y") {
                                                                geyserEnabled = true;
                                                                typeOfPlayer = PlayerType.be;
                                                            }
                                                            else {
                                                                return;
                                                            }
                                                        }
                                                        else if (geyserEnabled) {
                                                            typeOfPlayer = PlayerType.be;
                                                        }
                                                    }
                                                    const uuid = parsed.value["UUID"]?.value;
                                                    const Uuid = new UUID(uuid, typeOfPlayer);
                                                    const name = await getUsername(Uuid);
                                                    if (!name) {
                                                        console.error("Failed to get player.");
                                                        playersAndData.set(Uuid.toString(), parsed.value);
                                                        return;
                                                    }
                                                    playersAndData.set(name, parsed.value);
                                                    console.log(`Found Player: ${name} (${Uuid.toString()})`);
                                                }
                                                else {
                                                    throw new Error(`Unexpected type while parsing nbt: Type of UUID is ${parsed.value["UUID"]?.type}`);
                                                }
                                            });
                                        });
                                    }
                                }
                                console.log("Players found.");
                                rl.question("How do you want this list? ('md', 'txt', default: txt) ", (a) => {
                                    console.log("Writing file...");
                                    var data = new String();
                                    switch (a) {
                                        case "md":
                                            data += `**Players & Cords in _${levelName}_**\n\n`;
                                            playersAndData.forEach((v, k) => {
                                                data += `- **\`${k}\`**: ${v["Pos"]?.type === "list" ? posToString(v["Pos"]?.value.value) : ""}\n`;
                                            });
                                            break;
                                        default:
                                            data += `Players & Cords in ${levelName}\n`;
                                            playersAndData.forEach((v, k) => {
                                                data += `- ${k}: ${v["Pos"]?.type === "list" ? posToString(v["Pos"]?.value.value) : ""}\n`;
                                            });
                                            break;
                                    }
                                    const path = `output.${a === "md" ? "md" : "txt"}`;
                                    node_fs_1.default.writeFile(path, data.toString(), async () => {
                                        console.log(`File wrote to: ${path}`);
                                        console.log("Exiting in 3...");
                                        await (0, promises_1.setTimeout)(1000);
                                        console.log("Exiting in 2...");
                                        await (0, promises_1.setTimeout)(1000);
                                        console.log("Exiting in 1...");
                                        await (0, promises_1.setTimeout)(1000);
                                        (0, node_process_1.exit)();
                                    });
                                    return;
                                });
                            });
                        });
                    });
                }
                else {
                    console.error("Not a Minecraft world!");
                    start();
                    return;
                }
            }
            else {
                console.error("That folder doesn't exist!");
                start();
                return;
            }
        }
        catch (error) {
            console.error(error);
            start();
            return;
        }
    });
}
start();
