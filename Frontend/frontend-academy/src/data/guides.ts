import type { GuidedStep } from '../types';
import steps1 from './lesson1.steps.json' with { type: 'json' };
import steps2 from './lesson2.steps.json' with { type: 'json' };
import steps3 from './lesson3.steps.json' with { type: 'json' };
import steps4 from './lesson4.steps.json' with { type: 'json' };
import steps5 from './lesson5.steps.json' with { type: 'json' };
import steps6 from './lesson6.steps.json' with { type: 'json' };
import steps7 from './lesson7.steps.json' with { type: 'json' };
import steps8 from './lesson8.steps.json' with { type: 'json' };
import steps9 from './lesson9.steps.json' with { type: 'json' };
export const lessonGuides: Record<number, GuidedStep[]> = { 1: steps1, 2: steps2, 3: steps3, 4: steps4, 5: steps5, 6: steps6, 7: steps7, 8: steps8, 9: steps9 };

