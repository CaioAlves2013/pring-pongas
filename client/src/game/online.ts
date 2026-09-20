import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jvqxolwsluvxbmbjmudw.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_Xw5MpItckpw-OGg9IZH98Q_H4XrDWcG";

export type OnlineRole = "host" | "guest";
export type OnlineInput = { z: number };
export type OnlineState = {
  playerScore: number;
  botScore: number;
  rally: number;
  bestRally: number;
  server: "player" | "bot";
  message: string;
  pointWinner: "player" | "bot" | null;
  playerZ: number;
  botZ: number;
  ballX: number;
  ballY: number;
  ballZ: number;
  ballVx: number;
  ballVy: number;
  ballVz: number;
  status: "playing" | "paused" | "won" | "lost";
  elapsed: number;
};

type RoomCallbacks = {
  onInput: (input: OnlineInput) => void;
  onState: (state: OnlineState) => void;
  onPresence: (count: number) => void;
};

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  realtime: { params: { eventsPerSecond: 30 } },
});

export const makeRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export class OnlineRoom {
  readonly code: string;
  readonly role: OnlineRole;
  private channel: RealtimeChannel | null = null;
  private remoteInput = 0;
  private latestState: OnlineState | null = null;

  constructor(code: string, role: OnlineRole) {
    this.code = code.toUpperCase();
    this.role = role;
  }

  async connect(callbacks: RoomCallbacks) {
    const channel = supabase.channel(`pring-pongas-room-${this.code}`, {
      config: { broadcast: { ack: false }, presence: { key: this.role } },
    });
    this.channel = channel;
    channel.on("broadcast", { event: "input" }, ({ payload }) => {
      if (this.role === "host") this.remoteInput = Number(payload?.z ?? 0);
      callbacks.onInput({ z: Number(payload?.z ?? 0) });
    });
    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      if (this.role === "guest") {
        this.latestState = payload as OnlineState;
        callbacks.onState(this.latestState);
      }
    });
    const reportPresence = () => {
      callbacks.onPresence(Object.keys(channel.presenceState()).length);
    };
    channel.on("presence", { event: "sync" }, reportPresence);
    channel.on("presence", { event: "join" }, reportPresence);
    channel.on("presence", { event: "leave" }, reportPresence);
    const status = await new Promise<string>((resolve, reject) => {
      channel.subscribe(async (nextStatus) => {
        if (nextStatus === "SUBSCRIBED") {
          await channel.track({ role: this.role, joinedAt: Date.now() });
          resolve(nextStatus);
        } else if (nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT") {
          reject(new Error(`Realtime ${nextStatus}`));
        }
      });
    });
    return status;
  }

  sendInput(z: number) {
    if (!this.channel || this.role !== "guest") return;
    void this.channel.send({ type: "broadcast", event: "input", payload: { z } });
  }

  getRemoteInput() {
    return this.remoteInput;
  }

  sendState(state: OnlineState) {
    if (!this.channel || this.role !== "host") return;
    void this.channel.send({ type: "broadcast", event: "state", payload: state });
  }

  getLatestState() {
    return this.latestState;
  }

  async close() {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
