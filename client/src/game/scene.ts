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
import type { OnlineRoom } from "./online";

export type GameHandle = { scene: Scene; dispose: () => void };
type SnapshotListener = (snapshot: GameSnapshot) => void;
type Side = "player" | "bot";

const TABLE_LENGTH = 18;
const TABLE_WIDTH = 10;
const TABLE_TOP = 0.9;
const PADDLE_Y = TABLE_TOP + 0.66;
const PADDLE_X_PLAYER = -TABLE_LENGTH / 2 + 0.72;
const PADDLE_X_BOT = TABLE_LENGTH / 2 - 0.72;
const PADDLE_RADIUS = 0.78;
const BALL_R = 0.25;
const MIN_Z = -TABLE_WIDTH / 2 + 0.3;
const MAX_Z = TABLE_WIDTH / 2 - 0.3;
const NET_HEIGHT = 0.74;
const NET_TOP = TABLE_TOP + NET_HEIGHT;
const GRAVITY = -10.8;
const BOUNCE = 0.58;

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
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function createGameScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
  onSnapshot: SnapshotListener,
  mode: MatchMode = "quick",
  difficultyId: Difficulty = "normal",
  selectedTable: TableTheme = TABLES[0],
  onlineRoom?: OnlineRoom,
): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = color(palette.night).toColor4(1);
  const camera = new ArcRotateCamera("camera", -Math.PI / 2, 1.04, 20.5, new Vector3(0, 0.78, 0), scene);
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
  key.intensity = 0.82;
  key.diffuse = color(palette.green);
  const rim = new PointLight("rim-light", new Vector3(5, 4, 5), scene);
  rim.intensity = 0.55;
  rim.diffuse = color(palette.coral);
  const glow = new GlowLayer("neon-glow", scene);
  glow.intensity = 0.42;

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

  const table = MeshBuilder.CreateBox("ping-pong-table", { width: TABLE_LENGTH, depth: TABLE_WIDTH, height: 0.42 }, scene);
  table.position.y = TABLE_TOP - 0.21;
  table.material = tableMat;
  const edge = MeshBuilder.CreateBox("table-edge", { width: TABLE_LENGTH + 0.22, depth: TABLE_WIDTH + 0.22, height: 0.18 }, scene);
  edge.position.y = TABLE_TOP - 0.02;
  edge.material = edgeMat;

  const line = (name: string, width: number, depth: number, x: number, z: number) => {
    const mesh = MeshBuilder.CreateBox(name, { width, depth, height: 0.035 }, scene);
    mesh.position.set(x, TABLE_TOP + 0.025, z);
    mesh.material = lineMat;
    return mesh;
  };
  line("center-line", 0.035, TABLE_WIDTH - 0.35, 0, 0);
  line("back-line", TABLE_LENGTH - 0.3, 0.05, 0, -TABLE_WIDTH / 2 + 0.25);
  line("front-line", TABLE_LENGTH - 0.3, 0.05, 0, TABLE_WIDTH / 2 - 0.25);

  // A ping-pong net crosses the short side of the table at its middle.
  const net = MeshBuilder.CreateBox("net", { width: 0.12, depth: TABLE_WIDTH + 0.08, height: NET_HEIGHT }, scene);
  net.position.set(0, TABLE_TOP + NET_HEIGHT / 2, 0);
  net.material = netMat;
  const netTop = MeshBuilder.CreateBox("net-top", { width: 0.2, depth: TABLE_WIDTH + 0.18, height: 0.08 }, scene);
  netTop.position.set(0, NET_TOP, 0);
  netTop.material = edgeMat;

  const makePaddle = (name: string, material: StandardMaterial, x: number) => {
    const paddle = MeshBuilder.CreateCylinder(name, { diameter: 1.55, height: 0.2, tessellation: 32 }, scene);
    paddle.rotation.z = Math.PI / 2;
    paddle.position.set(x, PADDLE_Y, 0);
    paddle.material = material;
    const face = MeshBuilder.CreateCylinder(`${name}-face`, { diameter: 1.26, height: 0.22, tessellation: 32 }, scene);
    face.rotation.z = Math.PI / 2;
    face.position.set(x + (x < 0 ? 0.12 : -0.12), PADDLE_Y, 0);
    face.material = mat(`${name}-face-material`, palette.night, 0.12);
    const grip = MeshBuilder.CreateBox(`${name}-grip`, { width: 0.36, depth: 0.22, height: 0.54 }, scene);
    grip.position.set(x + (x < 0 ? 0.44 : -0.44), TABLE_TOP + 0.04, 0);
    grip.material = material;
    return paddle;
  };
  const player = makePaddle("player-raquete", playerMat, PADDLE_X_PLAYER);
  const bot = makePaddle("bot-raquete", botMat, PADDLE_X_BOT);
  const ball = MeshBuilder.CreateSphere("ping-pong-ball", { diameter: BALL_R * 2, segments: 20 }, scene);
  ball.material = ballMat;

  const state = {
    status: "playing" as GameSnapshot["status"],
    playerScore: 0,
    botScore: 0,
    rally: 0,
    bestRally: 0,
    server: "player" as Side,
    message: "SAQUE DO JOGADOR",
    pointWinner: null as Side | null,
    elapsed: 0,
    playerZ: 0,
    botZ: 0,
    vx: 0,
    vz: 0,
    ballVy: 0,
    serveTimer: 0.8,
    pointTimer: 0,
    botThink: 0,
    targetBotZ: 0,
    mistakeOffset: 0,
    targetSide: "bot" as Side,
    expectedBounceSide: "player" as Side,
    bounced: false,
    localAxis: 0,
    onlinePlayers: onlineRoom ? 1 : 0,
  };
  const difficulty = DIFFICULTIES[difficultyId];
  const keys = new Set<string>();
  let disposed = false;
  const demo = new URLSearchParams(window.location.search).has("demo");
  let emitTimer = 0;

  const resetBall = () => {
    if (onlineRoom?.role === "guest") return;
    const fromPlayer = state.server === "player";
    state.vx = 0;
    state.vz = 0;
    state.ballVy = 0;
    state.serveTimer = 0.8;
    state.targetSide = fromPlayer ? "bot" : "player";
    state.expectedBounceSide = state.server;
    state.bounced = false;
    ball.position.set(fromPlayer ? PADDLE_X_PLAYER + 0.65 : PADDLE_X_BOT - 0.65, PADDLE_Y, fromPlayer ? state.playerZ : state.botZ);
    state.pointWinner = null;
    state.message = fromPlayer ? "SAQUE DO JOGADOR" : "SAQUE DO BOT";
  };

  const emit = () => {
    const snapshot: GameSnapshot = {
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
    ball: { x: ball.position.x, y: ball.position.z, vx: state.vx, vy: state.ballVy, trail: [] },
    table: selectedTable,
    difficulty,
    mode,
    elapsed: state.elapsed,
      ...(onlineRoom ? { online: { roomCode: onlineRoom.code, role: onlineRoom.role, players: state.onlinePlayers, connected: state.onlinePlayers >= 2 } } : {}),
    };
    onSnapshot(snapshot);
    if (onlineRoom?.role === "host") {
      onlineRoom.sendState({
        playerScore: state.playerScore,
        botScore: state.botScore,
        rally: state.rally,
        bestRally: state.bestRally,
        server: state.server,
        message: state.message,
        pointWinner: state.pointWinner,
        playerZ: state.playerZ,
        botZ: state.botZ,
        ballX: ball.position.x,
        ballY: ball.position.y,
        ballZ: ball.position.z,
        ballVx: state.vx,
        ballVy: state.ballVy,
        ballVz: state.vz,
        status: state.status,
        elapsed: state.elapsed,
      });
    }
  };

  const scorePoint = (winner: Side) => {
    state.pointWinner = winner;
    state.message = winner === "player" ? "PONTO SEU!" : "PONTO DO BOT";
    if (winner === "player") state.playerScore += 1; else state.botScore += 1;
    state.server = winner;
    state.rally = 0;
    state.pointTimer = 1.1;
    state.vx = 0;
    state.vz = 0;
    state.ballVy = 0;
    if ((state.playerScore >= 11 && state.playerScore - state.botScore >= 2) || (state.botScore >= 11 && state.botScore - state.playerScore >= 2) || state.playerScore + state.botScore >= 15) {
      state.status = state.playerScore > state.botScore ? "won" : "lost";
      state.message = state.status === "won" ? "VOCÊ DOMINOU A MESA" : "O BOT ROUBOU A CENA";
      state.pointTimer = 0;
    }
    emit();
  };

  const launchFromPaddle = (side: Side, relative: number) => {
    const direction = side === "player" ? 1 : -1;
    const speed = Math.min(9.4, Math.max(6.8, Math.hypot(state.vx, state.vz) + 0.16));
    state.vx = direction * speed;
    state.vz = relative * speed * 0.56;
    state.ballVy = 3.5 + Math.abs(relative) * 1.1;
    state.targetSide = side === "player" ? "bot" : "player";
    state.expectedBounceSide = state.targetSide;
    state.bounced = false;
    state.rally += 1;
    state.bestRally = Math.max(state.bestRally, state.rally);
    state.message = state.rally > 8 ? "TROCA INSANA!" : side === "player" ? "REBATE!" : "DEFENDE!";
  };

  const update = (dt: number) => {
    if (state.status !== "playing") return;
    state.elapsed += dt;
    if (onlineRoom && state.onlinePlayers < 2) {
      state.message = onlineRoom.role === "host" ? "AGUARDANDO JOGADOR 2" : "CONECTANDO À SALA";
      return;
    }
    const axis = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
    const localAxis = demo ? Math.sin(state.elapsed * 2.2) * 0.42 : axis;
    if (onlineRoom?.role === "guest") {
      state.localAxis = localAxis;
      state.botZ = clamp(state.botZ + state.localAxis * 7.5 * dt, MIN_Z, MAX_Z);
      const remote = onlineRoom.getLatestState();
      if (remote) {
        state.status = remote.status;
        state.playerScore = remote.playerScore;
        state.botScore = remote.botScore;
        state.rally = remote.rally;
        state.bestRally = remote.bestRally;
        state.server = remote.server;
        state.message = remote.message;
        state.pointWinner = remote.pointWinner;
        state.playerZ = remote.playerZ;
        state.elapsed = remote.elapsed;
        state.vx = remote.ballVx;
        state.vz = remote.ballVz;
        state.ballVy = remote.ballVy;
        ball.position.set(remote.ballX, remote.ballY, remote.ballZ);
      }
      player.position.z = state.playerZ;
      bot.position.z = state.botZ;
      onlineRoom.sendInput(state.botZ);
      return;
    }
    const desiredPlayer = demo ? Math.sin(state.elapsed * 2.2) * 3.15 : state.playerZ + localAxis * 7.5 * dt;
    state.playerZ += clamp(desiredPlayer - state.playerZ, -8 * dt, 8 * dt);
    state.playerZ = clamp(state.playerZ, MIN_Z, MAX_Z);
    player.position.z = state.playerZ;

    state.botThink -= dt;
    if (onlineRoom?.role === "host") {
      state.targetBotZ = clamp(onlineRoom.getRemoteInput(), MIN_Z, MAX_Z);
    } else if (state.botThink <= 0) {
      state.botThink = difficulty.reactionTime;
      const projected = state.vx > 0 ? ball.position.z + (state.vz / Math.max(state.vx, 0.1)) * (PADDLE_X_BOT - ball.position.x) : ball.position.z;
      state.targetBotZ = clamp(projected * difficulty.predictionDepth + state.mistakeOffset, MIN_Z, MAX_Z);
      if (Math.random() < difficulty.mistakeChance) state.mistakeOffset = (Math.random() - 0.5) * 3.4;
      else state.mistakeOffset *= 0.82;
    }
    state.botZ += clamp(state.targetBotZ - state.botZ, -difficulty.movementSpeed * dt, difficulty.movementSpeed * dt);
    state.botZ = clamp(state.botZ, MIN_Z, MAX_Z);
    bot.position.z = state.botZ;

    if (state.pointTimer > 0) {
      state.pointTimer -= dt;
      if (state.pointTimer <= 0) resetBall();
      return;
    }
    if (state.serveTimer > 0) {
      state.serveTimer -= dt;
      if (state.serveTimer <= 0) {
        const direction = state.server === "player" ? 1 : -1;
        const speed = mode === "training" ? 6.2 : 7.2;
        state.vx = speed * direction;
        state.vz = (Math.random() - 0.5) * 1.25;
        state.ballVy = 3.5;
        state.message = "SAQUE!";
      }
      return;
    }

    const previousX = ball.position.x;
    ball.position.x += state.vx * dt;
    ball.position.z += state.vz * dt;
    state.ballVy += GRAVITY * dt;
    ball.position.y += state.ballVy * dt;
    if (ball.position.z < MIN_Z + BALL_R || ball.position.z > MAX_Z - BALL_R) {
      ball.position.z = clamp(ball.position.z, MIN_Z + BALL_R, MAX_Z - BALL_R);
      state.vz *= -1;
    }

    // The ball must clear the net. Hitting it awards the point to the receiver.
    const crossedNet = (previousX < 0 && ball.position.x >= 0) || (previousX > 0 && ball.position.x <= 0);
    if (crossedNet && ball.position.y < NET_TOP + BALL_R * 0.25) {
      scorePoint(state.targetSide === "player" ? "bot" : "player");
      return;
    }

    // Gravity creates a real bounce on the table. A second bounce before the paddle loses the point.
    if (ball.position.y <= TABLE_TOP + BALL_R && state.ballVy < 0) {
      ball.position.y = TABLE_TOP + BALL_R;
      const ballSide: Side = ball.position.x < 0 ? "player" : "bot";
      const otherSide = state.targetSide === "player" ? "bot" : "player";
      if (ballSide !== state.expectedBounceSide || state.bounced) {
        scorePoint(otherSide);
        return;
      }
      if (ballSide === state.targetSide) state.bounced = true;
      else state.expectedBounceSide = state.targetSide;
      state.ballVy = Math.abs(state.ballVy) * BOUNCE;
      state.message = state.bounced ? "QUICOU! DEVOLVE!" : "QUICOU NO SEU LADO!";
    }

    const playerReach = ball.position.x <= PADDLE_X_PLAYER + 0.34 && ball.position.x >= PADDLE_X_PLAYER - 0.8;
    const botReach = ball.position.x >= PADDLE_X_BOT - 0.34 && ball.position.x <= PADDLE_X_BOT + 0.8;
    const playerHit = playerReach && state.vx < 0 && Math.abs(ball.position.z - state.playerZ) <= PADDLE_RADIUS && Math.abs(ball.position.y - PADDLE_Y) <= 0.92;
    const botHit = botReach && state.vx > 0 && Math.abs(ball.position.z - state.botZ) <= PADDLE_RADIUS && Math.abs(ball.position.y - PADDLE_Y) <= 0.92;
    if (playerHit) {
      if (!state.bounced) { scorePoint("bot"); return; }
      ball.position.x = PADDLE_X_PLAYER + 0.86;
      launchFromPaddle("player", clamp((ball.position.z - state.playerZ) / PADDLE_RADIUS, -1, 1));
    } else if (botHit) {
      if (!state.bounced) { scorePoint("player"); return; }
      ball.position.x = PADDLE_X_BOT - 0.86;
      launchFromPaddle("bot", clamp((ball.position.z - state.botZ) / PADDLE_RADIUS, -1, 1));
    }

    if (ball.position.x < PADDLE_X_PLAYER - 0.95) scorePoint("bot");
    else if (ball.position.x > PADDLE_X_BOT + 0.95) scorePoint("player");
  };

  const onKey = (event: KeyboardEvent) => {
    const keyName = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "w", "s", " "].includes(keyName)) event.preventDefault();
    if (event.type === "keydown") keys.add(keyName); else keys.delete(keyName);
    if (event.type === "keydown" && keyName === " ") {
      if (state.status === "paused") { state.status = "playing"; state.message = "VAI!"; }
      else if (state.status === "playing") { state.status = "paused"; state.message = "PAUSA"; }
      emit();
    }
  };
  const onTouchMove = (event: Event) => {
    const axis = Number((event as CustomEvent<{ axis?: number }>).detail?.axis ?? 0);
    if (onlineRoom?.role === "guest") state.botZ = clamp(state.botZ + axis * 0.28, MIN_Z, MAX_Z);
    else state.playerZ = clamp(state.playerZ + axis * 0.28, MIN_Z, MAX_Z);
  };
  const onTouchPause = () => {
    if (state.status === "paused") { state.status = "playing"; state.message = "VAI!"; }
    else if (state.status === "playing") { state.status = "paused"; state.message = "PAUSA"; }
    emit();
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  window.addEventListener("pring-touch-move", onTouchMove);
  window.addEventListener("pring-touch-pause", onTouchPause);
  if (onlineRoom) {
    void onlineRoom.connect({
      onInput: () => undefined,
      onState: () => undefined,
      onPresence: (count) => { state.onlinePlayers = count; emit(); },
    }).catch(() => { state.message = "CONEXÃO ONLINE INDISPONÍVEL"; emit(); });
  }
  scene.onBeforeRenderObservable.add(() => {
    if (disposed) return;
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.04);
    update(dt);
    emitTimer += dt;
    if (emitTimer >= 0.08) { emitTimer = 0; emit(); }
  });
  resetBall();
  emit();
  return Promise.resolve({ scene, dispose: () => { disposed = true; window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); window.removeEventListener("pring-touch-move", onTouchMove); window.removeEventListener("pring-touch-pause", onTouchPause); void onlineRoom?.close(); scene.dispose(); } });
}

export class PringPongas {
  static readonly title = "Pring Pongas";
}

void PringPongas;
