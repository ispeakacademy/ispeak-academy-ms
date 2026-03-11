import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { User } from '../users/entities/user.entity';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { AssignmentsController, PortalAssignmentsController } from './assignments.controller';
import { AssignmentsRepository } from './assignments.repository';
import { AssignmentSubmissionsRepository } from './assignment-submissions.repository';
import { AssignmentsService } from './assignments.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Assignment, AssignmentSubmission, User]),
		AuditModule,
		forwardRef(() => EnrollmentsModule),
	],
	controllers: [AssignmentsController, PortalAssignmentsController],
	providers: [
		AssignmentsService,
		AssignmentsRepository,
		AssignmentSubmissionsRepository,
	],
	exports: [AssignmentsService],
})
export class AssignmentsModule {}
