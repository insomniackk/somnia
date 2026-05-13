export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

// Forwards a request to Supabase REST (/rest/v1/*).
// Passes the caller's Authorization header so RLS policies apply normally.
export async function proxyRest(
  request: Request,
  env: Bindings,
  path: string,
  { serviceRole = false }: { serviceRole?: boolean } = {},
): Promise<Response> {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;

  const headers = new Headers();
  headers.set("apikey", serviceRole ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY);
  headers.set("Content-Type", "application/json");

  const authHeader = request.headers.get("Authorization");
  if (authHeader) headers.set("Authorization", authHeader);

  // Pass through Supabase query modifiers
  for (const h of ["Prefer", "Range", "Accept-Profile", "Content-Profile"]) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();

  return fetch(url, { method: request.method, headers, body });
}

// Forwards a request to Supabase Auth (/auth/v1/*).
export async function proxyAuth(
  request: Request,
  env: Bindings,
  path: string,
): Promise<Response> {
  const url = `${env.SUPABASE_URL}/auth/v1/${path}`;

  const headers = new Headers();
  headers.set("apikey", env.SUPABASE_ANON_KEY);
  headers.set("Content-Type", "application/json");

  const authHeader = request.headers.get("Authorization");
  if (authHeader) headers.set("Authorization", authHeader);

  const body = await request.text();
  return fetch(url, { method: request.method, headers, body });
}
