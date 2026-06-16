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
	ErrorCode,
	JwtAuthGuard,
	PaginatedDto,
	PaginationQueryDto,
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
	@ApiOperation({ summary: 'Create a task' })
	@ApiCreatedResponse({ type: TaskDto })
	@ApiErrorResponses(ErrorCode.VALIDATION_ERROR, ErrorCode.UNAUTHORIZED)
	async create(
		@CurrentUser('id') userId: string,
		@Body() dto: CreateTaskDto,
	): Promise<TaskDto> {
		return TaskDto.from(await this.tasks.create(userId, dto));
	}

	@Get()
	@ApiOperation({ summary: 'List own active tasks with status filter and pagination' })
	@ApiOkPaginated(TaskDto)
	@ApiErrorResponses(ErrorCode.VALIDATION_ERROR, ErrorCode.UNAUTHORIZED)
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
	@ApiErrorResponses(ErrorCode.VALIDATION_ERROR, ErrorCode.UNAUTHORIZED)
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
		ErrorCode.UNAUTHORIZED,
		ErrorCode.FORBIDDEN,
		ErrorCode.TASK_NOT_FOUND,
	)
	async findOne(
		@CurrentUser('id') userId: string,
		@Param('id', ParseUUIDPipe) id: string,
	): Promise<TaskDto> {
		return TaskDto.from(await this.tasks.findOne(userId, id));
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update an active task' })
	@ApiOkResponse({ type: TaskDto })
	@ApiErrorResponses(
		ErrorCode.VALIDATION_ERROR,
		ErrorCode.UNAUTHORIZED,
		ErrorCode.FORBIDDEN,
		ErrorCode.TASK_NOT_FOUND,
		ErrorCode.TASK_ARCHIVED,
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
	@ApiOperation({ summary: 'Archive a task (soft-delete)' })
	@ApiNoContentResponse()
	@ApiErrorResponses(
		ErrorCode.UNAUTHORIZED,
		ErrorCode.FORBIDDEN,
		ErrorCode.TASK_NOT_FOUND,
	)
	async remove(
		@CurrentUser('id') userId: string,
		@Param('id', ParseUUIDPipe) id: string,
	): Promise<void> {
		await this.tasks.softDelete(userId, id);
	}
}
