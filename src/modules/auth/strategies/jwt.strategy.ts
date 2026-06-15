import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser, UnauthorizedException } from '@libs/common';
import type { AppConfig } from '@core/config/configuration';
import { UsersService } from '@module/users/users.service';

export interface JwtPayload {
	sub: string;
	email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		config: ConfigService<AppConfig, true>,
		private readonly users: UsersService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: config.get('jwt', { infer: true }).secret,
		});
	}

	async validate(payload: JwtPayload): Promise<AuthUser> {
		const user = await this.users.findById(payload.sub);
		if (!user) {
			throw new UnauthorizedException('user no longer exists');
		}
		return { id: user.id, email: user.email };
	}
}
