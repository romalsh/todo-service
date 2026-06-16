import { plainToInstance } from 'class-transformer';
import {
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	MinLength,
	validateSync,
} from 'class-validator';

enum NodeEnv {
	Development = 'development',
	Production = 'production',
	Test = 'test',
}

class EnvironmentVariables {
	@IsOptional()
	@IsEnum(NodeEnv)
	NODE_ENV?: NodeEnv;

	@IsOptional()
	@IsInt()
	PORT?: number;

	@IsString()
	DB_HOST!: string;

	@IsInt()
	DB_PORT!: number;

	@IsString()
	DB_USERNAME!: string;

	@IsString()
	DB_PASSWORD!: string;

	@IsString()
	DB_NAME!: string;

	@IsString()
	@MinLength(32)
	JWT_SECRET!: string;

	@IsString()
	JWT_EXPIRES_IN!: string;

	@IsOptional()
	@IsInt()
	THROTTLE_TTL?: number;

	@IsOptional()
	@IsInt()
	THROTTLE_LIMIT?: number;

	@IsOptional()
	@IsInt()
	THROTTLE_AUTH_TTL?: number;

	@IsOptional()
	@IsInt()
	THROTTLE_AUTH_LIMIT?: number;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
	const validated = plainToInstance(EnvironmentVariables, config, {
		enableImplicitConversion: true,
	});
	const errors = validateSync(validated, { skipMissingProperties: false });
	if (errors.length > 0) {
		throw new Error(
			`Invalid environment configuration:\n${errors
				.map((e) => `  - ${Object.values(e.constraints ?? {}).join(', ')}`)
				.join('\n')}`,
		);
	}
	return validated;
}
