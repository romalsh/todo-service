import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1781561588601 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "task_status_enum" AS ENUM ('todo', 'in_progress', 'done')`,
		);

		await queryRunner.query(`
			CREATE TABLE "users" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"email" character varying NOT NULL,
				"password_hash" character varying NOT NULL,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "UQ_users_email" UNIQUE ("email"),
				CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
			)
		`);

		await queryRunner.query(`
			CREATE TABLE "tasks" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"title" character varying NOT NULL,
				"description" text,
				"status" "task_status_enum" NOT NULL DEFAULT 'todo',
				"user_id" uuid NOT NULL,
				"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP WITH TIME ZONE,
				"purge_at" TIMESTAMP WITH TIME ZONE,
				CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id")
			)
		`);

		await queryRunner.query(`CREATE INDEX "IDX_tasks_user_id" ON "tasks" ("user_id")`);
		await queryRunner.query(
			`CREATE INDEX "IDX_tasks_deleted_at" ON "tasks" ("deleted_at")`,
		);

		await queryRunner.query(`
			ALTER TABLE "tasks"
			ADD CONSTRAINT "FK_tasks_user_id"
			FOREIGN KEY ("user_id") REFERENCES "users" ("id")
			ON DELETE CASCADE ON UPDATE NO ACTION
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_user_id"`);
		await queryRunner.query(`DROP INDEX "IDX_tasks_deleted_at"`);
		await queryRunner.query(`DROP INDEX "IDX_tasks_user_id"`);
		await queryRunner.query(`DROP TABLE "tasks"`);
		await queryRunner.query(`DROP TABLE "users"`);
		await queryRunner.query(`DROP TYPE "task_status_enum"`);
	}
}
