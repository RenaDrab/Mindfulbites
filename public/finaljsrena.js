const BASE_URL = "/api";

// Navigation 
function goPage(page){
    window.location.href = page;
}

// Checks for valid zipcode
const zip = document.getElementById("zipcode");
if(zip){
zip.addEventListener("input", () => {
    zip.value = zip.value.replace(/\D/g,'').slice(0,5);
});
}

// Kroger to Supabase 
// using zipcode, item and category to search through api and save in supabase
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

    // Allow filters like organic or nutritional
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

    // Show results for zipcode/item search
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



// Grabbing ratings from supsbase
const rateBtn = document.getElementById("rateBtn");

if (rateBtn) {
rateBtn.onclick = async () => {

    const item = document.getElementById("item").value.toLowerCase();

    const res = await fetch(`${BASE_URL}/products`);
    const data = await res.json();

    const safeData = Array.isArray(data) ? data : [];

    // FILTER by what user typed
    const filtered = safeData.filter(r =>
        r.item_name?.toLowerCase().includes(item)
    );

    document.getElementById("ratingResults").innerHTML =
        filtered.map(r => `
            <div>
                <h3>${r.item_name || "Unknown Item"}</h3>
                <p><b>Brand:</b> ${r.brand || "Unknown"}</p>
                <p><b>Rating:</b> ⭐ ${r.rating ?? "No rating"}</p>
            </div>
        `).join("");
};
}

// Grabbing nutrition info from supabase
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




// Chart for about page
async function loadChart() {

    const res = await fetch(`${BASE_URL}/products`);
    const data = await res.json();

    const safeData = Array.isArray(data) ? data : [];

    // grabbing bread calorie info from supabase
    const bread = safeData
        .filter(p =>
            p.item_name?.toLowerCase().includes("bread")
        )
        .filter(p => (p.calories || 0) <= 200);

    const labels = bread.map(b => b.item_name);
    const calories = bread.map(b => b.calories || 0);

    new Chart(document.getElementById("calorieChart"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Calories in Bread",
                data: calories
            }]
        }
    });
}

// Grabbing questions from supabase
async function loadQuestions() {

    const box = document.getElementById("infoQuestions");
    if (!box) return;

    const res = await fetch(`${BASE_URL}/question`);
    const data = await res.json();

    if (!Array.isArray(data)) return;

    data.forEach(q => {
        let btn = document.createElement("button");
        btn.innerText = q.question;
        btn.className = "btn question-btn";

        btn.onclick = () => {

            const answerBox = document.getElementById("questionAnswer");

            // show box if hidden
            answerBox.style.display = "block";

            // load answer text
            answerBox.innerText = q.answer;
        };

        box.appendChild(btn);
    });
}


function loadSlides() {

    const images1 = [
        "fixed.png",
        "org.png.png",
        "nut.png.png",
        "noneent.png"
    ];

    const images2 = [
        "rating1.png.png",
        "rating2.png.png",
    ];

    const images3 = [
        "last111.png.png",
        "last1.png.png",
    ];

    const images4 = [
        "about.png",
        "about1.png",
        "about2.png",
        "about3.png",
        "about4.png",
    ];

    document.getElementById("slides").innerHTML =
        images1.map(img => `
            <div class="swiper-slide">
                <img src="${img}" style="width:100%">
            </div>
        `).join("");

    document.getElementById("slides1").innerHTML =
        images2.map(img => `
            <div class="swiper-slide">
                <img src="${img}" style="width:100%">
            </div>
        `).join("");

    document.getElementById("slides2").innerHTML =
        images3.map(img => `
            <div class="swiper-slide">
                <img src="${img}" style="width:100%">
            </div>
        `).join("");

    document.getElementById("slides3").innerHTML =
        images4.map(img => `
            <div class="swiper-slide">
                <img src="${img}" style="width:100%">
            </div>
        `).join("");

    
    new Swiper(".swiper", {
        loop: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev"
        }
    });
}

if (document.getElementById("slides")) {
    loadSlides();
}
if (document.getElementById("infoQuestions")) {
    loadQuestions();
}
