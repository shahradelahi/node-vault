export class VaultError extends Error {
  constructor(error: string[] | string | null) {
    if (Array.isArray(error)) {
      error = error.join('\n');
    }
    super(error && error !== '' ? error : 'Not Found');
  }
}
