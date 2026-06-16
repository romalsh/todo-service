import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailTakenException, InvalidCredentialsException } from '@libs/common';
import { UsersService } from '@module/users/users.service';
import { UserEntity } from '@module/users/entities/user.entity';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
	id: 'user-1',
	email: 'user@example.com',
	passwordHash: 'hashed',
	tasks: [],
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

describe('AuthService', () => {
	let users: { create: jest.Mock; findByEmail: jest.Mock; findById: jest.Mock };
	let jwt: { sign: jest.Mock };
	let service: AuthService;

	beforeEach(() => {
		users = { create: jest.fn(), findByEmail: jest.fn(), findById: jest.fn() };
		jwt = { sign: jest.fn().mockReturnValue('signed-token') };
		service = new AuthService(
			users as unknown as UsersService,
			jwt as unknown as JwtService,
		);
	});

	describe('register', () => {
		it('hashes the password, creates the user and returns a token', async () => {
			users.findByEmail.mockResolvedValue(null);
			bcryptMock.hash.mockResolvedValue('hashed' as never);
			users.create.mockResolvedValue(buildUser());

			const result = await service.register('user@example.com', 'password123');

			expect(bcryptMock.hash).toHaveBeenCalledWith(
				'password123',
				expect.any(Number),
			);
			expect(users.create).toHaveBeenCalledWith('user@example.com', 'hashed');
			expect(result).toEqual({ accessToken: 'signed-token' });
		});

		it('rejects a duplicate email', async () => {
			users.findByEmail.mockResolvedValue(buildUser());

			await expect(
				service.register('user@example.com', 'password123'),
			).rejects.toBeInstanceOf(EmailTakenException);
			expect(users.create).not.toHaveBeenCalled();
		});
	});

	describe('login', () => {
		it('returns a token for valid credentials', async () => {
			users.findByEmail.mockResolvedValue(buildUser());
			bcryptMock.compare.mockResolvedValue(true as never);

			const result = await service.login('user@example.com', 'password123');

			expect(result).toEqual({ accessToken: 'signed-token' });
		});

		it('rejects an unknown email', async () => {
			users.findByEmail.mockResolvedValue(null);

			await expect(
				service.login('missing@example.com', 'password123'),
			).rejects.toBeInstanceOf(InvalidCredentialsException);
		});

		it('rejects a wrong password', async () => {
			users.findByEmail.mockResolvedValue(buildUser());
			bcryptMock.compare.mockResolvedValue(false as never);

			await expect(
				service.login('user@example.com', 'wrong'),
			).rejects.toBeInstanceOf(InvalidCredentialsException);
		});
	});
});
