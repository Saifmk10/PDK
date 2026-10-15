// import { Float } from "react-native/Libraries/Types/CodegenTypes";

function getFinanceApiUrl(): string {
  const financeApiUrl = process.env.EXPO_PUBLIC_FINANCE_API_URL;
  if (!financeApiUrl) {
    throw new Error('EXPO_PUBLIC_FINANCE_API_URL is not configured.');
  }
  return financeApiUrl.replace(/\/+$/, '');
}

export type EntryType = 'income' | 'expense';
export type EntryApiRow = [number | string, string, number, string, string, EntryType];

export async function get_entries(): Promise<EntryApiRow[]> {
  const response = await fetch(`${getFinanceApiUrl()}/get_entry_data`);
  if (!response.ok) {
    throw new Error(`Expense request failed (${response.status}): ${await response.text()}`);
  }

  // this is the main function that makes all the chanehs in the app , this is bery imp
  const payload: unknown = await response.json();
  let rows: unknown;
  if (Array.isArray(payload)) {
    rows = payload;
  } else if (payload !== null && typeof payload === 'object') {
    rows = 'data' in payload ? payload.data : 'expenses' in payload ? payload.expenses : undefined;
  }
  if (!Array.isArray(rows)) {
    throw new Error('Entry response must contain a data array.');
  }

  return rows.map((row: unknown, index: number): EntryApiRow => {
    if (!Array.isArray(row) || row.length < 5) {
      throw new Error(`Expense response row ${index + 1} is invalid.`);
    }
    const [id, category, amount, date, description, type] = row;
    if (
      (typeof id !== 'number' && typeof id !== 'string') ||
      typeof category !== 'string' ||
      typeof amount !== 'number' || !Number.isFinite(amount) ||
      typeof date !== 'string' ||
      typeof description !== 'string'
    ) {
      throw new Error(`Expense response row ${index + 1} has invalid fields.`);
    }
    // Rows without a type column are treated as expenses.
    return [id, category, amount, date, description, type === 'income' ? 'income' : 'expense'];
  });
}


// function input_from_model_expenditure(expense_category:string , amount:Float , date:Date , description:String ){

//     const params = new URLSearchParams({
//     expense_category: "shoes",
//     amount: "5000",
//     date: new Date().toISOString().slice(0, 10),
//     description: "bought a shoe idk y",
// });
// }




export async function add_entry(expense_category: string, amount: number, date: string, description: string, transaction_type: EntryType): Promise<unknown> {
    const params = new URLSearchParams({
      expense_category,
      amount: String(amount),
      date,
      description,
      transaction_type,
    });
    const response = await fetch(`${getFinanceApiUrl()}/add_entry?${params}`, {
    method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Expense request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();

    console.log(data);
    return data;
}


export async function remove_entry(expense_category: string, amount: number, date: string, description: string, transaction_type: EntryType): Promise<unknown> {
    const params = new URLSearchParams({
      expense_category,
      amount: String(amount),
      date,
      description,
      transaction_type,
    });
    const response = await fetch(`${getFinanceApiUrl()}/remove_entry?${params}`, {
    method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Expense request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();

    console.log(data);
    return data;
}

// node --experimental-strip-types 'D:\PROJECTS\PERSONAL-DEVELOPMENT-KIT\android-app\app_fucntions\operations.ts'
