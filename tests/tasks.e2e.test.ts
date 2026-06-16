import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { buildTestApp, registerAndLogin, truncateAll } from './helpers';

describe('Tasks (e2e)', () => {
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

	const createTask = (body: Record<string, unknown> = {}) =>
		request(app.getHttpServer())
			.post('/api/tasks')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Task', ...body });

	it('requires authentication', async () => {
		await request(app.getHttpServer()).get('/api/tasks').expect(401);
	});

	it('creates and fetches a task', async () => {
		const created = await createTask({ title: 'Buy milk' }).expect(201);
		expect(created.body).toMatchObject({ title: 'Buy milk', status: 'todo' });

		const fetched = await request(app.getHttpServer())
			.get(`/api/tasks/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(fetched.body.id).toBe(created.body.id);
	});

	it('filters by status and paginates', async () => {
		await createTask({ title: 'A', status: 'todo' }).expect(201);
		await createTask({ title: 'B', status: 'done' }).expect(201);
		await createTask({ title: 'C', status: 'done' }).expect(201);

		const res = await request(app.getHttpServer())
			.get('/api/tasks?status=done&page=1&limit=1')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(res.body.total).toBe(2);
		expect(res.body.items).toHaveLength(1);
		expect(res.body.items[0].status).toBe('done');
	});

	it('archives a task and exposes it read-only', async () => {
		const created = await createTask().expect(201);

		await request(app.getHttpServer())
			.delete(`/api/tasks/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(204);

		const active = await request(app.getHttpServer())
			.get('/api/tasks')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(active.body.total).toBe(0);

		const archived = await request(app.getHttpServer())
			.get('/api/tasks/archived')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(archived.body.total).toBe(1);

		await request(app.getHttpServer())
			.patch(`/api/tasks/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'changed' })
			.expect(409);
	});

	it('returns 404 for a missing task', async () => {
		await request(app.getHttpServer())
			.get('/api/tasks/00000000-0000-0000-0000-000000000000')
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
	});

	it('returns 403 for a task owned by another user', async () => {
		const created = await createTask().expect(201);
		const otherToken = await registerAndLogin(app, 'other@example.com');

		await request(app.getHttpServer())
			.get(`/api/tasks/${created.body.id}`)
			.set('Authorization', `Bearer ${otherToken}`)
			.expect(403);
	});

	it('rejects an invalid create body with 400', async () => {
		await request(app.getHttpServer())
			.post('/api/tasks')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: '' })
			.expect(400);
	});
});
