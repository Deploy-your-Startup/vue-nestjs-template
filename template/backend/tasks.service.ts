import {
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import type { CreateTask, Status, Task } from '../shared/contracts';
import { AppMeta, TaskEntity } from './task.entity';
import { demoTasks } from './demo-tasks';

function serialize(task: TaskEntity): Task {
  return { ...task, createdAt: task.createdAt.toISOString() };
}

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasks: Repository<TaskEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.SEED_DEMO !== 'true') return;
    await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'launchpad:seed',
      ]);
      const metadata = manager.getRepository(AppMeta);
      if (await metadata.existsBy({ key: 'demo-seeded' })) return;
      await manager
        .getRepository(TaskEntity)
        .save(demoTasks.map((task) => ({ ...task, id: randomUUID() })));
      await metadata.insert({ key: 'demo-seeded' });
    });
  }

  async list(): Promise<Task[]> {
    return (
      await this.tasks.find({ order: { createdAt: 'ASC', id: 'ASC' } })
    ).map(serialize);
  }

  async create(input: CreateTask): Promise<Task> {
    return serialize(
      await this.tasks.save(
        this.tasks.create({
          ...input,
          title: input.title.trim(),
          id: randomUUID(),
          status: 'backlog',
        }),
      ),
    );
  }

  async updateStatus(id: string, status: Status): Promise<Task> {
    const task = await this.tasks
      .createQueryBuilder()
      .update()
      .set({ status })
      .where('id = :id', { id })
      .returning('*')
      .execute();
    if (!task.affected) throw new NotFoundException('Task not found.');
    return serialize(task.raw[0] as TaskEntity);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.tasks.delete({ id })).affected)
      throw new NotFoundException('Task not found.');
  }
}
