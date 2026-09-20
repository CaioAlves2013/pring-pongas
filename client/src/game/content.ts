import type { Character, Difficulty, DifficultyConfig, Paddle, TableTheme } from "./types";

export const CHARACTERS: Character[] = [
  { id: "zeca", name: "Zeca Nervoso", tagline: "A pressão é pessoal.", color: "#FF5C61", secondary: "#FFD447", avatar: "ZN" },
  { id: "bia", name: "Bia Turbo", tagline: "Pisca e já foi.", color: "#B8F23D", secondary: "#72D7F2", avatar: "BT" },
  { id: "professor", name: "Professor Ponto", tagline: "Tudo em seu ângulo.", color: "#72D7F2", secondary: "#F7F5EA", avatar: "PP" },
  { id: "nina", name: "Nina Fantasma", tagline: "Você nem viu voltar.", color: "#B9B5CE", secondary: "#272044", avatar: "NF" },
  { id: "tonhao", name: "Tonhão Cósmico", tagline: "A física pede licença.", color: "#FFD447", secondary: "#FF5C61", avatar: "TC" },
];

export const PADDLES: Paddle[] = [
  { id: "wood", name: "Madeira clássica", rarity: "common", size: 1, speed: 1, power: 1, spin: 1 },
  { id: "pan", name: "Frigideira", rarity: "rare", size: 1.08, speed: 0.94, power: 1.12, spin: 1 },
  { id: "pizza", name: "Pizza", rarity: "epic", size: 1.03, speed: 0.98, power: 1.05, spin: 1.12 },
  { id: "neon", name: "Neon", rarity: "epic", size: 0.96, speed: 1.12, power: 0.98, spin: 1.16 },
];

export const TABLES: TableTheme[] = [
  { id: "school", name: "Mesa Escolar", environmentId: "gym", accent: "#B8F23D", secondary: "#FF5C61", floor: "#272044", mood: "Ginásio antigo" },
  { id: "neon", name: "Mesa Neon", environmentId: "arcade", accent: "#72D7F2", secondary: "#B8F23D", floor: "#15152B", mood: "Fliperama futurista" },
  { id: "ice", name: "Mesa de Gelo", environmentId: "frozen", accent: "#F7F5EA", secondary: "#72D7F2", floor: "#1e3555", mood: "Arena congelada" },
];

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { id: "easy", name: "Fácil", reactionTime: 0.2, movementSpeed: 280, predictionDepth: 0, accuracy: 0.62, mistakeChance: 0.18, aggression: 0.35 },
  normal: { id: "normal", name: "Normal", reactionTime: 0.1, movementSpeed: 355, predictionDepth: 1, accuracy: 0.78, mistakeChance: 0.1, aggression: 0.52 },
  hard: { id: "hard", name: "Difícil", reactionTime: 0.055, movementSpeed: 440, predictionDepth: 2, accuracy: 0.9, mistakeChance: 0.055, aggression: 0.72 },
};

export const CHALLENGES = [
  { id: "rally-20", title: "Não pisca", description: "Faça 20 rebatidas seguidas.", reward: "+80 XP", progress: 0, goal: 20 },
  { id: "win-pan", title: "Cozinha quente", description: "Vença usando a Frigideira.", reward: "Raquete", progress: 0, goal: 1 },
  { id: "ice-win", title: "Frio na barriga", description: "Vença na Mesa de Gelo.", reward: "+120 XP", progress: 0, goal: 1 },
];

export const randomFrom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
