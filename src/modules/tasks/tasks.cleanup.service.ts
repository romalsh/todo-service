import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { TaskEntity } from './entities/task.entity';

@Injectable()
export class TasksCleanupService {
	private readonly logger = new Logger(TasksCleanupService.name);

	constructor(
		@InjectRepository(TaskEntity)
		private readonly tasks: Repository<TaskEntity>,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async purgeExpired(): Promise<number> {
		const result = await this.tasks.delete({
			purgeAt: LessThanOrEqual(new Date()),
		});
		const affected = result.affected ?? 0;
		if (affected > 0) {
			this.logger.log(`purged ${affected} expired archived task(s)`);
		}
		return affected;
	}
}
