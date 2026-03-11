import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import authConfig from '@/config/auth.config';
import { Session } from '@/modules/cohorts/entities/session.entity';
import { Enrollment } from '@/modules/enrollments/entities/enrollment.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { AssignmentListener } from './listeners/assignment.listener';
import { EnrollmentListener } from './listeners/enrollment.listener';
import { SessionListener } from './listeners/session.listener';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Notification, Session, Enrollment, User]),
		JwtModule.register({
			secret: authConfig.jwtSecret,
			signOptions: { expiresIn: authConfig.jwtExpiresIn },
		}),
	],
	controllers: [NotificationsController],
	providers: [
		NotificationsService,
		NotificationsRepository,
		NotificationsGateway,
		AssignmentListener,
		SessionListener,
		EnrollmentListener,
	],
	exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
