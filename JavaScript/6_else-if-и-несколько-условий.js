// До этого мы научились делать выбор из двух вариантов:

// if (условие) {
     // если условие true
// } else {
     // если условие false
// }

const age = 16;

if (age >= 18) {
    console.log("Взрослый");
} else if (age >= 13) {
    console.log("Подросток");
} else {
    console.log("Ребёнок");
}

// Если ему больше 18 или равно то Взрослый, если больше 13 или равно то Подросток, иначе Ребенок до 13 лет.

const score = 75;

if (score >= 90) {
    console.log("Отлично");
} else if (score >= 70) {
    console.log("Хорошо");
} else if (score >= 50) {
    console.log("Удовлетворительно");
} else {
    console.log("Не сдал");
}

// Практика
const temperature = 25;
if (temperature >= 30) {
     console.log("Жарко");
} else if (temperature >= 20) {
     console.log("Тепло");
} else {
     console.log("Холодно");
}

// Практика 2
const score = 85;
if (score >= 90) {
     console.log("Отлично")
} else
