/**
 * Schlanker HTTP-Client für das DAVe-Backend.
 *
 * Aufrufe gehen relativ über den Pfad `/api/dave-backend-service` an denselben
 * Origin wie die Anwendung. Im Dev-Modus leitet der Vite-Proxy diesen Pfad an
 * das Backend weiter, im Container der nginx-Reverse-Proxy (siehe nginx.conf).
 * Dadurch entsteht kein CORS-Problem und es ist keine Backend-URL im Build nötig.
 */

/** Basis-Pfad – identisch zum Gateway-Präfix der DAVe-Portale. */
export const DAVE_API_BASE = "/api/dave-backend-service";

/** Fehler eines Backend-Aufrufs mit HTTP-Status und (sofern lesbar) Antworttext. */
export class DaveApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body: string
  ) {
    super(
      `DAVe-API ${path} antwortete mit HTTP ${status}` +
        (body ? `: ${body.slice(0, 300)}` : "")
    );
    this.name = "DaveApiError";
  }
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${DAVE_API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    // Netzwerkfehler (Backend nicht erreichbar, Proxy fehlt, …)
    throw new DaveApiError(0, path, String(cause));
  }

  const text = await response.text();
  if (!response.ok) {
    throw new DaveApiError(response.status, path, text);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}
