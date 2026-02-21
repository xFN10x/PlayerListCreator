import { exec } from "child_process";
import fs from "fs";
import util from "util"
import rlp from "readline/promises"

const i = rlp.createInterface(process.stdin, process.stdout)


const cmd = util.promisify(exec);

//this is run after the list-make.exe is made
if (fs.existsSync("dist"))
    await fs.promises.rm("dist", { recursive: true })
await fs.promises.mkdir("dist")


console.log("Installing modules...")
await cmd("npm install")
console.log("Building Typescript...")
await cmd("npx tsc")

var config = await i.question("What config do you want to use? (win, lin) ")
console.log("Bundling...")
await cmd(`npx esbuild list-maker.js --bundle --platform=node --outfile=bundle.js`)
console.log("Creating SEA...")
await cmd(`"${process.execPath}" --build-sea ${config}-config.json`)

console.log(`Built to: ${`${process.cwd()}/dist/list-builder${config === "win" ? ".exe" : ""}`}`)
process.exit()