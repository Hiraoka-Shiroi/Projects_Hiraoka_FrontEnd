import { lessons, projects } from '../data/course';
import type { View } from '../components/Shell';
export interface AcademyRoute { view: View; id: number; projectId: string; warning?: string }
export function parseRoute(hash: string, currentLesson: number): AcademyRoute {
  const [name, value] = hash.replace(/^#/, '').split('/');
  const result: AcademyRoute = { view: 'dashboard', id: currentLesson, projectId: projects[0].id };
  if (!name) return result;
  if (!['dashboard', 'roadmap', 'lesson', 'projects', 'report'].includes(name)) return { ...result, warning: 'Страница не найдена. Открыта главная.' };
  result.view = name as View;
  if (name === 'lesson' && value !== undefined) {
    if (/^\d+$/.test(value) && lessons.some(item => item.id === Number(value))) result.id = Number(value);
    else result.warning = 'Такого урока нет. Открыт текущий учебный шаг.';
  }
  if (name === 'projects' && value !== undefined) {
    if (projects.some(item => item.id === value)) result.projectId = value;
    else result.warning = 'Проект не найден. Открыта лаборатория JavaScript.';
  }
  return result;
}
