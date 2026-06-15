import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailTakenException, InvalidCredentialsException } from '@libs/common';
import { UsersService } from '@module/users/users.service';
import { UserEntity } from '@module/users/entities/user.entity';
import { AuthTokenDto } from './dto/auth-token.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
	constructor(
		private readonly users: UsersService,
		private readonly jwt: JwtService,
	) {}

	async register(email: string, password: string): Promise<AuthTokenDto> {
		const existing = await this.users.findByEmail(email);
		if (existing) {
			throw new EmailTakenException();
		}
		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
		const user = await this.users.create(email, passwordHash);
		return this.sign(user);
	}

	async login(email: string, password: string): Promise<AuthTokenDto> {
		const user = await this.users.findByEmail(email);
		if (!user) {
			throw new InvalidCredentialsException();
		}
		const matches = await bcrypt.compare(password, user.passwordHash);
		if (!matches) {
			throw new InvalidCredentialsException();
		}
		return this.sign(user);
	}

	private sign(user: UserEntity): AuthTokenDto {
		const payload: JwtPayload = { sub: user.id, email: user.email };
		return new AuthTokenDto(this.jwt.sign(payload));
	}
}
