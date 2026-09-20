import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw, Trophy } from "lucide-react";
import { PringPongas } from "@/game/PongGame";
import { DIFFICULTIES } from "@/game/content";
import type { Difficulty, GameSnapshot, MatchMode, TableTheme } from "@/game/types";

type PongCanvasProps = {
  mode: MatchMode;
  difficulty: Difficulty;
  table?: TableTheme;
  onBack: () => void;
  onRematch: () => void;
  onComplete: (snapshot: GameSnapshot) => void;
};

const initialSnapshot: GameSnapshot = {
  status: "playing",
  playerScore: 0,
  botScore: 0,
  rally: 0,
  bestRally: 0,
  server: "player",
  message: "SAQUE CAÓTICO",
  pointWinner: null,
  playerY: 300,
  botY: 300,
  ball: { x: 480, y: 300, vx: 0, vy: 0, trail: [] },
  table: { id: "school", name: "Mesa Escolar", environmentId: "gym", accent: "#B8F23D", secondary: "#FF5C61", floor: "#272044", mood: "Ginásio antigo" },
  difficulty: DIFFICULTIES.normal,
  mode: "quick",
  elapsed: 0,
};

export function PongCanvas({ mode, difficulty, table, onBack, onRematch, onComplete }: PongCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PringPongas | null>(null);
  const completedRef = useRef(false);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new PringPongas(canvas, (next) => {
      setSnapshot(next);
      if ((next.status === "won" || next.status === "lost") && !completedRef.current) {
        completedRef.current = true;
        onComplete(next);
      }
    });
    gameRef.current = game;
    completedRef.current = false;
    game.start(mode, difficulty, table);
    const handleResize = () => game.resize();
    const handleKey = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "w", "s", " "].includes(event.key)) event.preventDefault();
      game.handleKey(event.key, event.type === "keydown");
    };
    const handlePointer = (event: PointerEvent) => game.handlePointer(event.clientY);
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    canvas.addEventListener("pointermove", handlePointer);
    return () => {
      game.stop();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
      canvas.removeEventListener("pointermove", handlePointer);
      gameRef.current = null;
    };
  }, [difficulty, mode, onComplete, table]);

  const paused = snapshot.status === "paused";
  const finished = snapshot.status === "won" || snapshot.status === "lost";

  return (
    <main className="match-shell" aria-label="Partida de Pring Pongas">
      <header className="match-topbar">
        <button className="icon-button" onClick={onBack} aria-label="Voltar ao menu"><ArrowLeft size={18} /></button>
        <div className="match-brand"><span className="brand-mark small">P</span><span>PRING PONGAS</span></div>
        <div className="match-meta"><span className="live-dot" /> AO VIVO <b>{snapshot.table.mood}</b></div>
      </header>

      <section className="scoreboard" aria-live="polite">
        <div className={`score-team player ${snapshot.server === "player" ? "serving" : ""}`}>
          <div className="team-avatar avatar-green">PP</div>
          <div><span className="team-label">VOCÊ <i>{snapshot.server === "player" ? "SAQUE" : ""}</i></span><strong>{snapshot.playerScore.toString().padStart(2, "0")}</strong></div>
        </div>
        <div className="score-center"><span>RALLY</span><b>{snapshot.rally.toString().padStart(2, "0")}</b><small>{snapshot.difficulty.name.toUpperCase()} · {snapshot.mode === "training" ? "TREINO" : "MELHOR DE 11"}</small></div>
        <div className={`score-team bot ${snapshot.server === "bot" ? "serving" : ""}`}>
          <div><span className="team-label"><i>{snapshot.server === "bot" ? "SAQUE" : ""}</i> BOT</span><strong>{snapshot.botScore.toString().padStart(2, "0")}</strong></div>
          <div className="team-avatar avatar-coral">BT</div>
        </div>
      </section>

      <section className="canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" aria-label="Quadra de pingue-pongue. Use W/S ou setas para mover a raquete." />
        <div className="canvas-message">{snapshot.message}</div>
        {paused && <div className="game-overlay"><div className="overlay-card"><span className="eyebrow">INTERVALO ESTRATÉGICO</span><h2>PAUSA</h2><p>A bola está esperando o próximo caos.</p><button className="primary-button" onClick={() => gameRef.current?.togglePause()}><Play size={17} /> Retomar</button></div></div>}
        {finished && <div className="game-overlay"><div className="overlay-card result-card"><div className="trophy-icon"><Trophy size={24} /></div><span className="eyebrow">PARTIDA ENCERRADA</span><h2>{snapshot.status === "won" ? "VOCÊ AMASSOU" : "QUASE LÁ"}</h2><p>{snapshot.message}. Placar final <b>{snapshot.playerScore} x {snapshot.botScore}</b>.</p><div className="result-actions"><button className="primary-button" onClick={onRematch}><RotateCcw size={17} /> Outra partida</button><button className="ghost-button" onClick={onBack}>Voltar ao menu</button></div></div></div>}
      </section>

      <footer className="match-footer"><span><kbd>W</kbd><kbd>S</kbd> ou <kbd>↑</kbd><kbd>↓</kbd> mover</span><span className="match-callout"><span className="pulse-bar" /> {snapshot.rally > 8 ? "TROCA INSANA" : "NÃO DEIXE A BOLA ESCAPAR"}</span><button className="pause-button" onClick={() => gameRef.current?.togglePause()}>{paused ? <Play size={15} /> : <Pause size={15} />} {paused ? "Retomar" : "Pausar"}</button></footer>
    </main>
  );
}
