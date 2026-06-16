import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@libs/common';
import type { AppConfig } from '@core/config/configuration';
import { UsersService } from '@module/users/users.service';
import { UserEntity } from '@module/users/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
	id: 'user-1',
	email: 'user@example.com',
	passwordHash: 'hashed',
	tasks: [],
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

describe('JwtStrategy', () => {
	let users: { findById: jest.Mock };
	let strategy: JwtStrategy;

	beforeEach(() => {
		users = { findById: jest.fn() };
		const config = {
			get: jest.fn().mockReturnValue({ secret: 'test-secret', expiresIn: '1h' }),
		};
		strategy = new JwtStrategy(
			config as unknown as ConfigService<AppConfig, true>,
			users as unknown as UsersService,
		);
	});

	it('returns the authenticated user for a valid payload', async () => {
		users.findById.mockResolvedValue(buildUser());

		const result = await strategy.validate({
			sub: 'user-1',
			email: 'user@example.com',
		});

		expect(result).toEqual({ id: 'user-1', email: 'user@example.com' });
	});

	it('rejects when the user no longer exists', async () => {
		users.findById.mockResolvedValue(null);

		await expect(
			strategy.validate({ sub: 'missing', email: 'x@example.com' }),
		).rejects.toBeInstanceOf(UnauthorizedException);
	});
});
