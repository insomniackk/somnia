import { Hono } from "hono";
import { proxyRest } from "@/lib/supabase-proxy";
import type { Bindings } from "@/lib/supabase-proxy";

const profiles = new Hono<{ Bindings: Bindings }>();

// GET /profiles — list onboarded profiles (with optional query params forwarded)
profiles.get("/", (c) => {
  const qs = c.req.url.split("?")[1];
  const path = qs ? `profiles?${qs}` : "profiles?is_onboarded=eq.true";
  return proxyRest(c.req.raw, c.env, path);
});

// GET /profiles/:id
profiles.get("/:id", (c) => {
  const { id } = c.req.param();
  return proxyRest(c.req.raw, c.env, `profiles?id=eq.${id}&limit=1`);
});

// PATCH /profiles/:id
profiles.patch("/:id", (c) => {
  const { id } = c.req.param();
  return proxyRest(c.req.raw, c.env, `profiles?id=eq.${id}`);
});

// GET /profiles/:id/preferences
profiles.get("/:id/preferences", (c) => {
  const { id } = c.req.param();
  return proxyRest(c.req.raw, c.env, `preferences?user_id=eq.${id}&limit=1`);
});

export default profiles;
