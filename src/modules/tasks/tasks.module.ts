import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task.entity';
import { TasksCleanupService } from './tasks.cleanup.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
	imports: [TypeOrmModule.forFeature([TaskEntity])],
	controllers: [TasksController],
	providers: [TasksService, TasksCleanupService],
})
export class TasksModule {}
