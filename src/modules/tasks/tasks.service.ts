import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import {
	PaginationQueryDto,
	SortOrder,
	TaskArchivedException,
	TaskForbiddenException,
	TaskNotFoundException,
} from '@libs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskDto } from './dto/task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskEntity } from './entities/task.entity';
import { TasksGateway } from './tasks.gateway';

const ARCHIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class TasksService {
	constructor(
		@InjectRepository(TaskEntity)
		private readonly tasks: Repository<TaskEntity>,
		private readonly gateway: TasksGateway,
	) {}

	async create(userId: string, dto: CreateTaskDto): Promise<TaskEntity> {
		const task = this.tasks.create({
			userId,
			title: dto.title,
			description: dto.description ?? null,
			status: dto.status,
		});
		const saved = await this.tasks.save(task);
		this.gateway.emitCreated(userId, TaskDto.from(saved));
		return saved;
	}

	async findActive(
		userId: string,
		query: QueryTasksDto,
	): Promise<[TaskEntity[], number]> {
		const where: FindOptionsWhere<TaskEntity> = { userId, deletedAt: IsNull() };
		if (query.status) {
			where.status = query.status;
		}
		return this.paginate(where, query.page, query.limit, query.order);
	}

	async findArchived(
		userId: string,
		query: PaginationQueryDto,
	): Promise<[TaskEntity[], number]> {
		const where: FindOptionsWhere<TaskEntity> = {
			userId,
			deletedAt: Not(IsNull()),
		};
		return this.paginate(where, query.page, query.limit, SortOrder.Desc);
	}

	async findOne(userId: string, id: string): Promise<TaskEntity> {
		return this.getOwned(userId, id);
	}

	async update(userId: string, id: string, dto: UpdateTaskDto): Promise<TaskEntity> {
		const task = await this.getOwned(userId, id);
		if (task.deletedAt) {
			throw new TaskArchivedException();
		}
		if (dto.title !== undefined) {
			task.title = dto.title;
		}
		if (dto.description !== undefined) {
			task.description = dto.description ?? null;
		}
		if (dto.status !== undefined) {
			task.status = dto.status;
		}
		const saved = await this.tasks.save(task);
		this.gateway.emitUpdated(userId, TaskDto.from(saved));
		return saved;
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
		this.gateway.emitDeleted(userId, task.id);
	}

	private paginate(
		where: FindOptionsWhere<TaskEntity>,
		page: number,
		limit: number,
		order: SortOrder,
	): Promise<[TaskEntity[], number]> {
		return this.tasks.findAndCount({
			where,
			order: { createdAt: order },
			skip: (page - 1) * limit,
			take: limit,
		});
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
