import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';

export class CreateTaskDto {
	@ApiProperty({ example: 'Buy groceries' })
	@IsString()
	@MinLength(1)
	@MaxLength(255)
	title!: string;

	@ApiPropertyOptional({ example: 'Milk, eggs, bread' })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.Todo })
	@IsOptional()
	@IsEnum(TaskStatus)
	status?: TaskStatus;
}
