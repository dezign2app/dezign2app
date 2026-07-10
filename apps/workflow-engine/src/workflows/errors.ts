export class WorkflowExecutionError extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "WorkflowExecutionError";
    Object.setPrototypeOf(this, WorkflowExecutionError.prototype);
  }
}
