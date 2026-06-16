import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1781561588601 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'done');

			CREATE TABLE users (
				id            uuid                     NOT NULL DEFAULT gen_random_uuid(),
				email         character varying        NOT NULL,
				password_hash character varying        NOT NULL,
				created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

				CONSTRAINT uq_users_email UNIQUE (email),
				CONSTRAINT pk_users_id PRIMARY KEY (id)
			);

			CREATE TABLE tasks (
				id          uuid                     NOT NULL DEFAULT gen_random_uuid(),
				title       character varying        NOT NULL,
				description text,
				status      task_status_enum         NOT NULL DEFAULT 'todo',
				user_id     uuid                     NOT NULL,
				created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				deleted_at  TIMESTAMP WITH TIME ZONE,
				purge_at    TIMESTAMP WITH TIME ZONE,

				CONSTRAINT pk_tasks_id PRIMARY KEY (id)
			);

			CREATE INDEX idx_tasks_user_id  ON tasks (user_id);
			CREATE INDEX idx_tasks_active   ON tasks (user_id, created_at) WHERE deleted_at IS NULL;
			CREATE INDEX idx_tasks_purge_at ON tasks (purge_at) WHERE purge_at IS NOT NULL;

			ALTER TABLE tasks
				ADD CONSTRAINT fk_tasks_user_id FOREIGN KEY (user_id) REFERENCES users (id)
				ON DELETE CASCADE ON UPDATE NO ACTION;
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE tasks DROP CONSTRAINT fk_tasks_user_id;
			DROP INDEX idx_tasks_purge_at;
			DROP INDEX idx_tasks_active;
			DROP INDEX idx_tasks_user_id;
			DROP TABLE tasks;
			DROP TABLE users;
			DROP TYPE task_status_enum;
		`);
	}
}
