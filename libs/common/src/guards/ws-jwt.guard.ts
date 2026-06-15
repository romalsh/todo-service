import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import type { AuthUser } from '../decorators/current-user.decorator';

interface JwtPayload {
	sub: string;
	email: string;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
	constructor(private readonly jwtService: JwtService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client = context.switchToWs().getClient<Socket>();
		const token = this.extractToken(client);
		if (!token) {
			throw new WsException('missing authentication token');
		}
		try {
			const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
			client.data.user = { id: payload.sub, email: payload.email };
			return true;
		} catch {
			throw new WsException('invalid authentication token');
		}
	}

	private extractToken(client: Socket): string | undefined {
		const fromAuth = client.handshake.auth?.token as string | undefined;
		if (fromAuth) {
			return fromAuth.replace(/^Bearer\s+/i, '');
		}
		const header = client.handshake.headers.authorization;
		if (header?.startsWith('Bearer ')) {
			return header.slice(7);
		}
		return undefined;
	}
}
