import type { BallSnapshot } from "./types";

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const speedOf = (vx: number, vy: number): number => Math.sqrt(vx * vx + vy * vy);

export const bounceFromPaddle = (
  ball: Pick<BallSnapshot, "y" | "vx" | "vy">,
  paddleY: number,
  paddleHeight: number,
  direction: 1 | -1,
  minSpeed: number,
  maxSpeed: number,
): { vx: number; vy: number } => {
  const relative = clamp((ball.y - paddleY) / (paddleHeight / 2), -1, 1);
  const angle = relative * 1.08;
  const nextSpeed = clamp(speedOf(ball.vx, ball.vy) + 14, minSpeed, maxSpeed);
  const spin = Math.sin(angle) * nextSpeed * 0.82;
  const horizontal = Math.sqrt(Math.max(1, nextSpeed * nextSpeed - spin * spin));
  return { vx: direction * horizontal, vy: spin };
};

export const willHitPaddle = (
  ball: Pick<BallSnapshot, "x" | "y" | "vx">,
  paddleX: number,
  paddleY: number,
  paddleWidth: number,
  paddleHeight: number,
  radius: number,
): boolean => {
  const withinX = ball.x + radius >= paddleX && ball.x - radius <= paddleX + paddleWidth;
  const withinY = ball.y + radius >= paddleY - paddleHeight / 2 && ball.y - radius <= paddleY + paddleHeight / 2;
  return withinX && withinY && ((ball.vx < 0 && paddleX < 480) || (ball.vx > 0 && paddleX > 480));
};
