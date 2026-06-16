import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { buildTestApp, truncateAll } from './helpers';

describe('Auth (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		app = await buildTestApp();
	});

	afterEach(async () => {
		await truncateAll(app);
	});

	afterAll(async () => {
		await app.close();
	});

	it('registers a new user and returns an access token', async () => {
		const res = await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ email: 'new@example.com', password: 'password123' })
			.expect(201);

		expect(res.body.accessToken).toEqual(expect.any(String));
	});

	it('logs in with valid credentials', async () => {
		await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ email: 'login@example.com', password: 'password123' })
			.expect(201);

		const res = await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ email: 'login@example.com', password: 'password123' })
			.expect(200);

		expect(res.body.accessToken).toEqual(expect.any(String));
	});

	it('rejects a duplicate registration with 409', async () => {
		await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ email: 'dup@example.com', password: 'password123' })
			.expect(201);

		const res = await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ email: 'dup@example.com', password: 'password123' })
			.expect(409);

		expect(res.body.code).toBe('EMAIL_TAKEN');
	});

	it('rejects invalid credentials with 401', async () => {
		const res = await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ email: 'missing@example.com', password: 'password123' })
			.expect(401);

		expect(res.body.code).toBe('INVALID_CREDENTIALS');
	});

	it('rejects a malformed body with 400', async () => {
		const res = await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ email: 'not-an-email', password: 'short' })
			.expect(400);

		expect(res.body.code).toBe('VALIDATION_ERROR');
	});
});
