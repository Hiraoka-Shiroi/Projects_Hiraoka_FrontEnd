import curriculum from './curriculum.json' with { type: 'json' };
import stageData from './stages.json' with { type: 'json' };
import projectData from './projects.json' with { type: 'json' };
import lesson1 from './lesson1.json' with { type: 'json' };
import lesson2 from './lesson2.json' with { type: 'json' };
import lesson3 from './lesson3.json' with { type: 'json' };
import lesson4 from './lesson4.json' with { type: 'json' };
import lesson5 from './lesson5.json' with { type: 'json' };
import lesson6 from './lesson6.json' with { type: 'json' };
import lesson7 from './lesson7.json' with { type: 'json' };
import lesson8 from './lesson8.json' with { type: 'json' };
import lesson9 from './lesson9.json' with { type: 'json' };
import type { Lesson, Stage, ProjectBrief, LessonContent } from '../types';

export const lessons: Lesson[] = curriculum;
export const stages: Stage[] = stageData;
export const projects: ProjectBrief[] = projectData;
export const contents: Record<number, LessonContent> = { 1: lesson1, 2: lesson2, 3: lesson3, 4: lesson4, 5: lesson5, 6: lesson6, 7: lesson7, 8: lesson8, 9: lesson9 };
export function getLesson(id: number): Lesson {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) throw new Error('Урок не найден');
  return lesson;
}
export function taskIds(id: number): string[] {
  const content = contents[id];
  return content
    ? [...content.exercises.map(item => item.id), ...content.checklist.map((_, i) => `skill-${i}`)]
    : getLesson(id).completion.map((_, i) => `skill-${i}`);
}


