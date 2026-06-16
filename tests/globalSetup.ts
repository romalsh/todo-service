import {
	PostgreSqlContainer,
	StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { InitExtensions1781561547042 } from '../db/migrations/1781561547042-InitExtensions';
import { InitSchema1781561588601 } from '../db/migrations/1781561588601-InitSchema';

export default async function globalSetup(): Promise<void> {
	const container = await new PostgreSqlContainer('postgres:16-alpine').start();

	process.env.NODE_ENV = 'test';
	process.env.DB_HOST = container.getHost();
	process.env.DB_PORT = String(container.getPort());
	process.env.DB_USERNAME = container.getUsername();
	process.env.DB_PASSWORD = container.getPassword();
	process.env.DB_NAME = container.getDatabase();
	process.env.JWT_SECRET = 'test-secret-value-at-least-32-characters-long';
	process.env.JWT_EXPIRES_IN = '1h';
	process.env.THROTTLE_TTL = '60';
	process.env.THROTTLE_LIMIT = '100000';
	process.env.THROTTLE_AUTH_TTL = '60';
	process.env.THROTTLE_AUTH_LIMIT = '100000';

	const dataSource = new DataSource({
		type: 'postgres',
		host: container.getHost(),
		port: container.getPort(),
		username: container.getUsername(),
		password: container.getPassword(),
		database: container.getDatabase(),
		entities: [],
		migrations: [InitExtensions1781561547042, InitSchema1781561588601],
	});

	await dataSource.initialize();
	await dataSource.runMigrations();
	await dataSource.destroy();

	(globalThis as { __PG_CONTAINER__?: StartedPostgreSqlContainer }).__PG_CONTAINER__ =
		container;
}
