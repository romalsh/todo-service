import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AllExceptionsFilter, LoggingInterceptor } from '@libs/common';
import { AppModule } from './app.module';
import type { AppConfig } from './core/config/configuration';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);
	const config = app.get(ConfigService<AppConfig, true>);

	app.setGlobalPrefix('api');
	app.use(helmet());
	app.enableCors();

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);
	app.useGlobalFilters(new AllExceptionsFilter());
	app.useGlobalInterceptors(new LoggingInterceptor());

	const port = config.get('port', { infer: true });
	await app.listen(port);
}

bootstrap().catch((err) => {
	Logger.error(err, 'Bootstrap');
	process.exit(1);
});
