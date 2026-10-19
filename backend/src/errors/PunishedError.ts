export class PunishedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PunishedError";
  }
}
