import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import type { Difficulty, GameSnapshot, MatchMode, TableTheme } from "./types";
import { DIFFICULTIES, TABLES } from "./content";

export type GameHandle = { scene: Scene; dispose: () => void };
type SnapshotListener = (snapshot: GameSnapshot) => void;

const FIELD_W = 18;
const FIELD_D = 10;
const TABLE_TOP = 0.9;
const PADDLE_Z = 4.15;
const PADDLE_W = 1.65;
const PADDLE_H = 0.28;
const BALL_R = 0.28;
const MIN_Z = -PADDLE_Z;
const MAX_Z = PADDLE_Z;
const TOP_X = -FIELD_W / 2 + 0.65;
const BOT_X = FIELD_W / 2 - 0.65;

const palette = {
  night: "#15152B",
  purple: "#272044",
  green: "#B8F23D",
  coral: "#FF5C61",
  yellow: "#FFD447",
  ice: "#72D7F2",
  white: "#F7F5EA",
};

const color = (hex: string) => Color3.FromHexString(hex);

export function createGameScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
  onSnapshot: SnapshotListener,
  mode: MatchMode = "quick",
  difficultyId: Difficulty = "normal",
  selectedTable: TableTheme = TABLES[0],
): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = color(palette.night).toColor4(1);
  const camera = new ArcRotateCamera("camera", -Math.PI / 2, 1.04, 20.5, new Vector3(0, 0.7, 0), scene);
  camera.lowerRadiusLimit = 20.5;
  camera.upperRadiusLimit = 20.5;
  camera.lowerBetaLimit = 1.04;
  camera.upperBetaLimit = 1.04;
  camera.attachControl(canvas, false);
  camera.inputs.clear();

  const hemi = new HemisphericLight("arena-light", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.65;
  hemi.diffuse = color(palette.white);
  hemi.groundColor = color(palette.purple);
  const key = new PointLight("key-light", new Vector3(-4, 8, -3), scene);
  key.intensity = 1.65;
  key.diffuse = color(palette.green);
  const rim = new PointLight("rim-light", new Vector3(5, 4, 5), scene);
  rim.intensity = 1.15;
  rim.diffuse = color(palette.coral);
  const glow = new GlowLayer("neon-glow", scene);
  glow.intensity = 0.7;

  const mat = (name: string, hex: string, emissive = 0) => {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color(hex);
    material.specularColor = color(palette.white).scale(0.15);
    if (emissive) material.emissiveColor = color(hex).scale(emissive);
    return material;
  };
  const floorMat = mat("floor", selectedTable.floor);
  const tableMat = mat("table", selectedTable.accent, 0.08);
  const edgeMat = mat("edge", selectedTable.secondary, 0.28);
  const lineMat = mat("line", palette.white, 0.28);
  const ballMat = mat("ball", palette.yellow, 0.7);
  const playerMat = mat("player-paddle", palette.green, 0.42);
  const botMat = mat("bot-paddle", palette.coral, 0.42);
  const netMat = mat("net", palette.ice, 0.35);

  const floor = MeshBuilder.CreateGround("arena-floor", { width: 32, height: 25 }, scene);
  floor.material = floorMat;
  floor.position.y = -0.18;

  const table = MeshBuilder.CreateBox("ping-pong-table", { width: FIELD_W, depth: FIELD_D, height: 0.42 }, scene);
  table.position.y = TABLE_TOP - 0.2;
  table.material = tableMat;
  const edge = MeshBuilder.CreateBox("table-edge", { width: FIELD_W + 0.22, depth: FIELD_D + 0.22, height: 0.18 }, scene);
  edge.position.y = TABLE_TOP - 0.02;
  edge.material = edgeMat;

  const line = (name: string, width: number, depth: number, x: number, z: number) => {
    const mesh = MeshBuilder.CreateBox(name, { width, depth, height: 0.035 }, scene);
    mesh.position.set(x, TABLE_TOP + 0.025, z);
    mesh.material = lineMat;
    return mesh;
  };
  line("center-line", 0.035, FIELD_D - 0.35, 0, 0);
  line("back-line", FIELD_W - 0.3, 0.05, 0, -FIELD_D / 2 + 0.25);
  line("front-line", FIELD_W - 0.3, 0.05, 0, FIELD_D / 2 - 0.25);

  const net = MeshBuilder.CreateBox("net", { width: FIELD_W + 0.08, depth: 0.12, height: 1.02 }, scene);
  net.position.set(0, TABLE_TOP + 0.45, 0);
  net.material = netMat;
  const netTop = MeshBuilder.CreateBox("net-top", { width: FIELD_W + 0.18, depth: 0.2, height: 0.08 }, scene);
  netTop.position.set(0, TABLE_TOP + 0.98, 0);
  netTop.material = edgeMat;

  const makePaddle = (name: string, material: StandardMaterial, x: number) => {
    const paddle = MeshBuilder.CreateBox(name, { width: PADDLE_W, depth: PADDLE_H, height: 0.72 }, scene);
    paddle.position.set(x, TABLE_TOP + 0.42, 0);
    paddle.material = material;
    const grip = MeshBuilder.CreateBox(`${name}-grip`, { width: 0.36, depth: 0.22, height: 0.54 }, scene);
    grip.position.set(x, TABLE_TOP + 0.04, 0);
    grip.material = material;
    return paddle;
  };
  const player = makePaddle("player-raquete", playerMat, TOP_X);
  const bot = makePaddle("bot-raquete", botMat, BOT_X);
  const ball = MeshBuilder.CreateSphere("ping-pong-ball", { diameter: BALL_R * 2, segments: 20 }, scene);
  ball.material = ballMat;
  ball.position.set(0, TABLE_TOP + 0.58, 0);

  const state = {
    status: "playing" as GameSnapshot["status"],
    playerScore: 0,
    botScore: 0,
    rally: 0,
    bestRally: 0,
    server: "player" as "player" | "bot",
    message: "SAQUE CAÓTICO",
    pointWinner: null as "player" | "bot" | null,
    elapsed: 0,
    playerZ: 0,
    botZ: 0,
    vx: 0,
    vz: 0,
    serveTimer: 0.8,
    pointTimer: 0,
    botThink: 0,
    targetBotZ: 0,
    mistakeOffset: 0,
  };
  const difficulty = DIFFICULTIES[difficultyId];
  const keys = new Set<string>();
  let disposed = false;
  let demo = new URLSearchParams(window.location.search).has("demo");
  let emitTimer = 0;

  const resetBall = () => {
    state.vx = 0;
    state.vz = 0;
    state.serveTimer = 0.8;
    ball.position.set(0, TABLE_TOP + 0.58, 0);
    state.pointWinner = null;
  };
  const emit = () => onSnapshot({
    status: state.status,
    playerScore: state.playerScore,
    botScore: state.botScore,
    rally: state.rally,
    bestRally: state.bestRally,
    server: state.server,
    message: state.message,
    pointWinner: state.pointWinner,
    playerY: state.playerZ,
    botY: state.botZ,
    ball: { x: ball.position.x, y: ball.position.z, vx: state.vx, vy: state.vz, trail: [] },
    table: selectedTable,
    difficulty,
    mode,
    elapsed: state.elapsed,
  });
  const scorePoint = (winner: "player" | "bot") => {
    state.pointWinner = winner;
    state.message = winner === "player" ? "PONTO SEU!" : "PONTO DO BOT";
    if (winner === "player") state.playerScore += 1; else state.botScore += 1;
    state.server = winner;
    state.rally = 0;
    state.pointTimer = 1;
    state.vx = 0;
    state.vz = 0;
    if ((state.playerScore >= 11 && state.playerScore - state.botScore >= 2) || (state.botScore >= 11 && state.botScore - state.playerScore >= 2) || state.playerScore + state.botScore >= 15) {
      state.status = state.playerScore > state.botScore ? "won" : "lost";
      state.message = state.status === "won" ? "VOCÊ DOMINOU A MESA" : "O BOT ROUBOU A CENA";
      state.pointTimer = 0;
    }
    emit();
  };
  const update = (dt: number) => {
    if (state.status !== "playing") return;
    state.elapsed += dt;
    const axis = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
    const desiredPlayer = demo ? Math.sin(state.elapsed * 2.2) * 3.15 : state.playerZ + axis * 7.5 * dt;
    state.playerZ += Math.max(-8 * dt, Math.min(8 * dt, desiredPlayer - state.playerZ));
    state.playerZ = Math.max(MIN_Z, Math.min(MAX_Z, state.playerZ));
    player.position.z = state.playerZ;

    state.botThink -= dt;
    if (state.botThink <= 0) {
      state.botThink = difficulty.reactionTime;
      const projected = state.vx > 0 ? ball.position.z + (state.vz / Math.max(state.vx, 0.1)) * (BOT_X - ball.position.x) : 0;
      state.targetBotZ = Math.max(MIN_Z, Math.min(MAX_Z, projected * 0.2 * difficulty.predictionDepth + state.mistakeOffset));
      if (Math.random() < difficulty.mistakeChance) state.mistakeOffset = (Math.random() - 0.5) * 3.4;
      else state.mistakeOffset *= 0.82;
    }
    state.botZ += Math.max(-difficulty.movementSpeed * 0.02 * dt, Math.min(difficulty.movementSpeed * 0.02 * dt, state.targetBotZ - state.botZ));
    state.botZ = Math.max(MIN_Z, Math.min(MAX_Z, state.botZ));
    bot.position.z = state.botZ;

    if (state.pointTimer > 0) {
      state.pointTimer -= dt;
      if (state.pointTimer <= 0) { state.message = "SAQUE CAÓTICO"; resetBall(); }
      return;
    }
    if (state.serveTimer > 0) {
      state.serveTimer -= dt;
      if (state.serveTimer <= 0) {
        const direction = state.server === "player" ? 1 : -1;
        const angle = (Math.random() - 0.5) * 0.55;
        const speed = mode === "training" ? 5.2 : 6.2;
        state.vx = Math.cos(angle) * speed * direction;
        state.vz = Math.sin(angle) * speed;
        state.message = "REBATE!";
      }
      return;
    }
    ball.position.x += state.vx * dt;
    ball.position.z += state.vz * dt;
    ball.position.y = TABLE_TOP + 0.58 + Math.sin(state.elapsed * 13) * 0.06;
    if (ball.position.z < MIN_Z + BALL_R || ball.position.z > MAX_Z - BALL_R) state.vz *= -1;
    const hitPlayer = ball.position.x < TOP_X + 0.85 && ball.position.x > TOP_X - 0.8 && Math.abs(ball.position.z - state.playerZ) < 0.72 && state.vx < 0;
    const hitBot = ball.position.x > BOT_X - 0.85 && ball.position.x < BOT_X + 0.8 && Math.abs(ball.position.z - state.botZ) < 0.72 && state.vx > 0;
    if (hitPlayer) {
      ball.position.x = TOP_X + 0.9;
      const relative = Math.max(-1, Math.min(1, (ball.position.z - state.playerZ) / 0.72));
      const speed = Math.min(10.5, Math.max(6.2, Math.hypot(state.vx, state.vz) + 0.18));
      state.vx = speed * (0.95 + Math.abs(relative) * 0.05);
      state.vz = relative * speed * 0.72;
      state.rally += 1; state.bestRally = Math.max(state.bestRally, state.rally); state.message = state.rally > 8 ? "TROCA INSANA!" : "BOA!";
    }
    if (hitBot) {
      ball.position.x = BOT_X - 0.9;
      const relative = Math.max(-1, Math.min(1, (ball.position.z - state.botZ) / 0.72));
      const speed = Math.min(10.5, Math.max(6.2, Math.hypot(state.vx, state.vz) + 0.18));
      state.vx = -speed * (0.95 + Math.abs(relative) * 0.05);
      state.vz = relative * speed * 0.72;
      state.rally += 1; state.bestRally = Math.max(state.bestRally, state.rally); state.message = state.rally > 8 ? "TROCA INSANA!" : "DEFENDE!";
    }
    if (ball.position.x < -10.5) scorePoint("bot");
    if (ball.position.x > 10.5) scorePoint("player");
  };
  const onKey = (event: KeyboardEvent) => {
    const keyName = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "w", "s", " "].includes(keyName)) event.preventDefault();
    if (event.type === "keydown") keys.add(keyName); else keys.delete(keyName);
    if (event.type === "keydown" && keyName === " ") {
      if (state.status === "paused") { state.status = "playing"; state.message = "VAI!"; } else if (state.status === "playing") { state.status = "paused"; state.message = "PAUSA"; }
      emit();
    }
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  scene.onBeforeRenderObservable.add(() => {
    if (disposed) return;
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.04);
    update(dt);
    emitTimer += dt;
    if (emitTimer >= 0.08) { emitTimer = 0; emit(); }
  });
  resetBall();
  emit();
  return Promise.resolve({ scene, dispose: () => { disposed = true; window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); scene.dispose(); } });
}
