import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto, SortOrder } from '@libs/common';
import { TaskStatus } from '../enums/task-status.enum';

export class QueryTasksDto extends PaginationQueryDto {
	@ApiPropertyOptional({ enum: TaskStatus })
	@IsOptional()
	@IsEnum(TaskStatus)
	status?: TaskStatus;

	@ApiPropertyOptional({ enum: SortOrder, default: SortOrder.Desc })
	@IsOptional()
	@IsEnum(SortOrder)
	order: SortOrder = SortOrder.Desc;
}
