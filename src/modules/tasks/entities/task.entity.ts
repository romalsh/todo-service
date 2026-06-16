import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@libs/common';
import { UserEntity } from '@module/users/entities/user.entity';
import { TaskStatus } from '../enums/task-status.enum';

@Index('idx_tasks_active', ['userId', 'createdAt'], { where: 'deleted_at IS NULL' })
@Index('idx_tasks_purge_at', ['purgeAt'], { where: 'purge_at IS NOT NULL' })
@Entity({ name: 'tasks' })
export class TaskEntity extends BaseEntity {
	@Column({ type: 'varchar' })
	title!: string;

	@Column({ type: 'text', nullable: true })
	description!: string | null;

	@Column({
		type: 'enum',
		enum: TaskStatus,
		enumName: 'task_status_enum',
		default: TaskStatus.Todo,
	})
	status!: TaskStatus;

	@Index()
	@Column({ type: 'uuid', name: 'user_id' })
	userId!: string;

	@ManyToOne(() => UserEntity, (user) => user.tasks, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: UserEntity;

	@Column({ type: 'timestamptz', name: 'deleted_at', nullable: true })
	deletedAt!: Date | null;

	@Column({ type: 'timestamptz', name: 'purge_at', nullable: true })
	purgeAt!: Date | null;
}
