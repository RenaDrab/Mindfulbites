<html>
    <head> 
        <title>Home-MindfulBites-FinalProject</title>
        <link rel="stylesheet" href="finalcssrena.css">
        <script defer src="finaljsrena.js"></script>
    </head>
    <body>
        <h1>Mindful Bites</h1>
        <nav>
            <ul>
                <li onclick="goPage('Final_Project_Rena.html')">Home</li>
                <li onclick="goPage('finalabout.html')">About</li>
                <li onclick="goPage('finalfunction.html')">Help</li>
            </ul>
        </nav>

<!--Need to make it so that you can only unput number into zipcode and only 5 numbers max and min-->
        <div class="zipcodebox">
            <h2>Search for healthy food in your zipcode! Save the hassle of going store to store. Just search here.</h2>
            <label for="zipcode">Enter zipcode to find stores near you that sell the food you want.</label>
            <input id="zipcode" class="form" placeholder="example:20858" required>
            <br>
            <label for="zitem">Enter zipcode to find stores near you that sell the food you want.</label>
            <input id="zitem" class="form" placeholder="Example: eggs" required>
            <br>
            <label for="categoryFilter">Choose a category you want to search for that will best meet your needs.</label>
            <select class="form" id="categoryFilter" required>
                <option value = "" disabled selected hidden>Choose Here </option>
                <!--Need to make it so that when you pick an option health it will only show if it says organic in the category from the api, if you pick nutritious it should show you the nutrition rating and list from best to least the higher the number the more nutrisous it is -->
                <option value="Organic">Organic</option>
                <option value="nutritious">Nutritious</option>
            </select>
            <br>
            <button class="btn" id="searchBtn">Search</button>
            <div id="storeResults"></div>
        </div>


<!--enter item name and it should dispay differnet brands for that item with their description and with a rating number with no duplicate brands-->
        <div class="ratebox">
            <h2>Compare by brand, type, size and much more. See what people actually like to buy!</h2>
            <label for="rate">Enter item to see its rating out of 5</label>
            <input class="form" id="item" placeholder="Example: milk">
            <button class="btn" id="rateBtn">Rate!</button>

            <div id="ratingResults"></div>
        </div>



<!--should display nutrition information of item: calories, sugar, fat, protien-->
<!--In api sugar is saved by code = "sugar", quantity=12 (number in grams), protien in api code = "PRO-" , quantity=12 (number in grams), fat in api "code": "FASAT", quantity=12 (number in grams), needs to pull from api and get saved in supabase-->
        <div class="nutritionbox">
            <h2>Help meet your nutrition goals! Look up nutrition facts of items.</h2>
            <label for="nitem">Enter item you want to see the nutrition facts of</label>
            <input class="form" id="nitem" placeholder="Example: cereal" required>
            <br>
            <button class="btn" type="submit" id="nutritionBtn">Find</button>
            <div id="nutritionResults"></div>
        </div>

    </body>
</html>




















console.log("SERVER FILE LOADED ✔️");

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// ✅ THIS LINE IS CRITICAL
app.use(cors());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

const { createClient } = require("@supabase/supabase-js");

const CLIENT_ID = "renadrabovsky-bbcd2t6n";
const CLIENT_SECRET = "rS7HkMUllbPslgQhZ5b8gN-KaK-g4Z8igrshHf3i";
const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

let token = "";

