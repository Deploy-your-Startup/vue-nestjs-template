import type { CreateTask, Status } from '../shared/contracts';

export const demoTasks: (CreateTask & { status: Status })[] = [
  {
    title: 'Talk to your first five customers',
    description: 'Find the problem worth solving. Listen first, build second.',
    category: 'Product',
    status: 'backlog',
  },
  {
    title: 'Sketch the first-run experience',
    description: 'Make that first small win feel effortless.',
    category: 'Design',
    status: 'backlog',
  },
  {
    title: 'Build one useful thing',
    description: 'A small feature that solves a real problem, end to end.',
    category: 'Engineering',
    status: 'building',
  },
  {
    title: 'Write the story behind the idea',
    description: 'Who is this for, and why should it exist?',
    category: 'Product',
    status: 'building',
  },
  {
    title: 'Give your idea a home',
    description: 'Your workspace is running. Time to make it yours.',
    category: 'Engineering',
    status: 'shipped',
  },
];
