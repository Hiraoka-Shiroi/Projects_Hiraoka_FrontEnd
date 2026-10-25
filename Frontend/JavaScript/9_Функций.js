 function hello() {
    console.log("Привет!");
}
hello();

function welcome() {
    console.log("Я изучаю JavaScript!");
}
welcome();
welcome();


function showCity() {
    const city = "Japan";
    console.log(city);
}
showCity();
showCity();


function aboutMe() {
    console.log("Я изучаю JavaScript");
    console.log("Я хочу стать программистом");
}
aboutMe();

function calculate() {
    const a = 10;
    const b = 5;
    console.log(a + b);
}
calculate();
calculate();

function checkNumber() {
    const number = 3;
    if (number > 0) {
        console.log("Число положительное");
    } else {
        console.log("Число не положительное");
    }
}
checkNumber();

function checkAge() {
    const age = 16;
    if (age >= 18) {
        console.log("Доступ разрешён");
    } else {
        console.log("Доступ запрещён");
    }
}
checkAge();
checkAge();

function showAnime(name) {
    console.log(name);
}
showAnime("Заботливая лисица Сенко");
showAnime("Волчица и пряности");
showAnime("Класс убийц");

function verifyAge(age) {
    if (age >= 18) {
        console.log("Доступ разрешён");
    } else {
        console.log("Доступ запрещён");
    }
}
verifyAge(16);
verifyAge(20);

function addNumbers(a, b) {
    console.log(a + b);
}
addNumbers(10, 5);
addNumbers(20, 10);
addNumbers(50, 50);

function compareNumbers(a, b) {
    if (a > b) {
        console.log("Первое число больше");
    } else if (a <= b) {
        console.log("Второе число больше или равно");
    }
}
compareNumbers(10, 5);
compareNumbers(3, 8);
compareNumbers(7, 7);

function multiplyNumbers(a, b) {
    console.log(a * b);
}
multiplyNumbers(12, 2);
multiplyNumbers(5, 10);

function subtractNumbers(a, b) {
    return a - b;
}
console.log(subtractNumbers(10, 3));
console.log(subtractNumbers(20, 5));

function doubleNumber(number) {
    return number * 2;
}
console.log(doubleNumber(5));
console.log(doubleNumber(15));

console.log(doubleNumber(5) + 3);

function multiplyAndReturn(a, b) {
    return a * b;
}
console.log(multiplyAndReturn(4, 3));
console.log(multiplyAndReturn(10, 3));

function sumAndReturn(a, b) {
    return a + b;
}
const result = sumAndReturn(8, 12);
console.log(result);

function checkPositive(number) {
    if (number > 0) {
        return "Число положительное";
    } else {
        return "Число не положительное";
    }
}

console.log(checkPositive(5));
console.log(checkPositive(-2));

function getLargerNumber(a, b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}
console.log(getLargerNumber(7, 3));
console.log(getLargerNumber(2, 9));

function isAdult(age) {
    if (age >= 18) {
        return true;
    } else {
        return false;
    }
}
console.log(isAdult(16));
console.log(isAdult(20));

function isGreater(a, b) {
    if (a > b) {
        return true;
    } else {
        return false;
    }
}
console.log(isGreater(10, 5));
console.log(isGreater(3, 8));
console.log(isGreater(7, 7));

function getPrice(price) {
    if (price >= 100) {
        return price - 10;
    } else {
        return price;
    }
}

console.log(getPrice(120));
console.log(getPrice(80));

const addNumber = (a, b) => a + b;
console.log(addNumber(10, 5));
console.log(addNumber(20, 10));

const subtractArrow = (a, b) => {
    return a - b;
}
console.log(subtractArrow(10, 3));
console.log(subtractArrow(20, 5));

const getPriceArrow = (price) => {
    if (price >= 100) {
        return price - 10;
    } else {
        return price;
    }
}
console.log(getPriceArrow(100));
console.log(getPriceArrow(80));

const squareNumber = (number) => number * number;
console.log(squareNumber(4));
console.log(squareNumber(7));

const checkAgeArrow = (age) => {
    if (age >= 18) {
        return "Доступ разрешён";
    } else {
        return "Доступ запрещён";
    }
}
console.log(checkAgeArrow(16));
console.log(checkAgeArrow(20));

const getLargerArrow = (a, b) => {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}

console.log(getLargerArrow(7, 3));
console.log(getLargerArrow(2, 9));

const checkAgeTernary = (age) => {
    return age >= 18 ? "Доступ разрешён" : "Доступ запрещён";
}
console.log(checkAgeTernary(16));
console.log(checkAgeTernary(20));