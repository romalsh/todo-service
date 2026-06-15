import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
	id: string;
	email: string;
}

export const CurrentUser = createParamDecorator(
	(field: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string => {
		const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
		return field ? request.user[field] : request.user;
	},
);
