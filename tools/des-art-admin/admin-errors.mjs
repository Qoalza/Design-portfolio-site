export class LocalRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "LocalRequestError";
    this.code = code;
  }
}

export class PublishCommandError extends Error {
  constructor({ failedOperation, failureCode, exitCode, retryable, attempt, diagnosticId, cause }) {
    super("Команда публикации завершилась с ошибкой.", cause ? { cause } : undefined);
    this.name = "PublishCommandError";
    this.failedOperation = failedOperation;
    this.failureCode = failureCode;
    this.exitCode = exitCode;
    this.retryable = retryable;
    this.attempt = attempt;
    this.diagnosticId = diagnosticId;
  }
}
