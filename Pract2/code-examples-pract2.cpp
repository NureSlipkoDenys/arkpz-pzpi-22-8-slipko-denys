
// Метод 1 – Push Down Field
class Employee {  
protected:  
    double salesBonus; // Це поле потрібно лише для менеджерів  
};  

class Manager : public Employee {};  
class Developer : public Employee {}; // Developer не використовує salesBonus  

// Після рефакторингу  
class Employee {}; // Базовий клас залишається чистим  

class Manager : public Employee {  
private:  
    double salesBonus;  
};  

class Developer : public Employee {}; // Не містить зайвих полів  

// Метод 2 – Replace Delegation with Inheritance
class Engine {  
public:  
    void start() {  
        // Логіка запуску двигуна  
    }  
};  

class Car {  
private:  
    Engine engine;  
public:  
    void start() {  
        engine.start(); // Делегування виклику  
    }  
};  

// Після рефакторингу  
class Engine {  
public:  
    void start() {  
        // Логіка запуску двигуна  
    }  
};  

class Car : public Engine {  
public:  
    void drive() {  
        start(); // Тепер можна викликати start() без делегування  
    }  
};  

// Метод 3 – Replace Subclass with Fields
class Car {  
public:  
    virtual std::string getType() = 0;  
};  

class Sedan : public Car {  
public:  
    std::string getType() override {  
        return "Sedan";  
    }  
};  

class SUV : public Car {  
public:  
    std::string getType() override {  
        return "SUV";  
    }  
};  

// Після рефакторингу  
class Car {  
private:  
    std::string type;  
public:  
    Car(std::string t) : type(t) {}  
    std::string getType() {  
        return type;  
    }  
};  
