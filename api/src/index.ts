import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Bindings } from "@/lib/supabase-proxy";
import auth from "@/routes/auth";
import profiles from "@/routes/profiles";
import matches from "@/routes/matches";

const app = new Hono<{ Bindings: Bindings }>();

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: ["*"], // tighten to your Expo scheme / domain before production
    allowHeaders: ["Authorization", "Content-Type", "Prefer"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// ─── Health ────────────────────────────────────────────────────────────────────

app.get("/", (c) => c.json({ app: "somnia-api", status: "ok" }));
app.get("/health", (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route("/auth", auth);
app.route("/profiles", profiles);
app.route("/matches", matches);

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
