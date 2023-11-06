import { Request, Response } from "express";

import CustomException from "@exception/custom.exception";
import { InternalServeError } from "@exception/response/server.exception";
import ErrorResponseBuilder from "@common/builder/error-response.builder";

class HandlerException {
  constructor(error: Error, request: Request, response: Response) {
    if (this.isTrustedError(error)) {
      this.handleTrustedError(error as CustomException, request, response);
    } else {
      this.handleUntrustedError(error, request, response);
    }
  }

  private isTrustedError(error: Error): boolean {
    return error instanceof CustomException ? error.errorOperational : false;
  }

  private handleTrustedError(error: CustomException, request: Request, response: Response): void {
    this.handleErrorResponse(error, response);
  }

  private normalizeError(error: Error): Error {
    if (typeof error === "object" && error instanceof Error) {
      return error;
    } else if (typeof error === "string") {
      return new Error(error);
    }
    return new Error(JSON.stringify(error));
  }

  private handleUntrustedError(error: Error, request: Request, response: Response): void {
    const serialized = this.normalizeError(error).message;
    error = new InternalServeError(serialized);
    this.handleErrorResponse(error as CustomException, response);
  }

  private handleErrorResponse(error: CustomException, response: Response) {
    response.status(error.errorCode).send(
      ErrorResponseBuilder({
        statusCode: error.errorCode,
        payload: {
          errorCode: error.errorCode,
          errorName: error.errorName,
          errorMessage: error.errorMessage,
          ...((error.errorRawMessage as CustomException) && {
            errorRawMessage: error.errorRawMessage,
          }),
        },
      }),
    );
  }
}

export default HandlerException;
