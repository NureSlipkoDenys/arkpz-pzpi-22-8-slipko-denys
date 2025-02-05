
// РЕКОМЕНДАЦІЯ 1: ДОТРИМУЙТЕСЯ ЄДИНОГО СТИЛЮ ОФОРМЛЕННЯ КОДУ
// Поганий приклад
int foo(int a,int b){return a+b;}

// Гарний приклад
int Foo(int a, int b) {  
    return a + b;  
}

// РЕКОМЕНДАЦІЯ 2: ВИКОРИСТОВУЙТЕ ОСМИСЛЕНІ НАЗВИ ЗМІННИХ І ФУНКЦІЙ
// Поганий приклад
int x = 100;  
void f() {  
    int y = x * 2;  
}

// Гарний приклад
int baseSalary = 100;  
void CalculateTotalSalary() {  
    int totalSalary = baseSalary * 2;  
}

// РЕКОМЕНДАЦІЯ 3: УНИКАЙТЕ МАГІЧНИХ ЧИСЕЛ У КОДІ
// Поганий приклад
double price = 200 * 0.85;  // Що таке 0.85?

// Гарний приклад
const double DISCOUNT_RATE = 0.85;  
double price = 200 * DISCOUNT_RATE;

// РЕКОМЕНДАЦІЯ 4: ВИКОРИСТОВУЙТЕ CONST ДЛЯ НЕЗМІННИХ ДАНИХ
// Поганий приклад
int maxSpeed = 120;  
maxSpeed = 150;  // Випадкова зміна значення

// Гарний приклад
const int MAX_SPEED = 120;  
// MAX_SPEED тепер не можна змінити випадково

// РЕКОМЕНДАЦІЯ 5: ВИКОРИСТОВУЙТЕ РОЗУМНІ ВКАЗІВНИКИ ЗАМІСТЬ NEW ТА DELETE
// Поганий приклад
int* data = new int(5);  
delete data;  // Легко забути викликати delete

// Гарний приклад
std::unique_ptr<int> data = std::make_unique<int>(5);  
// delete викликається автоматично при виході з області видимості

// РЕКОМЕНДАЦІЯ 6: ВИКОРИСТОВУЙТЕ ENUM CLASS ЗАМІСТЬ ЗВИЧАЙНИХ ENUM
// Поганий приклад
enum Color { Red, Green, Blue };  
enum Status { Active, Inactive };  
Color c = Active;  // Помилка: немає захисту від змішування

// Гарний приклад
enum class Color { Red, Green, Blue };  
enum class Status { Active, Inactive };  
Color c = Color::Red;  // Чітке і безпечне використання

// РЕКОМЕНДАЦІЯ 7: ВИКОРИСТОВУЙТЕ nullptr ЗАМІСТЬ NULL І 0
// Поганий приклад
int* ptr = NULL;  
if (ptr == 0) {  
    // Неочевидне порівняння  
}

// Гарний приклад
int* ptr = nullptr;  
if (ptr == nullptr) {  
    // Код читається однозначно  
}

// РЕКОМЕНДАЦІЯ 8: УНИКАЙТЕ ВИКОРИСТАННЯ using namespace std
// Поганий приклад
using namespace std;  
string name = "John";  
cout << "Hello, " << name << endl;

// Гарний приклад
#include <iostream>  
#include <string>  
std::string name = "John";  
std::cout << "Hello, " << name << std::endl;
