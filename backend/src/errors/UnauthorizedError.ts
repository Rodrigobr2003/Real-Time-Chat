// Erro de negócio que o controller traduz para HTTP 401.
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
