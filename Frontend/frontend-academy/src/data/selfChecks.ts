export interface SelfCheck {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}
export const selfChecks: Record<number, Record<string, SelfCheck>> = {
  9: {
    call: { question: 'Убираем только последнюю строку showTip(). Что напечатается?', options: ['Только «Начало»', '«Начало» и подсказка', 'Ничего'], answer: 0, explanation: 'console.log("Начало") выполняется снаружи. Тело showTip не выполняется: вызов убран.' },
    parameter: { question: 'Во втором вызове showNickname("Кот") чему равен nickname?', options: ['«Лиса»', '«Кот»', 'undefined'], answer: 1, explanation: 'Каждый вызов получает свои аргументы. Во втором вызове строка «Кот» передана в параметр nickname.' },
    arguments: { question: 'Вызываем showRoute("Парк", "Дом"). Какая отправная точка?', options: ['Дом', 'Парк', 'Оба значения одновременно'], answer: 1, explanation: 'Первый аргумент попадает в первый параметр from. Имена строк не меняют порядок передачи.' },
    return: { question: 'Что сохранено в totalPoints после addPoints(20, 5)?', options: ['Сама функция', 'Строка «25»', 'Число 25'], answer: 2, explanation: 'return отдаёт сумму чисел. Результат вызова — число 25, которое сохраняется в totalPoints.' },
    'log-return': { question: 'Почему console.log(showPoints(7)) печатает 7, а затем undefined?', options: ['Внутри выводится 7; результат вызова без return — undefined', 'JavaScript превращает 7 в undefined', 'В функции ошибка синтаксиса'], answer: 0, explanation: 'Внутренний console.log печатает 7. Затем функция заканчивается без возврата значения, и внешний console.log показывает undefined.' },
    'early-return': { question: 'Почему при -3 второй return не выполняется?', options: ['if пропускает все следующие строки навсегда', 'Первый return заканчивает текущий вызов', 'Второй return запрещён в JavaScript'], answer: 1, explanation: 'При -3 условие истинно и первый return завершает этот вызов. При 0 условие ложно, поэтому будет выполнен второй return.' },
  },
};
