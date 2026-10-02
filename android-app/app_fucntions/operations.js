"use strict";
const response = await fetch("http://localhost:8000/expenses", {
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
