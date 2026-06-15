import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { ErrorCode } from '../enums/error-code.enum';

const STATUS_BY_CODE: Record<ErrorCode, HttpStatus> = {
	[ErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
	[ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
	[ErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
	[ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
	[ErrorCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
	[ErrorCode.TASK_NOT_FOUND]: HttpStatus.NOT_FOUND,
	[ErrorCode.TASK_ARCHIVED]: HttpStatus.CONFLICT,
	[ErrorCode.EMAIL_TAKEN]: HttpStatus.CONFLICT,
	[ErrorCode.TOO_MANY_REQUESTS]: HttpStatus.TOO_MANY_REQUESTS,
	[ErrorCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
};

export function ApiErrorResponses(...codes: ErrorCode[]) {
	const byStatus = new Map<HttpStatus, ErrorCode[]>();
	for (const code of codes) {
		const status = STATUS_BY_CODE[code];
		byStatus.set(status, [...(byStatus.get(status) ?? []), code]);
	}

	const decorators = [...byStatus.entries()].map(([status, statusCodes]) =>
		ApiResponse({
			status,
			type: ErrorResponseDto,
			description: statusCodes.join(' | '),
		}),
	);

	return applyDecorators(...decorators);
}
