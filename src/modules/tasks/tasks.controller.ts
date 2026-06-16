import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiOkPaginated, CurrentUser, JwtAuthGuard, PaginatedDto } from '@libs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskDto } from './dto/task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
	constructor(private readonly tasks: TasksService) {}

	@Post()
	async create(
		@CurrentUser('id') userId: string,
		@Body() dto: CreateTaskDto,
	): Promise<TaskDto> {
		return TaskDto.from(await this.tasks.create(userId, dto));
	}

	@Get()
	@ApiOkPaginated(TaskDto)
	async findAll(
		@CurrentUser('id') userId: string,
		@Query() query: QueryTasksDto,
	): Promise<PaginatedDto<TaskDto>> {
		const [items, total] = await this.tasks.findActive(userId, query);
		return new PaginatedDto(items.map(TaskDto.from), total, query.page, query.limit);
	}

	@Get(':id')
	async findOne(
		@CurrentUser('id') userId: string,
		@Param('id', ParseUUIDPipe) id: string,
	): Promise<TaskDto> {
		return TaskDto.from(await this.tasks.findOne(userId, id));
	}

	@Patch(':id')
	async update(
		@CurrentUser('id') userId: string,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateTaskDto,
	): Promise<TaskDto> {
		return TaskDto.from(await this.tasks.update(userId, id, dto));
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@CurrentUser('id') userId: string,
		@Param('id', ParseUUIDPipe) id: string,
	): Promise<void> {
		await this.tasks.softDelete(userId, id);
	}
}
