export function parseEnv(value: string | undefined, name?: string): string {
  if (value == null) {
    throw new Error(
      `Missing required environment variable${name ? `: ${name}` : ""}`
    );
  }
  return value;
}
