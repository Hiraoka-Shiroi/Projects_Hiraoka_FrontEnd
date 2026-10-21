import copy


class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age


myProfile = Person("Hiraoka", 17)

print(myProfile.name, myProfile.age)


class Vehicle:
    def __init__(self):
        self.currentSpeed = 0.0

    def description(self):
        return f"Движется со скоростью {self.currentSpeed} миль в час"

    def make_noise(self):
        pass


some_vehicle = Vehicle()
print(f"Транспорт: {some_vehicle.description()}")


class Bicycle(Vehicle):
    hasBasket = False


bicycle = Bicycle()

bicycle.hasBasket = True
bicycle.currentSpeed = 15.0

print(f"Велосипед: {bicycle.description()}")


class Tandem(Bicycle):
    currentNumberOfPassengers = 0


tandem = Tandem()
tandem.hasBasket = True
tandem.currentNumberOfPassengers = 2
tandem.currentSpeed = 22.0

print(f"Велосипед-тандем: {tandem.description()}")


class Train(Vehicle):
    def makeNoise(self):
        print("Choo Choo!")


train = Train()
train.makeNoise()


class Car(Vehicle):
    gear = 1

    def description(self):
        return super().description() + f" на передаче номер: {self.gear}"


car = Car()
car.currentSpeed = 25.0
car.gear = 3
print(f"Машина: {car.description()}")


class Person:
    def __init__(self, name: str):
        self.name = name


class Student(Person):
    def __init__(self, name: str, favorite_subject: str):
        super().__init__(name)
        self.favorite.subject = favorite_subject


class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age


jack = Person(name="Jack", age=24)
myFriend = jack
jack.age += 1
print(jack.age)
print(myFriend.age)


class Person:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

    def copy(self):
        return copy.copy(self)


jack = Person(name="Jack", age=24)

myFriend = jack.copy()

jack.age += 1

print(jack.age)
print(myFriend.age)

# Задание 1


class Spaceship:
    def __init__(self, name, health=-10, position=- 0):
        self.name = name
        self.health = health
        self.position = position
