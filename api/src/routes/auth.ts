import { Hono } from "hono";
import { proxyAuth } from "@/lib/supabase-proxy";
import type { Bindings } from "@/lib/supabase-proxy";

const auth = new Hono<{ Bindings: Bindings }>();

// POST /auth/signup
auth.post("/signup", (c) => proxyAuth(c.req.raw, c.env, "signup"));

// POST /auth/login
auth.post("/login", (c) => proxyAuth(c.req.raw, c.env, "token?grant_type=password"));

// POST /auth/logout
auth.post("/logout", (c) => proxyAuth(c.req.raw, c.env, "logout"));

// POST /auth/refresh
auth.post("/refresh", (c) => proxyAuth(c.req.raw, c.env, "token?grant_type=refresh_token"));

// GET  /auth/user  — returns the current user from the JWT
auth.get("/user", (c) => proxyAuth(c.req.raw, c.env, "user"));

export default auth;
