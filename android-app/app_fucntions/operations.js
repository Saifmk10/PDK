"use strict";
const financeApiUrl = process.env.EXPO_PUBLIC_FINANCE_API_URL;
if (!financeApiUrl) {
    throw new Error("EXPO_PUBLIC_FINANCE_API_URL is not configured.");
}
const response = await fetch(`${financeApiUrl.replace(/\/+$/, "")}/expenses`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        amount: 500,
        category: "food",
        description: "Dinner",
    }),
});
const data = await response.json();
console.log(data);
