# Player List Creator

Create lists of players, and their cords from a minecraft world.

_An example output_

```md
**Players & Cords in _SMP_**

- **`(Bedrock) Ezbox05`**: -57, 63, 6
- **`(Bedrock) TheXboxGuy9593`**: -8973, 41, -2988
- **`(Bedrock) Coolsnake978`**: 4754, 62, 107
- **`(Bedrock) Ytggrr55`**: 5127, 77, 1839
- **`901faddce48f`**: -1375, 62, -639
- **`(Bedrock) Msw33489`**: -3204, -16, -395
- **`(Bedrock) RegelV`**: 5110, 73, 1845
- **`(Bedrock) DEMONCMS21`**: -6309, -50, -1996
- **`_FN10_`**: -5, -27, 4
- **`ninjagamer08980`**: -8962, 64, -2986
- **`DiamondJames144`**: -403, 13, 257
```

This project isn't gonna be developed any farther, and I just made it for my own sake, if you want to make add features you can I guess.

## Building

Player List Creator is made with node.js 25.6.1, so you will need it installed, using nvm (`nvm install 25.6.1 && nvm use 25.6.1`) or with something else.

Once you get the project cloned, and opened in a terminal, run;

```c
    npm install [--save-dev /* Only if planning to edit*/]
```

There are 2 scripts:

```c
npm run app // Runs the app 

npm run build //Creates a distrobution in the `dist` directory.
```

If you just want to run it, make sure you installed dev dependancies, and run;

```cmd
npx ts-node list-maker.ts
```
