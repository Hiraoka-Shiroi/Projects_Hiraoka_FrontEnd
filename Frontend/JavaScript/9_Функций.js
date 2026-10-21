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