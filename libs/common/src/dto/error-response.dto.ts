import { ApiProperty } from '@nestjs/swagger';
import { ErrorCode } from '../enums/error-code.enum';

export class ErrorResponseDto {
	@ApiProperty({ example: 404 })
	statusCode!: number;

	@ApiProperty({ enum: ErrorCode, example: ErrorCode.TASK_NOT_FOUND })
	code!: ErrorCode;

	@ApiProperty({ example: 'task not found' })
	message!: string;

	@ApiProperty({ example: '/tasks/123' })
	path!: string;

	@ApiProperty({ example: '2026-06-16T12:00:00.000Z' })
	timestamp!: string;
}
