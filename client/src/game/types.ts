export type Difficulty = "easy" | "normal" | "hard";
export type MatchMode = "quick" | "random" | "training" | "online";
export type GameStatus = "playing" | "paused" | "won" | "lost";

export type TableTheme = {
  id: string;
  name: string;
  environmentId: string;
  accent: string;
  secondary: string;
  floor: string;
  mood: string;
};

export type DifficultyConfig = {
  id: Difficulty;
  name: string;
  reactionTime: number;
  movementSpeed: number;
  predictionDepth: number;
  accuracy: number;
  mistakeChance: number;
  aggression: number;
};

export type Character = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  secondary: string;
  avatar: string;
};

export type Paddle = {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  size: number;
  speed: number;
  power: number;
  spin: number;
};

export type BallSnapshot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Array<{ x: number; y: number }>;
};

export type GameSnapshot = {
  status: GameStatus;
  playerScore: number;
  botScore: number;
  rally: number;
  bestRally: number;
  server: "player" | "bot";
  message: string;
  pointWinner: "player" | "bot" | null;
  playerY: number;
  botY: number;
  ball: BallSnapshot;
  table: TableTheme;
  difficulty: DifficultyConfig;
  mode: MatchMode;
  elapsed: number;
  online?: {
    roomCode: string;
    role: "host" | "guest";
    players: number;
    connected: boolean;
  };
};

export type Profile = {
  xp: number;
  wins: number;
  losses: number;
  bestRally: number;
  completedChallenges: string[];
};

export const DEFAULT_PROFILE: Profile = {
  xp: 120,
  wins: 0,
  losses: 0,
  bestRally: 0,
  completedChallenges: [],
};
