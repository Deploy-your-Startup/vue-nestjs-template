import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { TaskEntity } from './task.entity';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { TasksController, HealthController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([TaskEntity]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend'),
      exclude: ['/api', '/api/{*path}', '/assets/{*path}'],
      serveStaticOptions: { index: false },
    }),
  ],
  controllers: [TasksController, HealthController],
  providers: [TasksService],
})
export class AppModule {}
