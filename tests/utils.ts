export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function prettyJson(data: object): string {
  return JSON.stringify(data, null, 2);
}
