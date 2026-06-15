import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export class AppException extends HttpException {
	constructor(
		public readonly code: ErrorCode,
		message: string,
		status: HttpStatus,
	) {
		super({ code, message, statusCode: status }, status);
	}
}

export class UnauthorizedException extends AppException {
	constructor(message = 'unauthorized') {
		super(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
	}
}

export class InvalidCredentialsException extends AppException {
	constructor(message = 'invalid email or password') {
		super(ErrorCode.INVALID_CREDENTIALS, message, HttpStatus.UNAUTHORIZED);
	}
}

export class EmailTakenException extends AppException {
	constructor(message = 'email already registered') {
		super(ErrorCode.EMAIL_TAKEN, message, HttpStatus.CONFLICT);
	}
}

export class TaskNotFoundException extends AppException {
	constructor(message = 'task not found') {
		super(ErrorCode.TASK_NOT_FOUND, message, HttpStatus.NOT_FOUND);
	}
}

export class TaskForbiddenException extends AppException {
	constructor(message = 'you do not have access to this task') {
		super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
	}
}

export class TaskArchivedException extends AppException {
	constructor(message = 'archived tasks are read-only') {
		super(ErrorCode.TASK_ARCHIVED, message, HttpStatus.CONFLICT);
	}
}
