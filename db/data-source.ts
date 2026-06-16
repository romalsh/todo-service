import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

loadEnv();

const isCompiled = __filename.endsWith('.js');

const dataSource = new DataSource({
	type: 'postgres',
	host: process.env.DB_HOST ?? 'localhost',
	port: parseInt(process.env.DB_PORT ?? '5432', 10),
	username: process.env.DB_USERNAME ?? 'postgres',
	password: process.env.DB_PASSWORD ?? 'postgres',
	database: process.env.DB_NAME ?? 'todo',
	entities: [isCompiled ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
	migrations: [isCompiled ? 'dist/db/migrations/*.js' : 'db/migrations/*.ts'],
	synchronize: false,
});

export default dataSource;
