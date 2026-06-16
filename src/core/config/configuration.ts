export interface AppConfig {
	port: number;
	nodeEnv: string;
	database: {
		host: string;
		port: number;
		username: string;
		password: string;
		name: string;
	};
	jwt: {
		secret: string;
		expiresIn: string;
	};
	throttle: {
		ttl: number;
		limit: number;
	};
}

export const configuration = (): AppConfig => ({
	port: parseInt(process.env.PORT ?? '3000', 10),
	nodeEnv: process.env.NODE_ENV ?? 'development',
	database: {
		host: process.env.DB_HOST ?? 'localhost',
		port: parseInt(process.env.DB_PORT ?? '5432', 10),
		username: process.env.DB_USERNAME ?? 'postgres',
		password: process.env.DB_PASSWORD ?? 'postgres',
		name: process.env.DB_NAME ?? 'todo',
	},
	jwt: {
		secret: process.env.JWT_SECRET ?? 'some-secret',
		expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
	},
	throttle: {
		ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
		limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
	},
});