async function getToken() {
    try {
        const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

        const res = await axios.post(
            "https://api.kroger.com/v1/connect/oauth2/token",
            "grant_type=client_credentials&scope=product.compact",
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${auth}`
                }
            }
        );

        token = res.data.access_token;

        console.log("TOKEN RECEIVED ✔️");
        console.log("TOKEN:", token);

    } catch (err) {
        console.log("TOKEN ERROR:", err.response?.data || err.message);
    }
}

const port = 3000;



// ⚠️ USE SERVICE ROLE KEY HERE
const supabase = createClient(
  "https://eivzsjkecyijcoedwzom.supabase.co",
  "sb_publishable__L-JFrzOXCrPv3xfnQ6rIQ_TW6hdpY-"
);

// ======================
// KROGER → SUPABASE
// ======================
app.use(cors());
app.get("/fetch-and-save", async (req, res) => {
    console.log("🚀 ROUTE HIT");
    const { item, zipcode, category } = req.query;

    try {
        if (!token) await getToken();

        // 1️⃣ GET LOCATION ID FROM ZIPCODE
        const locationRes = await axios.get(
            `https://api.kroger.com/v1/locations`,
            {
                params: {
                    "filter.zipCode.near": zipcode,
                    "filter.limit": 1
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const store = locationRes.data.data?.[0];

        const storeName = store?.name;

        const locationId = locationRes.data.data?.[0]?.locationId;

        console.log("LOCATION ID:", locationId);

        if (!locationId) {
            return res.json({ error: "No store found for zipcode" });
        }

        // 2️⃣ GET PRODUCTS
        const kroger = await axios.get(
            `https://api.kroger.com/v1/products`,
            {
                params: {
                    "filter.term": item,
                    "filter.locationId": locationId,
                    "filter.limit": 10
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const products = kroger.data?.data ?? [];

        if (!products.length) {
            return res.json({
                products: [],
                inserted: 0,
                message: "No products returned from Kroger"
        });
}

        console.log("PRODUCT COUNT:", products.length);

        const formatted = products.map(p => {

        const nutrition = p.nutritionInformation?.[0]?.nutrients || [];

        const calories = nutrition.find(n => n.displayName === "Calories");
        const saturatedFat = nutrition.find(n => n.displayName === "Saturated Fat");
        const sugar = nutrition.find(n => n.displayName === "Sugar");
        const protein = nutrition.find(n => n.displayName === "Protein");

        const nutritionalRating = p.nutritionalRating || null; // ✅ ADD THIS

        return {
            product_id: p.productId,
            zipcode,
            item_name: p.description,
            brand: p.brand || "unknown",
            category: p.categories?.[0] || "Unknown",

            calories: calories?.quantity || null,
            saturated_fat: saturatedFat?.quantity || null,
            sugar: sugar?.quantity || null,
            protein: protein?.quantity || null,

            nutritional_rating: nutritionalRating // ✅ SAVE TO DB
        };
});

        console.log("FORMATTED LENGTH:", formatted.length);

        const { data, error } = await supabase
            .from("kroger_products")
            .upsert(formatted, { onConflict: "product_id" })
            .select();

        if (error) {
    console.log("SUPABASE ERROR:", error);
    return res.json({ error });
}
res.json({
    inserted: data?.length || 0,
    products: data
});


    } catch (err) {
    console.log("🔥 KROGER ERROR STATUS:", err.response?.status);
    console.log("🔥 KROGER ERROR DATA:", err.response?.data);
    console.log("🔥 FULL:", err.message);
}
});

function getNutrition(product, name) {
    const nutrients = product.nutritionInformation?.[0]?.nutrients || [];

    const found = nutrients.find(n => n.displayName === name);

    return found ? {
        value: found.quantity,
        percent: found.percentDailyIntake
    } : null;
}


// ======================
// GET SUPABASE DATA
// ======================
app.get("/products", async (req, res) => {

    const { data, error } = await supabase
        .from("kroger_products")
        .select("*");

    if (error) {
        console.log("SUPABASE ERROR:", error);
        return res.json({ error: error.message });
    }

    console.log("DATA:", data);

    res.json(data || []);
});

// ======================
// SUPABASE QUESTIONS
// ======================
app.get("/question", async (req,res)=>{

    const { data, error } = await supabase
        .from("question")
        .select("*");

    res.json(data);
});

getToken();
app.listen(port, ()=>{
    console.log("Server running on port 3000");
    console.log("GETTING NEW TOKEN...");
    token = "";
});



























const BASE_URL = "http://localhost:3000";

// NAV
function goPage(page){
    window.location.href = page;
}

// ZIP VALIDATION
const zip = document.getElementById("zipcode");
if(zip){
zip.addEventListener("input", () => {
    zip.value = zip.value.replace(/\D/g,'').slice(0,5);
});
}

// ======================
// STORE SEARCH (KROGER → SUPABASE)
// ======================
const searchBtn = document.getElementById("searchBtn");

if(searchBtn){
searchBtn.onclick = async () => {

    const zip = document.getElementById("zipcode").value;
    const item = document.getElementById("zitem").value;
    const category = document.getElementById("categoryFilter").value;

    console.log("ZIP:", zip);
    console.log("ITEM:", item);
    console.log("CATEGORY:", category);

    if (!zip || !item) {
        document.getElementById("storeResults").innerHTML =
            "Please enter both zipcode and item.";
        return;
    }

    const res = await fetch(
    `${BASE_URL}/fetch-and-save?zipcode=${zip}&item=${encodeURIComponent(item)}&category=${encodeURIComponent(category)}`
);

    const data = await res.json();

    const products = data.products || [];

    let filtered = products;

    // 🔽 YOUR CODE GOES HERE
    if(category === "Organic"){
        filtered = products.filter(p =>
            p.category?.toLowerCase().includes("organic")
        );
    }

    if(category === "nutritious"){
        filtered = [...products].sort((a,b) =>
            (b.nutritional_rating || 0) - (a.nutritional_rating || 0)
        );
    }

    // 🔽 DISPLAY FILTERED RESULTS
    document.getElementById("storeResults").innerHTML =
        filtered.map(p => `
            <div>
                <h3>${p.item_name}</h3>
                <p><b>Brand:</b> ${p.brand}</p>
                <p><b>Category:</b> ${p.category}</p>
                <p><b>Calories:</b> ${p.calories ?? "N/A"}</p>
                <p><b>Nutrition Score:</b> ${p.nutritional_rating ?? "N/A"}</p>
            </div>
        `).join("");
};
}


// ======================
// RATING (FROM DATABASE)
// ======================
const rateBtn = document.getElementById("rateBtn");

if(rateBtn){
rateBtn.onclick = async () => {

    const res = await fetch(`${BASE_URL}/products`);
    const data = await res.json();

    const safeData = Array.isArray(data) ? data : [];

    document.getElementById("ratingResults").innerHTML =
        safeData.slice(0,10).map(r => `
            <div>
                <h3>${r.item_name || "Unknown Item"}</h3>
                <p><b>Brand:</b> ${r.brand || "Unknown"}</p>
                <p><b>Rating:</b> ⭐ ${r.rating ?? "No rating"}</p>
            </div>
        `).join("");
};
}

// ======================
// NUTRITION FILTER (FROM DATABASE)
// ======================
const nutritionBtn = document.getElementById("nutritionBtn");

if(nutritionBtn){
nutritionBtn.onclick = async () => {

    const item = document.getElementById("nitem").value.toLowerCase();

    const res = await fetch(`${BASE_URL}/products`);
    const data = await res.json();

    const safeData = Array.isArray(data) ? data : [];

    // filter by item name
    const filtered = safeData.filter(p =>
        p.item_name?.toLowerCase().includes(item)
    );

    document.getElementById("nutritionResults").innerHTML =
        filtered.map(p => `
        <div>
            <h3>${p.item_name}</h3>
            <p>Calories: ${p.calories ?? "N/A"}</p>
            <p>Sugar: ${p.sugar ?? "N/A"}g</p>
            <p>Saturated Fat: ${p.saturated_fat ?? "N/A"}g</p>
        </div>
    `).join("");
};
}

// CHART
function loadChart(){
new Chart(document.getElementById("calorieChart"),{
type:'bar',
data:{
labels:["Whole","2%","Skim"],
datasets:[{label:"Calories",data:[150,120,90]}]
}
});
}

// SUPABASE QUESTIONS
async function loadQuestions(){
    const box = document.getElementById("infoQuestions");
    if(!box) return;

    const res = await fetch(`${BASE_URL}/question`);
    const data = await res.json();

if (data.error) {
    document.getElementById("storeResults").innerHTML =
        `Error: ${data.error}`;
    return;
}

    data.forEach(q=>{
        let btn = document.createElement("button");
        btn.innerText = q.question1;
        btn.className = "btn";

        btn.onclick = ()=> {
            document.getElementById("questionAnswer").innerText = q.question2;
        };

        box.appendChild(btn);
    });
}
loadQuestions();