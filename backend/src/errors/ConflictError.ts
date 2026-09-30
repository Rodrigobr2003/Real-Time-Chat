// Erro de negócio que o controller traduz para HTTP 409.
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
