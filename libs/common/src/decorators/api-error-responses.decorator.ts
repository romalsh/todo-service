import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { ErrorCode } from '../enums/error-code.enum';
import { AppException } from '../errors/app.exception';

type AppExceptionClass = new () => AppException;

interface ErrorExample {
	status: HttpStatus;
	code: ErrorCode;
	message: string;
}

function describe(exception: AppExceptionClass): ErrorExample {
	const instance = new exception();
	const body = instance.getResponse() as { message: string };
	return {
		status: instance.getStatus(),
		code: instance.code,
		message: body.message,
	};
}

export function ApiErrorResponses(...exceptions: AppExceptionClass[]) {
	const byStatus = new Map<HttpStatus, ErrorExample[]>();
	for (const exception of exceptions) {
		const error = describe(exception);
		byStatus.set(error.status, [...(byStatus.get(error.status) ?? []), error]);
	}

	const decorators = [...byStatus.entries()].map(([status, errors]) =>
		ApiResponse({
			status,
			description: errors.map((error) => error.code).join(' | '),
			content: {
				'application/json': {
					schema: { $ref: getSchemaPath(ErrorResponseDto) },
					examples: Object.fromEntries(
						errors.map((error) => [
							error.code,
							{
								value: {
									statusCode: error.status,
									code: error.code,
									message: error.message,
								},
							},
						]),
					),
				},
			},
		}),
	);

	return applyDecorators(ApiExtraModels(ErrorResponseDto), ...decorators);
}
