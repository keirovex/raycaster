const rad = deg => deg / 180 * Math.PI;

const MAP_WIDTH = 24, MAP_HEIGHT = 24;

const FOV = rad(67.38);
const RENDER_DISTANCE = 48;
const MOVE_SPEED = 2;
const PAN_SPEED = 2;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "black";
ctx.strokeStyle = "white";
ctx.font = "20px serif";
ctx.textBaseline = "top";

const buffer = ctx.createImageData(canvas.width, canvas.height);

const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,2,2,2,2,2,0,0,0,0,3,0,3,0,3,0,0,0,1],
  [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,3,0,0,0,3,0,0,0,1],
  [1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,2,2,0,2,2,0,0,0,0,3,0,3,0,3,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,4,0,4,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,4,0,0,0,0,5,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,4,0,4,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,4,0,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let posX = 22, posY = 12;
let angle = Math.PI;
let dirX, dirY;
let planeX, planeY;

const f = Math.tan(FOV / 2);

function updateVectors() {
    dirX = Math.cos(angle);
    dirY = Math.sin(angle);
    planeX = Math.sin(angle) * f;
    planeY = -Math.cos(angle) * f;
}

updateVectors();

const pressedKeys = new Set();
const isKeyDown = code => pressedKeys.has(code);
addEventListener("keydown", e => pressedKeys.add(e.code));
addEventListener("keyup", e => pressedKeys.delete(e.code));

const fpsArray = [];
let previousTime;
function step(currentTime) {
    if (previousTime === undefined) previousTime = currentTime;
    const dt = (currentTime - previousTime) / 1000;
    previousTime = currentTime;

    if (dt > 0 && fpsArray.push(1/dt) > 10) fpsArray.shift();
    
    let avgFPS = 0;
    for (const fps of fpsArray) avgFPS += fps;
    avgFPS = Math.round(avgFPS / fpsArray.length);

    if (isKeyDown("KeyW")) {
        posX += dirX * MOVE_SPEED * dt;
        posY += dirY * MOVE_SPEED * dt;
    }

    if (isKeyDown("KeyS")) {
        posX -= dirX * MOVE_SPEED * dt;
        posY -= dirY * MOVE_SPEED * dt;
    }

    if (isKeyDown("KeyD")) {
        posX += planeX * MOVE_SPEED * dt;
        posY += planeY * MOVE_SPEED * dt;
    }

    if (isKeyDown("KeyA")) {
        posX -= planeX * MOVE_SPEED * dt;
        posY -= planeY * MOVE_SPEED * dt;
    }

    if (isKeyDown("ArrowLeft")) {
        angle += PAN_SPEED * dt;
        updateVectors();
    }

    if (isKeyDown("ArrowRight")) {
        angle -= PAN_SPEED * dt;
        updateVectors();
    }

    buffer.data.fill(0);

    for (let x = 0; x < canvas.width; x++) {
        const cameraX = (x + 0.5) / canvas.width * 2 - 1;
        const rayDirX = dirX + planeX * cameraX;
        const rayDirY = dirY + planeY * cameraX;

        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);

        let mapX = Math.floor(posX);
        let mapY = Math.floor(posY);
        let sideDistX, sideDistY;
        let stepX, stepY;

        if (rayDirX < 0) {
            sideDistX = deltaDistX * (posX - mapX);
            stepX = -1;
        } else {
            sideDistX = deltaDistX * (mapX + 1 - posX);
            stepX = 1;
        }

        if (rayDirY < 0) {
            sideDistY = deltaDistY * (posY - mapY);
            stepY = -1;
        } else {
            sideDistY = deltaDistY * (mapY + 1 - posY);
            stepY = 1;
        }

        let perpWallDist = 0;
        let hit = false;
        let isVerticalSide;
        while (perpWallDist < RENDER_DISTANCE) {
            if (sideDistX < sideDistY) {
                perpWallDist = sideDistX;
                sideDistX += deltaDistX;
                mapX += stepX;
                isVerticalSide = true;
            } else {
                perpWallDist = sideDistY;
                sideDistY += deltaDistY;
                mapY += stepY;
                isVerticalSide = false;
            }

            if (mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT && map[mapX][mapY] > 0) {
                hit = true;
                break;
            }
        }

        if (!hit) continue;

        let wallX;
        if (isVerticalSide) wallX = posY + rayDirY * perpWallDist;
        else                wallX = posX + rayDirX * perpWallDist;
        wallX -= Math.floor(wallX);

        if (isVerticalSide && rayDirX > 0 || !isVerticalSide && rayDirY < 0) wallX = 1 - wallX;

        const lineHeight = canvas.height / perpWallDist;
        const lineStart = Math.floor((canvas.height - lineHeight) / 2);
        const drawStart = Math.max(lineStart, 0);
        const drawEnd = Math.min(Math.floor(lineStart + lineHeight), canvas.height);

        let wallR = 0, wallG = 0, wallB = 0;
        switch (map[mapX][mapY]) {
            case 1: wallR = 255; break;
            case 2: wallG = 255; break;
            case 3: wallB = 255; break;
            case 4: wallR = wallG = wallB = 128; break;
            default: wallR = wallG = 255; break;
        }

        if (isVerticalSide) {
            wallR /= 2;
            wallG /= 2;
            wallB /= 2;
        }

        const step = 1 / lineHeight;
        let wallY = (drawStart - lineStart) * step;

        for (let y = drawStart; y < drawEnd; y++) {
            const factor = (1 - wallY) * 0.7 + 0.3;
            const r = wallR * factor;
            const g = wallG * factor;
            const b = wallB * factor;

            const index = (x + y * canvas.width) * 4;
            buffer.data[index] = r;
            buffer.data[index + 1] = g;
            buffer.data[index + 2] = b;
            buffer.data[index + 3] = 255;
            wallY += step;
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(buffer, 0, 0);

    ctx.strokeText(`FPS: ${avgFPS}`, 10, 10);
    ctx.fillText(`FPS: ${avgFPS}`, 10, 10);
    requestAnimationFrame(step);
}

requestAnimationFrame(step);