import { JwtService } from '@nestjs/jwt';
import {
	OnGatewayConnection,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { WsEvent } from '@libs/common';
import { TaskDto } from './dto/task.dto';

interface HandshakePayload {
	sub: string;
	email: string;
}

@WebSocketGateway({ namespace: 'tasks', cors: true })
export class TasksGateway implements OnGatewayConnection {
	@WebSocketServer()
	private readonly server!: Server;

	constructor(private readonly jwt: JwtService) {}

	async handleConnection(client: Socket): Promise<void> {
		const token = this.extractToken(client);
		if (!token) {
			client.disconnect();
			return;
		}
		try {
			const payload = await this.jwt.verifyAsync<HandshakePayload>(token);
			await client.join(this.room(payload.sub));
		} catch {
			client.disconnect();
		}
	}

	emitCreated(userId: string, task: TaskDto): void {
		this.server.to(this.room(userId)).emit(WsEvent.TaskCreated, task);
	}

	emitUpdated(userId: string, task: TaskDto): void {
		this.server.to(this.room(userId)).emit(WsEvent.TaskUpdated, task);
	}

	emitDeleted(userId: string, taskId: string): void {
		this.server.to(this.room(userId)).emit(WsEvent.TaskDeleted, { id: taskId });
	}

	private room(userId: string): string {
		return `user:${userId}`;
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
