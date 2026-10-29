import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import type { CreateTask, Status } from '../shared/contracts';

@Entity('tasks')
export class TaskEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 16, default: 'backlog' })
  status!: Status;

  @Column({ type: 'varchar', length: 16 })
  category!: CreateTask['category'];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('app_meta')
export class AppMeta {
  @Column({ type: 'varchar', length: 128, primary: true })
  key!: string;
}
