import sqlite3
from fastapi import FastAPI

app = FastAPI()

def create_schema():
    connection = sqlite3.connect("../database.db")
    cursor = connection.cursor()
    cursor.execute("""CREATE TABLE IF NOT EXISTS finance(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,   
                    category TEXT,
                    amount REAL,
                    date TEXT,
                    description TEXT, 
                    transaction_type TEXT
                   )""")

    connection.commit()
    connection.close()

# create_schema()

def add_entry(expense_category, amount, date, description, transaction_type):
    connection = sqlite3.connect("../database.db")
    cursor = connection.cursor()
    cursor.execute("INSERT INTO finance (category, amount, date, description, transaction_type) VALUES (?, ?, ?, ?, ?)", (expense_category, amount, date, description, transaction_type))
    connection.commit()
    connection.close()

# add_entry("Food", 12.5, "2024-06-01", "Lunch at cafe", "expense")

def remove_entry(expense_category, amount, date, description, transaction_type):
    connection = sqlite3.connect("../database.db")
    cursor = connection.cursor()
    cursor.execute("DELETE FROM finance WHERE category = ? AND amount = ? AND date = ? AND description = ? AND transaction_type = ?", (expense_category, amount, date, description, transaction_type))
    connection.commit()
    connection.close()


def get_entry_data():
    connection = sqlite3.connect("../database.db")
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM finance")
    expenses = cursor.fetchall()
    connection.close()
    return expenses

# print(get_entry_data())





@app.post("/add_entry")
def api_add_expense(expense_category: str, amount: float, date: str, description: str, transaction_type: str):
    add_entry(expense_category, amount, date, description, transaction_type)
    return {"message": "Expense added successfully"}

@app.post("/remove_entry")
def api_remove_expense(expense_category: str, amount: float, date: str, description: str, transaction_type: str):
    remove_entry(expense_category, amount, date, description, transaction_type)
    return {"message": "Expense removed successfully"}

@app.get("/get_entry_data")
def api_get_entry_data():
    data = get_entry_data()
    return {"data": data}


# example payload for adding an entry curl -X POST 'https://api.saifmk.online/add_entry?expense_category=Food&amount=12.5&date=2024-06-01&description=Lunch&transaction_type=expense'
# example payload for getting entry data curl -X GET 'https://api.saifmk.online/get_entry_data'


# curl -X POST 'https://api.saifmk.online/add_entry?expense_category=Food&amount=129756.5&date=2024-06-01&description=salary&transaction_type=income'


# curl https://api.saifmk.online/get_entry_data