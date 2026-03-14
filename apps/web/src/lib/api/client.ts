type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function buildUrl(path: string) {
  if (!API_BASE_URL) return path;
  const base = API_BASE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function parseError(res: Response): Promise<ApiError> {
  let details: unknown;
  try {
    details = await res.json();
  } catch {
    details = await res.text();
  }

  return {
    status: res.status,
    message: res.statusText || "Request failed",
    details,
  };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  return (await res.json()) as T;
}
