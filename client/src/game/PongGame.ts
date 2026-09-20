import { DIFFICULTIES, TABLES, randomFrom } from "./content";
import { bounceFromPaddle, clamp, willHitPaddle } from "./physics";
import type { Difficulty, GameSnapshot, MatchMode, TableTheme } from "./types";

type SnapshotListener = (snapshot: GameSnapshot) => void;

const W = 960;
const H = 600;
const PADDLE_WIDTH = 28;
const PADDLE_HEIGHT = 132;
const BALL_RADIUS = 14;
const TOP = 84;
const BOTTOM = H - 54;

const COLORS = {
  night: "#15152B",
  purple: "#272044",
  green: "#B8F23D",
  coral: "#FF5C61",
  yellow: "#FFD447",
  ice: "#72D7F2",
  white: "#F7F5EA",
  lavender: "#B9B5CE",
};

export class PongGame {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly onSnapshot: SnapshotListener;
  private frame = 0;
  private lastTime = 0;
  private syncTimer = 0;
  private started = false;
  private serveTimer = 0;
  private pointTimer = 0;
  private elapsed = 0;
  private readonly keys = new Set<string>();
  private playerY = H / 2;
  private botY = H / 2;
  private targetBotY = H / 2;
  private botThink = 0;
  private botMistakeOffset = 0;
  private playerScore = 0;
  private botScore = 0;
  private rally = 0;
  private bestRally = 0;
  private server: "player" | "bot" = "player";
  private message = "PREPARE-SE";
  private pointWinner: "player" | "bot" | null = null;
  private status: GameSnapshot["status"] = "playing";
  private mode: MatchMode = "quick";
  private difficulty = DIFFICULTIES.normal;
  private table: TableTheme = TABLES[0];
  private ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, trail: [] as Array<{ x: number; y: number }> };

  constructor(canvas: HTMLCanvasElement, onSnapshot: SnapshotListener) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D indisponível");
    this.ctx = context;
    this.onSnapshot = onSnapshot;
    this.resize();
  }

  start(mode: MatchMode, difficulty: Difficulty, table?: TableTheme): void {
    this.mode = mode;
    this.difficulty = DIFFICULTIES[difficulty];
    this.table = table ?? (mode === "random" ? randomFrom(TABLES) : TABLES[0]);
    this.playerScore = 0;
    this.botScore = 0;
    this.rally = 0;
    this.bestRally = 0;
    this.server = Math.random() > 0.5 ? "player" : "bot";
    this.status = "playing";
    this.elapsed = 0;
    this.pointWinner = null;
    this.message = "SAQUE CAÓTICO";
    this.playerY = H / 2;
    this.botY = H / 2;
    this.resetBall();
    this.started = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
    this.emit(true);
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.started = false;
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(this.canvas.width / W, 0, 0, this.canvas.height / H, 0, 0);
    this.render();
  }

  handleKey(key: string, pressed: boolean): void {
    if (pressed) this.keys.add(key.toLowerCase());
    else this.keys.delete(key.toLowerCase());
    if (pressed && key === " ") this.togglePause();
  }

  handlePointer(clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.playerY = clamp(((clientY - rect.top) / rect.height) * H, TOP + PADDLE_HEIGHT / 2, BOTTOM - PADDLE_HEIGHT / 2);
  }

  togglePause(): void {
    if (!this.started || this.status === "won" || this.status === "lost") return;
    this.status = this.status === "paused" ? "playing" : "paused";
    this.message = this.status === "paused" ? "PAUSA" : "VAI!";
    this.emit(true);
  }

  private readonly tick = (time: number): void => {
    const delta = Math.min((time - this.lastTime) / 1000, 0.035);
    this.lastTime = time;
    if (this.started) {
      if (this.status === "playing") this.update(delta);
      this.render();
      this.syncTimer += delta;
      if (this.syncTimer > 0.08) {
        this.syncTimer = 0;
        this.emit();
      }
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private update(delta: number): void {
    this.elapsed += delta;
    if (this.pointTimer > 0) {
      this.pointTimer -= delta;
      if (this.pointTimer <= 0 && this.status === "playing") {
        this.pointWinner = null;
        this.message = "SAQUE CAÓTICO";
        this.resetBall();
      }
      this.updatePlayer(delta);
      this.updateBot(delta);
      return;
    }

    if (this.serveTimer > 0) {
      this.serveTimer -= delta;
      this.updatePlayer(delta);
      this.updateBot(delta);
      if (this.serveTimer <= 0) {
        const direction = this.server === "player" ? 1 : -1;
        const angle = (Math.random() - 0.5) * 0.74;
        const speed = this.mode === "training" ? 400 : 455;
        this.ball.vx = Math.cos(angle) * speed * direction;
        this.ball.vy = Math.sin(angle) * speed;
        this.message = "REBATE!";
      }
      return;
    }

    this.updatePlayer(delta);
    this.updateBot(delta);
    this.ball.x += this.ball.vx * delta;
    this.ball.y += this.ball.vy * delta;
    this.ball.trail.unshift({ x: this.ball.x, y: this.ball.y });
    this.ball.trail = this.ball.trail.slice(0, 8);

    if (this.ball.y - BALL_RADIUS <= TOP) {
      this.ball.y = TOP + BALL_RADIUS;
      this.ball.vy = Math.abs(this.ball.vy);
    }
    if (this.ball.y + BALL_RADIUS >= BOTTOM) {
      this.ball.y = BOTTOM - BALL_RADIUS;
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    const leftX = 52;
    const rightX = W - 52 - PADDLE_WIDTH;
    if (willHitPaddle(this.ball, leftX, this.playerY, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS)) {
      this.ball.x = leftX + PADDLE_WIDTH + BALL_RADIUS;
      const next = bounceFromPaddle(this.ball, this.playerY, PADDLE_HEIGHT, 1, 420, 920);
      this.ball.vx = next.vx;
      this.ball.vy = next.vy;
      this.rally += 1;
      this.bestRally = Math.max(this.bestRally, this.rally);
      this.message = this.rally > 8 ? "TROCA INSANA!" : "BOA!";
    }
    if (willHitPaddle(this.ball, rightX, this.botY, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_RADIUS)) {
      this.ball.x = rightX - BALL_RADIUS;
      const next = bounceFromPaddle(this.ball, this.botY, PADDLE_HEIGHT, -1, 420, 920);
      this.ball.vx = next.vx;
      this.ball.vy = next.vy;
      this.rally += 1;
      this.bestRally = Math.max(this.bestRally, this.rally);
      this.message = this.rally > 8 ? "TROCA INSANA!" : "DEFENDE!";
    }

    if (this.ball.x < -32) this.scorePoint("bot");
    if (this.ball.x > W + 32) this.scorePoint("player");
  }

  private updatePlayer(delta: number): void {
    const axis = (this.keys.has("arrowdown") || this.keys.has("s") ? 1 : 0) - (this.keys.has("arrowup") || this.keys.has("w") ? 1 : 0);
    const demo = new URLSearchParams(window.location.search).has("demo");
    const desired = demo ? this.ball.y + Math.sin(this.elapsed * 2.4) * 12 : this.playerY + axis * 520 * delta;
    if (demo) this.playerY += clamp(desired - this.playerY, -640 * delta, 640 * delta);
    else this.playerY = desired;
    this.playerY = clamp(this.playerY, TOP + PADDLE_HEIGHT / 2, BOTTOM - PADDLE_HEIGHT / 2);
  }

  private updateBot(delta: number): void {
    this.botThink -= delta;
    if (this.botThink <= 0) {
      this.botThink = this.difficulty.reactionTime;
      const movingTowardBot = this.ball.vx > 0;
      const prediction = movingTowardBot ? this.ball.y + (this.ball.vy / Math.max(this.ball.vx, 1)) * (W - 110 - this.ball.x) * this.difficulty.predictionDepth * 0.16 : H / 2;
      this.targetBotY = clamp(prediction + this.botMistakeOffset, TOP + PADDLE_HEIGHT / 2, BOTTOM - PADDLE_HEIGHT / 2);
      if (Math.random() < this.difficulty.mistakeChance) this.botMistakeOffset = (Math.random() - 0.5) * 180;
      else this.botMistakeOffset *= 0.86;
    }
    const diff = this.targetBotY - this.botY;
    const move = clamp(diff, -this.difficulty.movementSpeed * delta, this.difficulty.movementSpeed * delta);
    this.botY = clamp(this.botY + move, TOP + PADDLE_HEIGHT / 2, BOTTOM - PADDLE_HEIGHT / 2);
  }

  private scorePoint(winner: "player" | "bot"): void {
    this.pointWinner = winner;
    this.message = winner === "player" ? "PONTO SEU!" : "PONTO DO BOT";
    if (winner === "player") this.playerScore += 1;
    else this.botScore += 1;
    this.server = winner;
    this.rally = 0;
    this.pointTimer = 1.05;
    this.ball.vx = 0;
    this.ball.vy = 0;
    const playerWon = this.playerScore >= 11 && this.playerScore - this.botScore >= 2;
    const botWon = this.botScore >= 11 && this.botScore - this.playerScore >= 2;
    const suddenCap = this.playerScore + this.botScore >= 15;
    if (playerWon || botWon || suddenCap) {
      this.status = playerWon || (suddenCap && this.playerScore > this.botScore) ? "won" : "lost";
      this.message = this.status === "won" ? "VOCÊ DOMINOU A MESA" : "O BOT ROUBOU A CENA";
      this.pointTimer = 0;
    }
    this.emit(true);
  }

  private resetBall(): void {
    this.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, trail: [] };
    this.serveTimer = 0.72;
  }

  private emit(force = false): void {
    if (!force && !this.started) return;
    this.onSnapshot({
      status: this.status,
      playerScore: this.playerScore,
      botScore: this.botScore,
      rally: this.rally,
      bestRally: this.bestRally,
      server: this.server,
      message: this.message,
      pointWinner: this.pointWinner,
      playerY: this.playerY,
      botY: this.botY,
      ball: { ...this.ball, trail: [...this.ball.trail] },
      table: this.table,
      difficulty: this.difficulty,
      mode: this.mode,
      elapsed: this.elapsed,
    });
  }

  private render(): void {
    const c = this.ctx;
    c.clearRect(0, 0, W, H);
    this.drawBackground(c);
    this.drawArena(c);
    this.drawPaddle(c, 66, this.playerY, COLORS.green, "P");
    this.drawPaddle(c, W - 66, this.botY, COLORS.coral, "B");
    this.drawBall(c);
    this.drawForeground(c);
  }

  private drawBackground(c: CanvasRenderingContext2D): void {
    const gradient = c.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, COLORS.night);
    gradient.addColorStop(0.52, this.table.floor);
    gradient.addColorStop(1, COLORS.purple);
    c.fillStyle = gradient;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 0.1;
    for (let x = 0; x < W; x += 42) {
      c.fillStyle = x % 84 === 0 ? COLORS.ice : COLORS.coral;
      c.fillRect(x, 0, 2, H);
    }
    c.globalAlpha = 1;
    c.fillStyle = COLORS.yellow;
    c.globalAlpha = 0.5;
    c.beginPath(); c.arc(92, 96, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = COLORS.green;
    c.beginPath(); c.arc(866, 126, 5, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  }

  private drawArena(c: CanvasRenderingContext2D): void {
    c.save();
    c.translate(W / 2, H / 2 + 18);
    c.rotate(-0.035);
    c.translate(-W / 2, -H / 2 - 18);
    const tableGradient = c.createLinearGradient(0, TOP, 0, BOTTOM);
    tableGradient.addColorStop(0, this.table.accent);
    tableGradient.addColorStop(0.04, this.table.secondary);
    tableGradient.addColorStop(0.09, this.table.accent);
    tableGradient.addColorStop(1, this.table.secondary);
    c.fillStyle = tableGradient;
    c.shadowColor = "rgba(0,0,0,.45)";
    c.shadowBlur = 30;
    c.shadowOffsetY = 16;
    this.roundRect(c, 38, TOP - 18, W - 76, BOTTOM - TOP + 30, 26);
    c.fill();
    c.shadowColor = "transparent";
    c.fillStyle = "rgba(21,21,43,.76)";
    this.roundRect(c, 60, TOP + 10, W - 120, BOTTOM - TOP - 18, 16);
    c.fill();
    c.strokeStyle = COLORS.white;
    c.lineWidth = 4;
    c.globalAlpha = 0.84;
    c.strokeRect(92, TOP + 38, W - 184, BOTTOM - TOP - 74);
    c.beginPath(); c.moveTo(W / 2, TOP + 38); c.lineTo(W / 2, BOTTOM - 36); c.stroke();
    c.globalAlpha = 1;
    c.setLineDash([7, 9]);
    c.strokeStyle = this.table.accent;
    c.lineWidth = 6;
    c.beginPath(); c.moveTo(W / 2, TOP + 4); c.lineTo(W / 2, BOTTOM + 2); c.stroke();
    c.setLineDash([]);
    c.fillStyle = COLORS.yellow;
    c.globalAlpha = 0.7;
    for (let x = 120; x < W - 100; x += 84) {
      c.fillRect(x, BOTTOM + 12, 24, 8);
    }
    c.globalAlpha = 1;
    c.restore();
  }

  private drawPaddle(c: CanvasRenderingContext2D, centerX: number, centerY: number, color: string, label: string): void {
    c.save();
    c.translate(centerX, centerY);
    c.shadowColor = color;
    c.shadowBlur = 18;
    c.fillStyle = color;
    this.roundRect(c, -PADDLE_WIDTH / 2, -PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, 14);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = COLORS.night;
    this.roundRect(c, -8, -PADDLE_HEIGHT / 2 + 14, 16, PADDLE_HEIGHT - 28, 8);
    c.fill();
    c.fillStyle = COLORS.white;
    c.font = "800 16px 'Arial Black', sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(label, 0, 0);
    c.fillStyle = COLORS.yellow;
    c.beginPath(); c.arc(0, -PADDLE_HEIGHT / 2 + 6, 4, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  private drawBall(c: CanvasRenderingContext2D): void {
    this.ball.trail.forEach((point, index) => {
      c.globalAlpha = (1 - index / 10) * 0.16;
      c.fillStyle = index % 2 === 0 ? COLORS.yellow : COLORS.coral;
      c.beginPath(); c.arc(point.x, point.y, BALL_RADIUS - index, 0, Math.PI * 2); c.fill();
    });
    c.globalAlpha = 1;
    c.save();
    c.translate(this.ball.x, this.ball.y);
    c.rotate(Math.sin(this.elapsed * 8) * 0.14);
    c.shadowColor = COLORS.yellow;
    c.shadowBlur = 22;
    c.fillStyle = COLORS.yellow;
    c.beginPath(); c.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = COLORS.night;
    c.beginPath(); c.arc(-5, -3, 2.5, 0, Math.PI * 2); c.arc(5, -3, 2.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = COLORS.night;
    c.lineWidth = 2;
    c.beginPath(); c.arc(0, 3, 6, 0.15, Math.PI - 0.15); c.stroke();
    c.restore();
  }

  private drawForeground(c: CanvasRenderingContext2D): void {
    c.fillStyle = COLORS.white;
    c.font = "900 12px 'Arial Black', sans-serif";
    c.fillText("PRING PONGAS // ARENA 01", 26, 30);
    c.fillStyle = this.table.accent;
    c.fillText(this.table.name.toUpperCase(), W - 164, 30);
  }

  private roundRect(c: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    const r = Math.min(radius, width / 2, height / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + width, y, x + width, y + height, r);
    c.arcTo(x + width, y + height, x, y + height, r);
    c.arcTo(x, y + height, x, y, r);
    c.arcTo(x, y, x + width, y, r);
    c.closePath();
  }
}

export class PringPongas extends PongGame {}
