import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from '@module/tasks/entities/task.entity';
import { UserEntity } from '@module/users/entities/user.entity';
import type { AppConfig } from '../config/configuration';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => {
				const db = config.get('database', { infer: true });
				return {
					type: 'postgres' as const,
					host: db.host,
					port: db.port,
					username: db.username,
					password: db.password,
					database: db.name,
					entities: [UserEntity, TaskEntity],
					synchronize: false,
				};
			},
		}),
	],
})
export class DatabaseModule {}
