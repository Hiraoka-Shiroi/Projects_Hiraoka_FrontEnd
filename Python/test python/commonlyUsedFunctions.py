class Spaceship():
    def __init__(self, name="", health=10, position=0):
        self.name = name
        self.health = health
        self.position = position

    def wasHit(self):
        self.health = -5
        print(self.health)
        if self.health <= 0:
            print(
                "Извините, ваш корабль был сбит слишком много раз. Хотите сыграть еще раз?")

    def moveLeft(self):
        self.position = -1

    def moveRight(self):
        self.position = +1


falcon = Spaceship(name="Falcon")
print(falcon.position)
falcon.moveLeft()
falcon.moveLeft()
falcon.moveRight()
print(falcon.position)

# Задание 2


class Fighter(Spaceship):
    def __init__(self, name="", health=10, position=0, weapon="", remainingFirePower=5):
        super().__init__(name, health, position)
        self.weapon = weapon
        self.remainingFirePower = remainingFirePower

    def fire(self):
        print()


destroyer = Fighter(name="Destroyer", weapon="Лазер", remainingFirePower=10)
destroyer.moveRight()

print(destroyer.position)

# Задание 3


class ShieldedShip(Fighter):
    def __init__(self, name="", health=10, position=0, weapon="", remainingFirePower=5, shieldStrength=25):
        super().__init__(name, health, position, weapon, remainingFirePower)
        self.shieldStrength = shieldStrength

    def wasHit(self):
        if self.shieldStrength > 0:
            self.shieldStrength -= 5
        else:
            super().wasHit()


defender = ShieldedShip(
    name="Defender", weapon="Cannon", remainingFirePower=10)
defender.moveRight()
defender.fire()
defender.wasHit()
print(defender.shieldStrength, defender.health)
defender.wasHit()
print(defender.shieldStrength, defender.health)
