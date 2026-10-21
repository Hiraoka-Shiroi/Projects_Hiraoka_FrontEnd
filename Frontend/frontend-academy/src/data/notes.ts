import note1 from '../../materials/1_переменные.js?raw';
import note2 from '../../materials/2_арифметика.js?raw';
import note3 from '../../materials/3_типы-данных.js?raw';
import note4 from '../../materials/4_условия-if-else.js?raw';
import note5 from '../../materials/5_логические-операторы.js?raw';
import note6 from '../../materials/6_else-if-и-несколько-условий.js?raw';
import note7 from '../../materials/7_truthy-и-falsy.js?raw';
import note8 from '../../materials/8_тернарный-оператор.js?raw';
import functionsNote from '../../materials/9_функции.js?raw';
import shortFunctionsNote from '../../materials/9_функции_по-шагам.js?raw';
export const lessonNotes: Record<number, { filename: string; text: string }> = {
  1: { filename: '1_переменные.js', text: note1 },
  2: { filename: '2_арифметика.js', text: note2 },
  3: { filename: '3_типы-данных.js', text: note3 },
  4: { filename: '4_условия-if-else.js', text: note4 },
  5: { filename: '5_логические-операторы.js', text: note5 },
  6: { filename: '6_else-if-и-несколько-условий.js', text: note6 },
  7: { filename: '7_truthy-и-falsy.js', text: note7 },
  8: { filename: '8_тернарный-оператор.js', text: note8 },
  9: { filename: '9_функции_по-шагам.js', text: shortFunctionsNote },
};
export const referenceNotes: Record<number, { filename: string; text: string }> = { ...lessonNotes, 9: { filename: '9_функции.js', text: functionsNote } };
