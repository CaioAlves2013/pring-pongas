import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MousePointer2, Pause, Play, RotateCcw, Trophy } from "lucide-react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene, type GameHandle } from "@/game/scene";
import type { OnlineRoom } from "@/game/online";
import { DIFFICULTIES } from "@/game/content";
import type { Difficulty, GameSnapshot, MatchMode, TableTheme } from "@/game/types";

type PongCanvasProps = { mode: MatchMode; difficulty: Difficulty; table?: TableTheme; onlineRoom?: OnlineRoom; onBack: () => void; onRematch: () => void; onComplete: (snapshot: GameSnapshot) => void };

const initialSnapshot: GameSnapshot = { status: "playing", playerScore: 0, botScore: 0, rally: 0, bestRally: 0, server: "player", message: "SAQUE CAÓTICO", pointWinner: null, playerY: 0, botY: 0, ball: { x: 0, y: 0, vx: 0, vy: 0, trail: [] }, table: { id: "school", name: "Mesa Escolar", environmentId: "gym", accent: "#B8F23D", secondary: "#FF5C61", floor: "#272044", mood: "Ginásio antigo" }, difficulty: DIFFICULTIES.normal, mode: "quick", elapsed: 0 };

export function PongCanvas({ mode, difficulty, table, onlineRoom, onBack, onRematch, onComplete }: PongCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const handleRef = useRef<GameHandle | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const touchAxis = (axis: number) => window.dispatchEvent(new CustomEvent("pring-touch-move", { detail: { axis } }));
  const startTouchControl = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    const axis = (event.clientY - rect.top) / rect.height - 0.5;
    touchAxis(axis * 2);
  };
  const moveTouchControl = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      const rect = event.currentTarget.getBoundingClientRect();
      const axis = (event.clientY - rect.top) / rect.height - 0.5;
      touchAxis(axis * 2);
    }
  };
  const endTouchControl = (event: React.PointerEvent<HTMLDivElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    let disposed = false;
    createGameScene(engine, canvas, (next) => {
      if (disposed) return;
      setSnapshot(next);
      if ((next.status === "won" || next.status === "lost") && !completedRef.current) { completedRef.current = true; onComplete(next); }
    }, mode, difficulty, table, onlineRoom).then((handle) => {
      if (disposed) { handle.dispose(); return; }
      handleRef.current = handle;
      engine.runRenderLoop(() => handle.scene.render());
    });
    const resize = () => engine.resize();
    window.addEventListener("resize", resize);
    return () => { disposed = true; window.removeEventListener("resize", resize); handleRef.current?.dispose(); engine.dispose(); handleRef.current = null; startedRef.current = false; };
  }, [difficulty, mode, onComplete, onlineRoom, table]);

  const paused = snapshot.status === "paused";
  const finished = snapshot.status === "won" || snapshot.status === "lost";
  return <main className="match-shell first-person-match" aria-label="Partida 3D em primeira pessoa de Pring Pongas">
    <header className="match-topbar"><button className="icon-button" onClick={onBack} aria-label="Voltar ao menu"><ArrowLeft size={18} /></button><div className="match-brand"><span className="brand-mark small">P</span><span>PRING PONGAS 3D</span></div><div className="match-meta"><span className="live-dot" /> {snapshot.online ? `SALA ${snapshot.online.roomCode} · ${snapshot.online.players}/2` : "ARENA 3D"} <b>{snapshot.online ? (snapshot.online.role === "host" ? "JOGADOR 1" : "JOGADOR 2") : snapshot.table.mood}</b></div></header>
    <section className="scoreboard"><div className="score-team player"><div className="team-avatar avatar-green">PP</div><div><span className="team-label">VOCÊ <i>{snapshot.server === "player" ? "SAQUE" : ""}</i></span><strong>{snapshot.playerScore.toString().padStart(2, "0")}</strong></div></div><div className="score-center"><span>RALLY</span><b>{snapshot.rally.toString().padStart(2, "0")}</b><small>{snapshot.difficulty.name.toUpperCase()} · 3D</small></div><div className="score-team bot"><div><span className="team-label"><i>{snapshot.server === "bot" ? "SAQUE" : ""}</i> BOT</span><strong>{snapshot.botScore.toString().padStart(2, "0")}</strong></div><div className="team-avatar avatar-coral">BT</div></div></section>
    <section className="canvas-wrap"><canvas ref={canvasRef} className="game-canvas game-canvas-3d" aria-label="Mesa tridimensional em primeira pessoa. Mova o mouse para controlar a raquete e clique na mesa para capturar o ponteiro." /><div className="canvas-message">{snapshot.message}</div><div className="mouse-hint"><MousePointer2 size={15} /> MOUSE: MOVER RAQUETE · CLIQUE: CAPTURAR</div><div className="touch-controls" aria-label="Controle touch da raquete" onPointerDown={startTouchControl} onPointerMove={moveTouchControl} onPointerUp={endTouchControl} onPointerCancel={endTouchControl}><span className="touch-label">ARRASTE PARA MOVER</span><span className="touch-knob">↕</span></div>{paused && <div className="game-overlay"><div className="overlay-card"><span className="eyebrow">INTERVALO ESTRATÉGICO</span><h2>PAUSA</h2><p>A arena 3D está esperando o próximo caos.</p><button className="primary-button" onClick={() => window.dispatchEvent(new CustomEvent("pring-touch-pause"))}><Play size={17} /> Retomar</button></div></div>}{finished && <div className="game-overlay"><div className="overlay-card result-card"><div className="trophy-icon"><Trophy size={24} /></div><span className="eyebrow">PARTIDA ENCERRADA</span><h2>{snapshot.status === "won" ? "VOCÊ AMASSOU" : "QUASE LÁ"}</h2><p>{snapshot.message}. Placar final <b>{snapshot.playerScore} x {snapshot.botScore}</b>.</p><div className="result-actions"><button className="primary-button" onClick={onRematch}><RotateCcw size={17} /> Outra partida</button><button className="ghost-button" onClick={onBack}>Voltar ao menu</button></div></div></div>}</section>
    <footer className="match-footer"><span><MousePointer2 size={13} /> mover raquete</span><span className="match-callout"><span className="pulse-bar" /> PRIMEIRA PESSOA · RAQUETE 3D</span><button className="pause-button" onClick={() => window.dispatchEvent(new CustomEvent("pring-touch-pause"))}>{paused ? <Play size={15} /> : <Pause size={15} />} {paused ? "Retomar" : "Pausar"}</button></footer>
  </main>;
}
