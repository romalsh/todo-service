import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';
import { AppException } from '../errors/app.exception';

interface ErrorBody {
	statusCode: number;
	code: ErrorCode;
	message: string;
	path: string;
	timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const body = this.toErrorBody(exception, request.url);

		if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
			this.logger.error(
				`${request.method} ${request.url} -> ${body.statusCode}`,
				exception instanceof Error ? exception.stack : String(exception),
			);
		}

		response.status(body.statusCode).json(body);
	}

	private toErrorBody(exception: unknown, path: string): ErrorBody {
		const timestamp = new Date().toISOString();

		if (exception instanceof AppException) {
			return {
				statusCode: exception.getStatus(),
				code: exception.code,
				message: this.extractMessage(exception.getResponse()),
				path,
				timestamp,
			};
		}

		if (exception instanceof ThrottlerException) {
			return {
				statusCode: HttpStatus.TOO_MANY_REQUESTS,
				code: ErrorCode.TOO_MANY_REQUESTS,
				message: 'too many requests, slow down',
				path,
				timestamp,
			};
		}

		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			return {
				statusCode: status,
				code: this.codeForStatus(status),
				message: this.extractMessage(exception.getResponse()),
				path,
				timestamp,
			};
		}

		return {
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			code: ErrorCode.INTERNAL_ERROR,
			message: 'internal server error',
			path,
			timestamp,
		};
	}

	private codeForStatus(status: number): ErrorCode {
		switch (status) {
			case HttpStatus.BAD_REQUEST:
				return ErrorCode.VALIDATION_ERROR;
			case HttpStatus.UNAUTHORIZED:
				return ErrorCode.UNAUTHORIZED;
			case HttpStatus.FORBIDDEN:
				return ErrorCode.FORBIDDEN;
			case HttpStatus.NOT_FOUND:
				return ErrorCode.NOT_FOUND;
			case HttpStatus.TOO_MANY_REQUESTS:
				return ErrorCode.TOO_MANY_REQUESTS;
			default:
				return ErrorCode.INTERNAL_ERROR;
		}
	}

	private extractMessage(response: string | object): string {
		if (typeof response === 'string') {
			return response;
		}
		const message = (response as { message?: unknown }).message;
		if (Array.isArray(message)) {
			return message.join('; ');
		}
		if (typeof message === 'string') {
			return message;
		}
		return 'error';
	}
}
