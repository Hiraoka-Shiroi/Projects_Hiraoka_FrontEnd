let name = "Hiraoka";
let age = 18;
let city = "Japan";
let heart = "<3";

console.log(name);
console.log(age);
console.log(city);

let number5 = 5;
let number7 = 7;

console.log("Nice to meet you!<3 Thanks for viewing my web-site");
console.log(heart);

let result = number5 / number7;
console.log(result); // Выведет примерно 0.714...


let a = 5;
let b = a;   // b получил КОПИЮ значения 5
a = 10;
console.log(b); // 5 — b независим

let obj1 = { val: 5 };
let obj2 = obj1; // obj2 получил КОПИЮ ССЫЛКИ — оба указывают на один и тот же объект
obj1.val = 10;
console.log(obj2.val); // 10 — изменения видны обоим

const user = { name: "Анна" };
user.name = "Борис"; // OK
user.age = 30;       // OK
user = {};           // TypeError — пытаемся переприсвоить саму переменную

let count = 0;
count = count + 1;
count += 1;          // короткая запись: count = count + 1
console.log(count);  // 2

/* Практические задачи
Лёгкие

1.1. Объяви переменную userName со значением своего имени. Выведи в консоль через console.log.

1.2. Объяви x = 7 и y = 3. Выведи их сумму, разность, произведение и частное.

1.3. Что должно быть const, а что let?
*/
let userName = "Hiraoka";
console.log(userName);

let x = 7;
let y = 3;

console.log(x + y); // плюс
console.log(x - y); // минус
console.log(x * y); // умножение
console.log(x / y); // деление

const pi = 3.14;
let counter = 0;
let userName = "Анна";
let MAX_ReTRIES = 5;
let isLoading = false;

// Средние

// 1.4. Объясни, что выведет код и почему:

const user = { name: "Анна", age: 25 };
user.age = 26;
console.log(user.age);
user.city = "Москва";
console.log(user);
// 26, { name: "Анна", age: 26, city: "Москва" } добавилась москва и все это выведется

// 1.5. Перепиши плохой код в хороший. Объясни, что было не так:
var x = 10;
var y = 20;
var z;
z = x + y;
var x = 100;
console.log(z);
// использование var + баг, лучше let, const, и не нужно было переопределять x, так как z уже получил значение 30, а после этого x стал 100, но z не изменился, так как он уже получил свое значение. Лучше было бы использовать let для x и y, и const для z, так как z не изменяется.

//1.6. Что выведет?
let a = 1;
{
  let a = 2;
  console.log(a);
}
console.log(a);
// 2, 1 — внутри блока a = 2, а снаружи a = 1, так как let имеет блочную область видимости.

// Сложные

// 1.7. Самый важный вопрос урока. Что выведет и почему?

let a = 5;
let b = a;
b = 10;
console.log(a, b);

let obj1 = { val: 5 };
let obj2 = obj1;
obj2.val = 10;
console.log(obj1.val, obj2.val);
// 5, 10 так как первый 5 потом b обьявляет а но не изменяет его, а второй 10 изменяет значение внутри объекта, на который ссылаются обе переменные. Поэтому obj1.val и obj2.val будут равны 10.

// 1.8. Найди все ошибки в коде и объясни каждую:

const user;
user = { name: "Анна" };

let x = 1;
let x = 2;

console.log(y);
let y = 5;

function calc() {
  result = 10;
}
calc();
console.log(result);
// 1. const user; - нету значения нужно присвоить любое значение 2. let x = 1; let x = 2; - нельзя объявлять одну и ту же переменную дважды 3. console.log(y); let y = 5; - нужно объявить y до того, как его использовать 4. нету let result; нужно объявить переменную result до того, как ее использовать в функции calc() и console.log(result);


// 12. Проверка понимания
/*
1.В чём разница между let и const?
2.Что значит "const не запрещает менять объект"? Приведи пример.
3.Почему var устарел? Назови минимум 2 причины.
4.Что такое TDZ (Temporal Dead Zone)? Своими словами.
5.Что выведет:

const arr = [1, 2, 3];
arr.push(4);
console.log(arr);

Что выведет и почему:

let a = 5;
let b = a;
a = 10;
console.log(b);

Какое правило по умолчанию: с чего начинать — let или const? Почему?

1. let позволяет изменять значение переменной, const — нет.
2. const не запрещает менять объект, но запрещает переназначать переменную на другой объект. Например:
const obj = { name: "Анна" };
obj.name = "Борис";
console.log(obj); // { name: "Борис" } — мы изменили свойство объекта, но не переназначили переменную obj на другой объект.
3. var устарел, потому что он имеет функциональную область видимости, что может привести к неожиданным результатам, и он позволяет повторное объявление переменных, что может вызвать ошибки.
4. TDZ (Temporal Dead Zone) — это период времени между началом блока кода и моментом объявления переменной с помощью let или const, в течение которого переменная существует, но не может быть доступна. Если попытаться обратиться к переменной в TDZ, будет выброшена ошибка ReferenceError.
5. [1, 2, 3, 4] — мы добавили элемент 4 в массив arr с помощью метода push().
6. 5 — переменная b получила копию значения a (5), а затем a было изменено на 10, но это не повлияло на b.
7. По умолчанию рекомендуется начинать с const, так как это помогает предотвратить случайные изменения переменных и делает код более предсказуемым. Если нужно изменить значение переменной позже, можно использовать let.
*/
const taxRate = 0.13;
const salary = 100000;
const tax = salary * taxRate;
console.log(`Налог: ${tax}`); // 13000
const salaryworker = salary - tax;
console.log(`Зарплата после налогов: ${salaryworker}`); // 87000


// 1.5 исправленный код
const x = 10;
const y = 20;
const z = x + y;
console.log(z); // 30

// Входные данные
const income = 80000;
const expenses = 50000;
const months = 12;
const interestRate = 0.05;

// Расчёты
const monthlySavings = income - expenses;
const totalSavings = monthlySavings * months;
const withInterest = totalSavings + (totalSavings * interestRate);

// Вывод (4-5 строк через шаблонные строки)
console.log(`Доход: ${income}`);
console.log(`Расходы: ${expenses}`);
console.log(`Месяцы: ${months}`);
console.log(`Процентная ставка: ${interestRate}`);
console.log(`Чистая экономия в месяц: ${monthlySavings}`);
console.log(`За ${months} месяцев накопится: ${totalSavings}`);
console.log(`С процентами банка: ${withInterest}`);