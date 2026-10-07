// Truthy и Falsy

// Truthy — значение, которое JavaScript воспринимает как true.
// Falsy — значение, которое JavaScript воспринимает как false.

// Основные Falsy значения:
// false
// 0
// ""
// null
// undefined
// NaN

const name = "Hiraoka";
const age = 0;
const password = "";
const number = -10;

if (name) {
    console.log("Имя есть");
} else {
    console.log("Имени нет");
}

if (age) {
    console.log("Возраст указан");
} else {
    console.log("Возраст не указан");
}

if (password) {
    console.log("Пароль введён");
} else {
    console.log("Пароль пустой");
}

if (number) {
    console.log("Есть число");
} else {
    console.log("Числа нет");
}

// 1.Truthy
// 2. Falsy
// 3. Falsy
// 4. Truthy

const username = "Hiraoka";
const balance = 0;
const message = "";

if (username) {
    console.log("Пользователь найден");
} else {
    console.log("Пользователь не найден");
}

if (balance) {
    console.log("Баланс есть");
} else {
    console.log("Баланс пуст");
}

if (message) {
    console.log("Сообщение есть");
} else {
    console.log("Сообщения нет");
}