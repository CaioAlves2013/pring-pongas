import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Gamepad2, Library, Medal, Settings2, Sparkles, Target, Zap } from "lucide-react";
import { PongCanvas } from "@/components/PongCanvas";
import { CHARACTERS, CHALLENGES, DIFFICULTIES, PADDLES, TABLES, randomFrom } from "@/game/content";
import type { Difficulty, GameSnapshot, MatchMode, Profile, TableTheme } from "@/game/types";
import { DEFAULT_PROFILE } from "@/game/types";

const PROFILE_KEY = "pring-pongas-profile";

type Screen = "home" | "match" | "collection" | "challenges" | "settings";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<MatchMode>("quick");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [selectedTable, setSelectedTable] = useState<TableTheme>(TABLES[0]);
  const [profile, setProfile] = useState<Profile>(() => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null") ?? DEFAULT_PROFILE; } catch { return DEFAULT_PROFILE; }
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }, [profile]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("demo")) setScreen("match");
  }, []);

  const level = Math.max(1, Math.floor(profile.xp / 180) + 1);
  const xpInLevel = profile.xp % 180;
  const featured = useMemo(() => randomFrom(CHARACTERS), []);

  const startMatch = (nextMode: MatchMode = mode) => {
    setMode(nextMode);
    if (nextMode === "random") {
      setSelectedTable(randomFrom(TABLES));
      setDifficulty(randomFrom(["easy", "normal", "hard"]));
    }
    setScreen("match");
  };

  const finishMatch = useCallback((snapshot: GameSnapshot) => {
    if (snapshot.status !== "won" && snapshot.status !== "lost") return;
    setProfile((current) => ({
      ...current,
      xp: current.xp + (snapshot.status === "won" ? 80 + snapshot.bestRally * 2 : 25),
      wins: current.wins + (snapshot.status === "won" ? 1 : 0),
      losses: current.losses + (snapshot.status === "lost" ? 1 : 0),
      bestRally: Math.max(current.bestRally, snapshot.bestRally),
      completedChallenges: snapshot.bestRally >= 20 && !current.completedChallenges.includes("rally-20") ? [...current.completedChallenges, "rally-20"] : current.completedChallenges,
    }));
  }, []);

  if (screen === "match") return <PongCanvas mode={mode} difficulty={difficulty} table={selectedTable} onBack={() => setScreen("home")} onRematch={() => startMatch(mode)} onComplete={finishMatch} />;

  return (
    <main className={`app-shell ${reducedMotion ? "reduced-motion" : ""}`}>
      <div className="grain" />
      <header className="topbar">
        <button className="brand-lockup" onClick={() => setScreen("home")} aria-label="Ir para o início"><span className="brand-mark">P</span><span className="brand-name">PRING<br /><em>PONGAS</em></span></button>
        <nav className="main-nav" aria-label="Navegação principal">
          <button className={screen === "home" ? "active" : ""} onClick={() => setScreen("home")}><Gamepad2 size={16} /> Jogar</button>
          <button className={screen === "collection" ? "active" : ""} onClick={() => setScreen("collection")}><Library size={16} /> Coleção</button>
          <button className={screen === "challenges" ? "active" : ""} onClick={() => setScreen("challenges")}><Target size={16} /> Desafios</button>
        </nav>
        <div className="profile-chip"><div className="mini-avatar">PP</div><div><b>NÍVEL {level}</b><span>{profile.xp} XP</span></div><button className="settings-trigger" onClick={() => setScreen("settings")} aria-label="Configurações"><Settings2 size={16} /></button></div>
      </header>

      {screen === "home" && <>
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="spark-dot" /> ARCADE DE PINGUE-PONGUE <span className="eyebrow-line" /></div>
            <h1>O esporte<br /><span>mais torto</span><br />do bairro.</h1>
            <p>Raquetes exageradas, bolas com atitude e um placar que não conhece a palavra calma. Entre na mesa e faça história — ou pelo menos faça barulho.</p>
            <div className="hero-actions"><button className="primary-button hero-button" onClick={() => startMatch("quick")}><Zap size={18} fill="currentColor" /> Partida rápida <ArrowRight size={18} /></button><button className="secondary-button" onClick={() => startMatch("random")}>Modo aleatório <Sparkles size={16} /></button></div>
            <div className="control-note"><span><kbd>W</kbd><kbd>S</kbd> mover</span><span className="note-separator">·</span><span><kbd>ESPAÇO</kbd> pausar</span></div>
          </div>
          <div className="hero-art" role="img" aria-label="Arte de referência: partida caótica de Pring Pongas"><div className="hero-art-overlay" /><div className="art-sticker sticker-one">PÁ!</div><div className="art-sticker sticker-two">+12</div><div className="art-caption"><span className="live-dot" /> MESA 01 / GINÁSIO ANTIGO</div><div className="art-ball">•ᴗ•</div></div>
        </section>

        <section className="quick-panel">
          <div className="section-kicker"><span>CONFIGURAÇÃO RÁPIDA</span><i>você escolhe o caos</i></div>
          <div className="quick-grid">
            <label className="select-block"><span>01 / DIFICULDADE</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>{Object.values(DIFFICULTIES).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><ChevronDown size={16} /></label>
            <label className="select-block"><span>02 / MESA</span><select value={selectedTable.id} onChange={(event) => setSelectedTable(TABLES.find((item) => item.id === event.target.value) ?? TABLES[0])}>{TABLES.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.mood}</option>)}</select><ChevronDown size={16} /></label>
            <button className="start-strip" onClick={() => startMatch("quick")}><span>ENTRAR NA MESA</span><ArrowRight size={20} /></button>
          </div>
        </section>

        <section className="lower-grid">
          <article className="feature-card"><div className="card-topline"><span>PERSONAGEM EM DESTAQUE</span><span className="card-index">0{CHARACTERS.indexOf(featured) + 1} / 05</span></div><div className="feature-content"><div className="character-orbit"><div className="orbit-ring" /><div className="character-face" style={{ background: featured.color }}><span>{featured.avatar}</span></div><span className="character-spark spark-a">✦</span><span className="character-spark spark-b">✦</span></div><div><h2>{featured.name}</h2><p>“{featured.tagline}”</p><button className="text-button" onClick={() => setScreen("collection")}>ver coleção <ArrowRight size={15} /></button></div></div></article>
          <article className="stats-card"><div className="card-topline"><span>SEU PLACAR</span><Medal size={16} /></div><div className="stats-row"><div><strong>{profile.wins.toString().padStart(2, "0")}</strong><span>VITÓRIAS</span></div><div><strong>{profile.bestRally.toString().padStart(2, "0")}</strong><span>MELHOR RALLY</span></div><div><strong>{xpInLevel.toString().padStart(3, "0")}</strong><span>XP / 180</span></div></div><div className="xp-track"><span style={{ width: `${Math.max(6, (xpInLevel / 180) * 100)}%` }} /></div></article>
        </section>
        <footer className="site-footer"><span>PRING PONGAS <b>© 2026</b></span><span>feito para quem rebate com estilo</span><span><button onClick={() => setScreen("settings")}>ACESSIBILIDADE</button></span></footer>
      </>}

      {screen === "collection" && <section className="content-page"><div className="page-heading"><div><span className="eyebrow">INVENTÁRIO DE CAOS</span><h1>Coleção</h1><p>Itens para deixar a mesa com a sua cara — e um pouco mais barulhenta.</p></div><button className="ghost-button" onClick={() => setScreen("home")}>Voltar</button></div><div className="collection-section"><h2>Personagens <span>05 desbloqueados</span></h2><div className="character-grid">{CHARACTERS.map((item) => <article className="collection-card" key={item.id}><div className="collection-avatar" style={{ background: item.color }}>{item.avatar}</div><div><h3>{item.name}</h3><p>{item.tagline}</p></div><span className="unlock-dot" /></article>)}</div></div><div className="collection-section"><h2>Raquetes <span>visuais disponíveis</span></h2><div className="paddle-grid">{PADDLES.map((item) => <article className="paddle-card" key={item.id}><div className={`paddle-shape paddle-${item.id}`}><span>P</span></div><div><h3>{item.name}</h3><p>{item.rarity.toUpperCase()} · velocidade {Math.round(item.speed * 100)}%</p></div></article>)}</div></div></section>}

      {screen === "challenges" && <section className="content-page narrow-page"><div className="page-heading"><div><span className="eyebrow">MISSÕES DA SEMANA</span><h1>Desafios</h1><p>Pequenas metas. Grandes histórias para contar no recreio.</p></div><button className="ghost-button" onClick={() => setScreen("home")}>Voltar</button></div><div className="challenge-list">{CHALLENGES.map((challenge) => { const done = profile.completedChallenges.includes(challenge.id); return <article className={`challenge-row ${done ? "done" : ""}`} key={challenge.id}><div className="challenge-icon"><Target size={20} /></div><div className="challenge-copy"><h2>{challenge.title} {done && <span>CONCLUÍDO</span>}</h2><p>{challenge.description}</p></div><strong>{challenge.reward}</strong><ArrowRight size={17} /></article>; })}</div><div className="challenge-tip"><Sparkles size={18} /><p><b>Dica de arena:</b> no modo Treino, a bola começa mais lenta. Use para aquecer o pulso e caçar seu próximo recorde.</p><button className="secondary-button" onClick={() => startMatch("training")}>Treinar agora</button></div></section>}

      {screen === "settings" && <section className="content-page narrow-page"><div className="page-heading"><div><span className="eyebrow">AJUSTES DO JOGADOR</span><h1>Configurações</h1><p>Faça o caos funcionar do seu jeito.</p></div><button className="ghost-button" onClick={() => setScreen("home")}>Voltar</button></div><div className="settings-list"><label><div><b>Reduzir movimento</b><span>Desliga animações decorativas da interface.</span></div><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /></label><label><div><b>Contraste reforçado</b><span>A paleta já foi desenhada para alto contraste.</span></div><span className="setting-badge">ATIVO</span></label><label><div><b>Controles</b><span>W/S ou setas para mover · espaço para pausar.</span></div><span className="setting-badge">TECLADO</span></label></div></section>}
    </main>
  );
}
