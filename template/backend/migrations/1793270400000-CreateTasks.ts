import { Table, type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateTasks1793270400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'title', type: 'varchar', length: '120' },
          { name: 'description', type: 'text' },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            default: "'backlog'",
          },
          { name: 'category', type: 'varchar', length: '16' },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
        ],
        checks: [
          {
            name: 'tasks_status',
            expression: "status IN ('backlog', 'building', 'shipped')",
          },
          {
            name: 'tasks_category',
            expression: "category IN ('Product', 'Design', 'Engineering')",
          },
          { name: 'tasks_title', expression: 'length(trim(title)) > 0' },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'app_meta',
        columns: [
          { name: 'key', type: 'varchar', length: '128', isPrimary: true },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('app_meta');
    await queryRunner.dropTable('tasks');
  }
}
