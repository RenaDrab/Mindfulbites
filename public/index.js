console.log("SERVER FILE LOADED");
//shows if file actually loaded
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require('dotenv').config();

const app = express();
// needed to make server work
app.use(cors());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

const { createClient } = require("@supabase/supabase-js");

//set for getting token-accessing kroger api's
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const CLIENT_ID = process.env.KROGER_CLIENT_ID;
const CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;

const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

let token = "";

//actual code to get token
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

        console.log("TOKEN RECEIVED");
        console.log("TOKEN:", token);

    } catch (err) {
        console.log("TOKEN ERROR:", err.response?.data || err.message);
    }
}

const port = 3000;





// grabbing info from kroger and saving it in supabase
app.use(cors());
app.get("/fetch-and-save", async (req, res) => {
    console.log("ROUTE HIT");
    const { item, zipcode, category } = req.query;

    try {
        if (!token) await getToken();

        // get location id from zipcode
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

        // get products
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
        // shows if info was actually inputted on terminal
        const products = kroger.data?.data ?? [];

        if (!products.length) {
            return res.json({
                products: [],
                inserted: 0,
                message: "No products returned from Kroger"
        });
}

        console.log("PRODUCT COUNT:", products.length);

        // getting info and displaying it for nutrition
        const formatted = products.map(p => {

        const nutrition = p.nutritionInformation?.[0]?.nutrients || [];

        const calories = nutrition.find(n => n.displayName === "Calories");
        const saturatedFat = nutrition.find(n => n.displayName === "Saturated Fat");
        const sugar = nutrition.find(n => n.displayName === "Sugar");
        const protein = nutrition.find(n => n.displayName === "Protein");

        const nutritionalRating = p.nutritionalRating || null;

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

            nutritional_rating: nutritionalRating
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

    // helps catch errors from kroger in terminal
    } catch (err) {
    console.log(" KROGER ERROR STATUS:", err.response?.status);
    console.log(" KROGER ERROR DATA:", err.response?.data);
    console.log(" FULL:", err.message);
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


// get info from supabase
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

// get questions from supabase
app.get("/question", async (req,res)=>{

    const { data, error } = await supabase
        .from("question")
        .select("*");

    res.json(data);
});

getToken();
module.exports = app;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});