import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '@core/config/configuration';
import { TaskEntity } from './entities/task.entity';
import { TasksCleanupService } from './tasks.cleanup.service';
import { TasksController } from './tasks.controller';
import { TasksGateway } from './tasks.gateway';
import { TasksService } from './tasks.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([TaskEntity]),
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => {
				const jwt = config.get('jwt', { infer: true });
				return {
					secret: jwt.secret,
					signOptions: { expiresIn: jwt.expiresIn },
				};
			},
		}),
	],
	controllers: [TasksController],
	providers: [TasksService, TasksCleanupService, TasksGateway],
})
export class TasksModule {}
