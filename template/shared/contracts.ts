export const statuses = ['backlog', 'building', 'shipped'] as const;
export type Status = (typeof statuses)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  category: 'Product' | 'Design' | 'Engineering';
  createdAt: string;
}

export type CreateTask = Pick<Task, 'title' | 'description' | 'category'>;
