import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type { Task } from '../shared/contracts';
import { CreateTaskDto, UpdateStatusDto } from './tasks.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(): Promise<Task[]> {
    return this.tasks.list();
  }

  @Post()
  create(@Body() input: CreateTaskDto): Promise<Task> {
    return this.tasks.create(input);
  }

  @Patch(':id/status')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateStatusDto,
  ): Promise<Task> {
    return this.tasks.updateStatus(id, input.status);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.tasks.remove(id);
  }
}

@Controller('health')
export class HealthController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  async health(): Promise<{ status: string }> {
    await this.tasks.list();
    return { status: 'ok' };
  }
}
