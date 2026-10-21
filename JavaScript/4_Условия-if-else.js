const age = 18;
if ( age >= 18 ) {
    console.log("Ты совершеннолетний");
} else {
    console.log("Ты не совершеннолетний");
}



const password = "1234";
if ( password === "1234" ) {
    console.log("Доступ разрешен");
} else {
    console.log("Пароль неверный");
}

const money = 5000;
const product = 3500;
if ( money >= product ) {
    console.log("Покупка успешна");
} else {
    console.log("Недостаточно средств");
}

console.log(10 > 5); // true
console.log(10 < 5); // false
console.log(10 === 10); // true
console.log(10 === "10"); // false

console.log(5 === 5); // true
console.log(5 === 10); // false
console.log(5 === "5"); // false
console.log("hello" === "hello"); // true
console.log("hello" === "Hello"); // false