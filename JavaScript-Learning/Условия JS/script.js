let age = 8;
if (age >= 18) {
    console.log("Доступ разрешен");
} else {
    console.log("Доступ запрещен");
}
// Доступ запрещен, так как age меньше 18

let num = 5;
if (num > 0) {
    console.log("Число положительное");
} else {
    console.log("Число не положительное");
}
// Число положительное, так как num больше 0

let isRaining = true;
if (isRaining) {
    console.log("Поймай зонт");
} else {
    console.log("Наслаждайся солнцем");
}
// Поймай зонт, так как isRaining равно true

let score = 85;
if (score >= 90) {
    console.log("Отлично");
} else if (score >= 60) {
    console.log("Хорошо");
} else {
    console.log("Плохо");
}