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
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard } from '@libs/common';
import { CreateTaskDto } from './dto/create-task.dto';
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
	async findAll(@CurrentUser('id') userId: string): Promise<TaskDto[]> {
		const tasks = await this.tasks.findActive(userId);
		return tasks.map(TaskDto.from);
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
