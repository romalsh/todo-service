import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AllExceptionsFilter } from '@libs/common';
import { AppModule } from '../src/app.module';

let emailCounter = 0;

export async function buildTestApp(): Promise<INestApplication> {
	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	const app = moduleRef.createNestApplication();
	app.setGlobalPrefix('api');
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);
	app.useGlobalFilters(new AllExceptionsFilter());
	await app.init();
	return app;
}

export async function truncateAll(app: INestApplication): Promise<void> {
	const dataSource = app.get(DataSource);
	await dataSource.query('TRUNCATE TABLE "tasks", "users" RESTART IDENTITY CASCADE');
}

export async function registerAndLogin(
	app: INestApplication,
	email?: string,
): Promise<string> {
	const address = email ?? `user${emailCounter++}@example.com`;
	const res = await request(app.getHttpServer())
		.post('/api/auth/register')
		.send({ email: address, password: 'password123' })
		.expect(201);
	return res.body.accessToken as string;
}
