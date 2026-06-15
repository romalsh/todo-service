import { ApiProperty } from '@nestjs/swagger';
import { TaskEntity } from '../entities/task.entity';
import { TaskStatus } from '../enums/task-status.enum';

export class TaskDto {
	@ApiProperty({ format: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Buy groceries' })
	title!: string;

	@ApiProperty({ example: 'Milk, eggs, bread', nullable: true })
	description!: string | null;

	@ApiProperty({ enum: TaskStatus })
	status!: TaskStatus;

	@ApiProperty()
	createdAt!: Date;

	@ApiProperty()
	updatedAt!: Date;

	@ApiProperty({ nullable: true, description: 'set when the task is archived' })
	deletedAt!: Date | null;

	constructor(entity: TaskEntity) {
		this.id = entity.id;
		this.title = entity.title;
		this.description = entity.description;
		this.status = entity.status;
		this.createdAt = entity.createdAt;
		this.updatedAt = entity.updatedAt;
		this.deletedAt = entity.deletedAt;
	}

	static from(entity: TaskEntity): TaskDto {
		return new TaskDto(entity);
	}
}
