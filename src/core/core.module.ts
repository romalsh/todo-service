import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import type { AppConfig } from './config/configuration';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			validate: validateEnv,
		}),
		DatabaseModule,
		ScheduleModule.forRoot(),
		ThrottlerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService<AppConfig, true>) => {
				const throttle = config.get('throttle', { infer: true });
				return {
					throttlers: [{ ttl: throttle.ttl * 1000, limit: throttle.limit }],
				};
			},
		}),
	],
})
export class CoreModule {}
