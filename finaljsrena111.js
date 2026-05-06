const BASE_URL = "http://localhost:3000";

document.getElementById("searchBtn").onclick = async () => {

    const zip = document.getElementById("zipcode").value;
    const item = document.getElementById("zitem").value;

    const res = await fetch(
        `${BASE_URL}/fetch-and-save?zipcode=${zip}&item=${item}`
    );

    const data = await res.json();

    document.getElementById("storeResults").innerHTML =
        `Saved ${data.inserted} products into database`;
};



function getNutrition(product, name) {
    const nutrients = product.nutritionInformation?.[0]?.nutrients || [];
    const saturatedFat = getNutrition(p, "Saturated Fat");
    const calories = getNutrition(p, "Calories");
    const sugar = getNutrition(p, "Sugar");
    const found = nutrients.find(n => n.displayName === name);

    return found ? {
        value: found.quantity,
        percent: found.percentDailyIntake
    } : null;}