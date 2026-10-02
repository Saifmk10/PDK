// import { Float } from "react-native/Libraries/Types/CodegenTypes";

const financeApiUrl = 'http://127.0.0.1:8000';


// function input_from_model_expenditure(expense_category:string , amount:Float , date:Date , description:String ){

//     const params = new URLSearchParams({
//     expense_category: "shoes",
//     amount: "5000",
//     date: new Date().toISOString().slice(0, 10),
//     description: "bought a shoe idk y",
// });
// }




export async function add_expense(expense_category: string, amount: number, date: string, description: string): Promise<unknown> {
    const params = new URLSearchParams({
      expense_category,
      amount: String(amount),
      date,
      description,
    });
    const response = await fetch(`${financeApiUrl}/add_expense?${params}`, {
    method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Expense request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();

    console.log(data);
    return data;
}


async function remove_expense(expense_category: string, amount: number, date: string, description: string) {
    const params = new URLSearchParams({
      expense_category,
      amount: String(amount),
      date,
      description,
    });
    const response = await fetch(`http://127.0.0.1:8000/remove_expense?${params}`, {
    method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Expense request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();

    console.log(data);
}

// node --experimental-strip-types 'D:\PROJECTS\PERSONAL-DEVELOPMENT-KIT\android-app\app_fucntions\operations.ts'
