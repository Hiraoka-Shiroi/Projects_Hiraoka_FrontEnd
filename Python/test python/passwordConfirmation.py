correctPassword = "123"


def enterYourPassword():
    enter = input("Введите пароль:")
    while enter != correctPassword:
        print("Пароль введен не верный")
        enter = input("Введите пароль: ")
    print("Вы успешно зарегестрировались!")


enterYourPassword()
