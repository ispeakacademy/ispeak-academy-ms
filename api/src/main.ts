import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { winstonConfig } from './modules/logging/winston.config';

async function bootstrap() {
	const logger = WinstonModule.createLogger(winstonConfig);
	const app = await NestFactory.create(AppModule, {
		logger,
		rawBody: true,
	});

	const configService = app.get(ConfigService);

	// Configure body parser with raw body for M-Pesa webhooks
	app.use(
		json({
			verify: (req: any, res, buf) => {
				if (req.url?.startsWith('/api/v1/webhooks/mpesa')) {
					req.rawBody = buf;
				}
			},
		}),
	);
	app.use(urlencoded({ extended: true }));

	// Enable CORS
	const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
	app.enableCors({
		origin: [
			frontendUrl,
			'http://localhost:3001',
			'http://localhost:3000',
		],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);

	app.useGlobalFilters(new HttpExceptionFilter());
	app.useGlobalInterceptors(new LoggingInterceptor());

	// Set global prefix
	const PREFIX = configService.get<string>('API_PREFIX', 'api/v1');
	app.setGlobalPrefix(PREFIX);

	// Swagger Documentation
	const config = new DocumentBuilder()
		.setTitle('iSpeak Academy BMS API')
		.setDescription('Business Management System API for iSpeak Academy')
		.setVersion('1.0')
		.addTag('Auth', 'Authentication endpoints')
		.addTag('Users', 'User management')
		.addTag('Clients', 'Client CRM')
		.addTag('Organisations', 'Organisation management')
		.addTag('Programs', 'Program catalog')
		.addTag('Cohorts', 'Cohort management')
		.addTag('Sessions', 'Session management')
		.addTag('Enrollments', 'Enrollment management')
		.addTag('Waitlist', 'Waitlist management')
		.addTag('Invoices', 'Invoice management')
		.addTag('Payments', 'Payment management')
		.addTag('Communications', 'Communication hub')
		.addTag('Dashboard', 'Admin dashboard')
		.addBearerAuth({
			type: 'http',
			scheme: 'bearer',
			bearerFormat: 'JWT',
			name: 'JWT',
			description: 'Enter JWT token',
			in: 'header',
		}, 'JWT')
		.build();

	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, documentFactory);

	const PORT = configService.get<number>('PORT', 3000);
	await app.listen(PORT);

	logger.log(`Application is running on: http://localhost:${PORT}/${PREFIX}`);
	logger.log(`Swagger docs available at: http://localhost:${PORT}/api/docs`);
}

process.on('uncaughtException', (error) => {
	const logger = WinstonModule.createLogger(winstonConfig);
	logger.error('Uncaught Exception', {
		error: error.message,
		stack: error.stack
	});
});

process.on('unhandledRejection', (reason, promise) => {
	const logger = WinstonModule.createLogger(winstonConfig);
	logger.error('Unhandled Rejection', {
		reason,
		promise
	});
});

bootstrap();
