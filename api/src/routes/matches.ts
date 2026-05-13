import { Hono } from "hono";
import { proxyRest } from "@/lib/supabase-proxy";
import type { Bindings } from "@/lib/supabase-proxy";

const matches = new Hono<{ Bindings: Bindings }>();

// POST /swipes — record a swipe (like / pass / super_like)
matches.post("/swipes", (c) => proxyRest(c.req.raw, c.env, "swipes"));

// GET /matches — list matches for the authenticated user
// RLS ensures only the caller's matches are returned
matches.get("/", (c) => {
  const qs = c.req.url.split("?")[1];
  const path = qs ? `matches?${qs}` : "matches?select=*,conversations(id)";
  return proxyRest(c.req.raw, c.env, path);
});

// GET /matches/:id
matches.get("/:id", (c) => {
  const { id } = c.req.param();
  return proxyRest(c.req.raw, c.env, `matches?id=eq.${id}&limit=1`);
});

// GET /conversations/:id/messages
matches.get("/conversations/:id/messages", (c) => {
  const { id } = c.req.param();
  return proxyRest(
    c.req.raw,
    c.env,
    `messages?conversation_id=eq.${id}&order=created_at.asc`,
  );
});

// POST /conversations/:id/messages — send a message
matches.post("/conversations/:id/messages", (c) => {
  return proxyRest(c.req.raw, c.env, "messages");
});

export default matches;
