import { exec } from "child_process";
import fs from "fs";
import util from "util"
import rlp from "readline/promises"

const i = rlp.createInterface(process.stdin, process.stdout)
const requiredJsFiles = new Map()
requiredJsFiles.set(
    "node_modules/prismarine-nbt/nbt.js",
    "nbt.js"
)


const cmd = util.promisify(exec);

//this is run after the list-make.exe is made
if (fs.existsSync("dist"))
    await fs.promises.rm("dist", {recursive: true})
await fs.promises.mkdir("dist")
await fs.promises.mkdir("dist/lib")


console.log("Installing modules...")
await cmd("npm install")
console.log("Building Typescript...")
await cmd("npx tsc")
/*var path = await i.question("What is the path of your node executable? (Leave blank if not using nvm) ")
if (path == "")
    path = "node"
else if (path == 1)
    path = "\"C:\\Program Files\\nodejs\\node.exe\""*/
var config = await i.question("What config do you want to use? (win, lin) ")
console.log("Creating SEA...")
await cmd(`"${process.execPath}" --build-sea ${config}-config.json`)

console.log("Copying Dependancies...")
requiredJsFiles.forEach(async (v, k) => {
    console.log("Copying: " + k)
    await fs.promises.copyFile(k, `dist/lib/${v}`)
})

