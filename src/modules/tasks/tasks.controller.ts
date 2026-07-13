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
import {
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import {
	ApiErrorResponses,
	ApiOkPaginated,
	CurrentUser,
	JwtAuthGuard,
	PaginatedDto,
	PaginationQueryDto,
	TaskArchivedException,
	TaskForbiddenException,
	TaskNotFoundException,
	UnauthorizedException,
} from '@libs/common';
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
	@ApiOperation({
		summary: 'Create a task',
		description:
			'Emits the `task.created` WebSocket event (namespace `/tasks`) to the owner.',
	})
	@ApiCreatedResponse({ type: TaskDto })
	@ApiErrorResponses(UnauthorizedException)
	async create(
		@CurrentUser('id') userId: string,
		@Body() dto: CreateTaskDto,
	): Promise<TaskDto> {
		return TaskDto.from(await this.tasks.create(userId, dto));
	}

	@Get()
	@ApiOperation({ summary: 'List own active tasks with status filter and pagination' })
	@ApiOkPaginated(TaskDto)
	@ApiErrorResponses(UnauthorizedException)
	async findAll(
		@CurrentUser('id') userId: string,
		@Query() query: QueryTasksDto,
	): Promise<PaginatedDto<TaskDto>> {
		const [items, total] = await this.tasks.findActive(userId, query);
		return new PaginatedDto(items.map(TaskDto.from), total, query.page, query.limit);
	}

	@Get('archived')
	@ApiOperation({ summary: 'List own archived tasks (read-only)' })
	@ApiOkPaginated(TaskDto)
	@ApiErrorResponses(UnauthorizedException)
	async findArchived(
		@CurrentUser('id') userId: string,
		@Query() query: PaginationQueryDto,
	): Promise<PaginatedDto<TaskDto>> {
		const [items, total] = await this.tasks.findArchived(userId, query);
		return new PaginatedDto(items.map(TaskDto.from), total, query.page, query.limit);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get one own task' })
	@ApiOkResponse({ type: TaskDto })
	@ApiErrorResponses(
		UnauthorizedException,
		TaskForbiddenException,
		TaskNotFoundException,
	)
	async findOne(
		@CurrentUser('id') userId: string,
		@Param('id', ParseUUIDPipe) id: string,
	): Promise<TaskDto> {
		return TaskDto.from(await this.tasks.findOne(userId, id));
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Update an active task',
		description:
			'Emits the `task.updated` WebSocket event (namespace `/tasks`) to the owner.',
	})
	@ApiOkResponse({ type: TaskDto })
	@ApiErrorResponses(
		UnauthorizedException,
		TaskForbiddenException,
		TaskNotFoundException,
		TaskArchivedException,
	)
	async update(
		@CurrentUser('id') userId: string,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateTaskDto,
	): Promise<TaskDto> {
		return TaskDto.from(await this.tasks.update(userId, id, dto));
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Archive a task (soft-delete)',
		description:
			'Emits the `task.deleted` WebSocket event (namespace `/tasks`) to the owner.',
	})
	@ApiNoContentResponse()
	@ApiErrorResponses(
		UnauthorizedException,
		TaskForbiddenException,
		TaskNotFoundException,
	)
	async remove(
		@CurrentUser('id') userId: string,
		@Param('id', ParseUUIDPipe) id: string,
	): Promise<void> {
		await this.tasks.softDelete(userId, id);
	}
}
