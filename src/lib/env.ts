type EnvironmentSource = Record<string, string | undefined>;

function readHttpUrl(source: EnvironmentSource, name: string): string {
  const value = source[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTP URL`);
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password
  ) {
    throw new Error(`${name} must be an HTTP URL without credentials`);
  }

  return url.href.replace(/\/$/, "");
}

export function readEnvironment(source: EnvironmentSource) {
  return {
    publicApiBaseUrl: readHttpUrl(source, "NEXT_PUBLIC_API_BASE_URL"),
    internalApiBaseUrl: readHttpUrl(source, "API_INTERNAL_URL"),
    appUrl: readHttpUrl(source, "NEXT_PUBLIC_APP_URL"),
  };
}
