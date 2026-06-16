import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
	TaskArchivedException,
	TaskForbiddenException,
	TaskNotFoundException,
} from '@libs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskEntity } from './entities/task.entity';

const ARCHIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class TasksService {
	constructor(
		@InjectRepository(TaskEntity)
		private readonly tasks: Repository<TaskEntity>,
	) {}

	async create(userId: string, dto: CreateTaskDto): Promise<TaskEntity> {
		const task = this.tasks.create({
			userId,
			title: dto.title,
			description: dto.description ?? null,
			status: dto.status,
		});
		return this.tasks.save(task);
	}

	findActive(userId: string): Promise<TaskEntity[]> {
		return this.tasks.find({
			where: { userId, deletedAt: IsNull() },
			order: { createdAt: 'DESC' },
		});
	}

	async findOne(userId: string, id: string): Promise<TaskEntity> {
		return this.getOwned(userId, id);
	}

	async update(userId: string, id: string, dto: UpdateTaskDto): Promise<TaskEntity> {
		const task = await this.getOwned(userId, id);
		if (task.deletedAt) {
			throw new TaskArchivedException();
		}
		Object.assign(task, {
			title: dto.title ?? task.title,
			description: dto.description ?? task.description,
			status: dto.status ?? task.status,
		});
		return this.tasks.save(task);
	}

	async softDelete(userId: string, id: string): Promise<void> {
		const task = await this.getOwned(userId, id);
		if (task.deletedAt) {
			return;
		}
		const now = new Date();
		task.deletedAt = now;
		task.purgeAt = new Date(now.getTime() + ARCHIVE_TTL_MS);
		await this.tasks.save(task);
	}

	private async getOwned(userId: string, id: string): Promise<TaskEntity> {
		const task = await this.tasks.findOne({ where: { id } });
		if (!task) {
			throw new TaskNotFoundException();
		}
		if (task.userId !== userId) {
			throw new TaskForbiddenException();
		}
		return task;
	}
}
