// Логические операторы 
// && - логическое И ( and )
// || - логическое ИЛИ ( or )
// "!" - логическое НЕ ( not )
console.log(true && true); // true
console.log(true && false); // false
console.log(false || true); // true
console.log(false || false); // false

// Практика №2 — && и ||
// Задание 1 — &&

// Создай:

const age = 20;
const hasPassport = true;

// Нужно написать if, который проверяет:

// возраст 18 или больше И есть паспорт

// Если оба условия выполнены:

// "Вход разрешен"

// Иначе:

// "Вход запрещен"

if (age >= 18 && hasPassport) {
  console.log("Вход разрешен");
} else {
  console.log("Вход запрещен");
}

// Задание 2 — ||

// Создай:

const hasMoney = false;
const hasCard = true;

// Проверь:

// есть деньги ИЛИ есть карта

// Если хотя бы одно есть:

// "Можно оплатить"

// Иначе:

// "Оплатить нельзя"

if (hasMoney || hasCard) {
  console.log("Можно оплатить");
} else {
  console.log("Оплатить нельзя");
}

const a = true;
const b = false;

console.log(a && b); // false
console.log(a || b); // true
console.log(!a); // false
console.log(!b); // true