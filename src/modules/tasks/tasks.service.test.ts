import { IsNull, Not, Repository } from 'typeorm';
import {
	SortOrder,
	TaskArchivedException,
	TaskForbiddenException,
	TaskNotFoundException,
} from '@libs/common';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskEntity } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';
import { TasksGateway } from './tasks.gateway';
import { TasksService } from './tasks.service';

interface RepoMock {
	create: jest.Mock;
	save: jest.Mock;
	findOne: jest.Mock;
	findAndCount: jest.Mock;
}

const makeRepo = (): RepoMock => ({
	create: jest.fn(),
	save: jest.fn(),
	findOne: jest.fn(),
	findAndCount: jest.fn(),
});

const makeGateway = () => ({
	emitCreated: jest.fn(),
	emitUpdated: jest.fn(),
	emitDeleted: jest.fn(),
});

const buildTask = (overrides: Partial<TaskEntity> = {}): TaskEntity => ({
	id: 'task-1',
	title: 'Task',
	description: null,
	status: TaskStatus.Todo,
	userId: 'user-1',
	user: undefined as never,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null,
	purgeAt: null,
	...overrides,
});

describe('TasksService', () => {
	let repo: RepoMock;
	let gateway: ReturnType<typeof makeGateway>;
	let service: TasksService;

	beforeEach(() => {
		repo = makeRepo();
		gateway = makeGateway();
		service = new TasksService(
			repo as unknown as Repository<TaskEntity>,
			gateway as unknown as TasksGateway,
		);
	});

	describe('create', () => {
		it('persists the task for the user and emits a created event', async () => {
			const task = buildTask();
			repo.create.mockReturnValue(task);
			repo.save.mockResolvedValue(task);

			const result = await service.create('user-1', { title: 'Task' });

			expect(repo.create).toHaveBeenCalledWith(
				expect.objectContaining({ userId: 'user-1', title: 'Task' }),
			);
			expect(gateway.emitCreated).toHaveBeenCalledWith(
				'user-1',
				expect.objectContaining({ id: 'task-1' }),
			);
			expect(result).toBe(task);
		});
	});

	describe('findActive', () => {
		it('queries active tasks with status filter and pagination', async () => {
			const task = buildTask();
			repo.findAndCount.mockResolvedValue([[task], 1]);
			const query: QueryTasksDto = {
				page: 2,
				limit: 10,
				status: TaskStatus.Done,
				order: SortOrder.Asc,
			};

			const [items, total] = await service.findActive('user-1', query);

			expect(repo.findAndCount).toHaveBeenCalledWith({
				where: { userId: 'user-1', deletedAt: IsNull(), status: TaskStatus.Done },
				order: { createdAt: SortOrder.Asc },
				skip: 10,
				take: 10,
			});
			expect(items).toEqual([task]);
			expect(total).toBe(1);
		});
	});

	describe('findArchived', () => {
		it('queries soft-deleted tasks only', async () => {
			repo.findAndCount.mockResolvedValue([[], 0]);

			await service.findArchived('user-1', { page: 1, limit: 20 });

			expect(repo.findAndCount).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { userId: 'user-1', deletedAt: Not(IsNull()) },
					skip: 0,
					take: 20,
				}),
			);
		});
	});

	describe('findOne', () => {
		it('returns an owned task', async () => {
			const task = buildTask();
			repo.findOne.mockResolvedValue(task);

			await expect(service.findOne('user-1', 'task-1')).resolves.toBe(task);
		});

		it('throws when the task does not exist', async () => {
			repo.findOne.mockResolvedValue(null);

			await expect(service.findOne('user-1', 'task-1')).rejects.toBeInstanceOf(
				TaskNotFoundException,
			);
		});

		it('forbids access to a task owned by another user', async () => {
			repo.findOne.mockResolvedValue(buildTask({ userId: 'user-2' }));

			await expect(service.findOne('user-1', 'task-1')).rejects.toBeInstanceOf(
				TaskForbiddenException,
			);
		});
	});

	describe('update', () => {
		it('rejects editing an archived task', async () => {
			repo.findOne.mockResolvedValue(buildTask({ deletedAt: new Date() }));

			await expect(
				service.update('user-1', 'task-1', { title: 'new' }),
			).rejects.toBeInstanceOf(TaskArchivedException);
		});

		it('saves changes and emits an updated event', async () => {
			repo.findOne.mockResolvedValue(buildTask());
			repo.save.mockImplementation((t: TaskEntity) => Promise.resolve(t));

			const result = await service.update('user-1', 'task-1', { title: 'New' });

			expect(result.title).toBe('New');
			expect(gateway.emitUpdated).toHaveBeenCalledWith(
				'user-1',
				expect.objectContaining({ title: 'New' }),
			);
		});
	});

	describe('softDelete', () => {
		it('sets deletedAt/purgeAt and emits a deleted event', async () => {
			const task = buildTask();
			repo.findOne.mockResolvedValue(task);
			repo.save.mockImplementation((t: TaskEntity) => Promise.resolve(t));

			await service.softDelete('user-1', 'task-1');

			expect(task.deletedAt).toBeInstanceOf(Date);
			expect(task.purgeAt).toBeInstanceOf(Date);
			expect(task.purgeAt!.getTime()).toBeGreaterThan(task.deletedAt!.getTime());
			expect(gateway.emitDeleted).toHaveBeenCalledWith('user-1', 'task-1');
		});

		it('is a no-op for an already archived task', async () => {
			repo.findOne.mockResolvedValue(buildTask({ deletedAt: new Date() }));

			await service.softDelete('user-1', 'task-1');

			expect(repo.save).not.toHaveBeenCalled();
			expect(gateway.emitDeleted).not.toHaveBeenCalled();
		});
	});
});
