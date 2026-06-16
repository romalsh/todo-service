import { Repository } from 'typeorm';
import { TaskEntity } from './entities/task.entity';
import { TasksCleanupService } from './tasks.cleanup.service';

describe('TasksCleanupService', () => {
	let repo: { delete: jest.Mock };
	let service: TasksCleanupService;

	beforeEach(() => {
		repo = { delete: jest.fn() };
		service = new TasksCleanupService(repo as unknown as Repository<TaskEntity>);
	});

	it('deletes tasks whose purge time has passed', async () => {
		repo.delete.mockResolvedValue({ affected: 3, raw: [] });

		const affected = await service.purgeExpired();

		expect(repo.delete).toHaveBeenCalledWith({ purgeAt: expect.any(Object) });
		expect(affected).toBe(3);
	});

	it('returns zero when nothing is expired', async () => {
		repo.delete.mockResolvedValue({ affected: 0, raw: [] });

		expect(await service.purgeExpired()).toBe(0);
	});
});
