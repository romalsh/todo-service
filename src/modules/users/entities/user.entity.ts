import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '@libs/common';
import { TaskEntity } from '@module/tasks/entities/task.entity';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
	@Column({ type: 'varchar', unique: true })
	email!: string;

	@Column({ type: 'varchar', name: 'password_hash' })
	passwordHash!: string;

	@OneToMany(() => TaskEntity, (task) => task.user)
	tasks!: TaskEntity[];
}
