export async function parseJsonResponse<T = unknown>(res: Response): Promise<T> {
  const raw = await res.text();
  let parsed: Record<string, unknown> | null = null;

  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const serverMessage =
      (parsed && typeof parsed.error === 'string' && parsed.error) ||
      (parsed && typeof parsed.message === 'string' && parsed.message) ||
      `Request failed with status ${res.status}.`;
    throw new Error(serverMessage);
  }

  if (parsed === null) {
    throw new Error(
      `Server returned a non-JSON response (HTTP ${res.status}). Please verify the API service is running.`
    );
  }

  return parsed as T;
}
