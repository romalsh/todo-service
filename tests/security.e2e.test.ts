import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { buildTestApp, registerAndLogin, truncateAll } from './helpers';

describe('Security (e2e)', () => {
	let app: INestApplication;
	let token: string;

	beforeAll(async () => {
		app = await buildTestApp();
	});

	beforeEach(async () => {
		token = await registerAndLogin(app);
	});

	afterEach(async () => {
		await truncateAll(app);
	});

	afterAll(async () => {
		await app.close();
	});

	const createTask = () =>
		request(app.getHttpServer())
			.post('/api/tasks')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Task' });

	it('rejects a malformed token with 401', async () => {
		await request(app.getHttpServer())
			.get('/api/tasks')
			.set('Authorization', 'Bearer not.a.jwt')
			.expect(401);
	});

	it('rejects a tampered token with 401', async () => {
		await request(app.getHttpServer())
			.get('/api/tasks')
			.set('Authorization', `Bearer ${token}tampered`)
			.expect(401);
	});

	it('forbids updating a task owned by another user with 403', async () => {
		const created = await createTask().expect(201);
		const otherToken = await registerAndLogin(app, 'attacker@example.com');

		await request(app.getHttpServer())
			.patch(`/api/tasks/${created.body.id}`)
			.set('Authorization', `Bearer ${otherToken}`)
			.send({ title: 'hijacked' })
			.expect(403);
	});

	it('forbids deleting a task owned by another user with 403', async () => {
		const created = await createTask().expect(201);
		const otherToken = await registerAndLogin(app, 'attacker@example.com');

		await request(app.getHttpServer())
			.delete(`/api/tasks/${created.body.id}`)
			.set('Authorization', `Bearer ${otherToken}`)
			.expect(403);
	});
});
