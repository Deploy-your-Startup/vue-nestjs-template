import { IsIn, IsString, Length, Matches, MaxLength } from 'class-validator';
import { statuses, type CreateTask, type Status } from '../shared/contracts';

export class CreateTaskDto implements CreateTask {
  @IsString()
  @Length(1, 120)
  @Matches(/\S/, { message: 'Title must contain text.' })
  title!: string;

  @IsString()
  @MaxLength(1000)
  description!: string;

  @IsIn(['Product', 'Design', 'Engineering'])
  category!: CreateTask['category'];
}

export class UpdateStatusDto {
  @IsIn(statuses)
  status!: Status;
}
