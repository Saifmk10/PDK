import sqlite3
from fastapi import FastAPI

app = FastAPI()

def create_schema():
    connection = sqlite3.connect("../database.db")
    cursor = connection.cursor()
    cursor.execute("""CREATE TABLE finance(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,   
                    expense_category TEXT,
                    amount REAL,
                    date TEXT,
                    description TEXT
                   )""")

    connection.commit()
    connection.close()

# create_schema()

def add_expense(expense_category, amount, date, description):
    connection = sqlite3.connect("../database.db")
    cursor = connection.cursor()
    cursor.execute("INSERT INTO finance (expense_category, amount, date, description) VALUES (?, ?, ?, ?)", (expense_category, amount, date, description))
    connection.commit()
    connection.close()

# add_expense("Food", 12.5, "2024-06-01", "Lunch at cafe")

def remove_expense(expense_category, amount, date, description):
    connection = sqlite3.connect("../database.db")
    cursor = connection.cursor()
    cursor.execute("DELETE FROM finance WHERE expense_category = ? AND amount = ? AND date = ? AND description = ?", (expense_category, amount, date, description))
    connection.commit()
    connection.close()


def get_expenses():
    connection = sqlite3.connect("../database.db")
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM finance")
    expenses = cursor.fetchall()
    connection.close()
    return expenses

# print(get_expenses())





@app.post("/add_expense")
def api_add_expense(expense_category: str, amount: float, date: str, description: str):
    add_expense(expense_category, amount, date, description)
    return {"message": "Expense added successfully"}

@app.post("/remove_expense")
def api_remove_expense(expense_category: str, amount: float, date: str, description: str):
    remove_expense(expense_category, amount, date, description)
    return {"message": "Expense removed successfully"}

@app.get("/get_expenses")
def api_get_expenses():
    expenses = get_expenses()
    return {"expenses": expenses}


# example payload
# curl.exe -X POST 'http://127.0.0.1:8000/add_expense?expense_category=Food&amount=12.5&date=2024-06-01&description=Lunch'