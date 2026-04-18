
let selectedProducts = [];
// 🔹 Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');
}


// 🔥 MAIN FUNCTION (handles manual + CSV + JSON)
// 🔥 UPDATED PROCESS DATA
async function processData() {
    const manualInput = document.getElementById("manualInput").value;
    const fileInput = document.getElementById("fileInput");
    const outputDiv = document.getElementById("output");

    outputDiv.innerText = "⏳ AI Analyzing...";

    try {
        let response;

        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);

            response = await fetch("/process", {
                method: "POST",
                body: formData
            });

        } else {
            const reviews = manualInput.split("\n").filter(r => r.trim() !== "");

            if (reviews.length === 0) {
                alert("Please enter reviews or upload a file");
                return;
            }

            response = await fetch("/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviews })
            });
        }

        const data = await response.json();

        if (data.error) {
            outputDiv.innerText = "❌ Server Error: " + data.error;
            return;
        }

        // ✅ UI UPDATE
        document.getElementById("totalReviews").innerText = data.total_reviews;

        renderDashboard(data);
        renderReviews(data);
        renderTrend(data);   // 🔥 ADD THIS LINE
        renderMiniCards(data);
        globalData = data;          // ✅ store data
        generateNumberButtons();    // ✅ generate comparison buttons

        outputDiv.innerText = "✅ Analysis Complete";

    } catch (err) {
        console.error("Detailed Error:", err);
        outputDiv.innerText = "❌ Frontend error: " + err.message;
    }
}

// 🔥 UPDATED RENDER DASHBOARD
function renderDashboard(data) {
    
    if (!data.reviews) {
        console.log("❌ reviews missing:", data);
        return;
    }

    const reviews = data.reviews;

    // now safe
    reviews.forEach(r => {
        console.log(r);
    });

    // your existing dashboard logic...
    // FIX: Changed from data.sentiment to data.summary to match Python
    const summary = data.sentiment; 
    
    const dashboardContainer = document.getElementById("dashboard");
    dashboardContainer.innerHTML = `
    <div class="dashboard">
        <div class="top-cards">
            <div class="card"><h4>📊 Total</h4><h2>${data.total_reviews}</h2></div>
            <div class="card positive"><h4>😊 Positive</h4><h2>${summary.Positive}</h2></div>
            <div class="card neutral"><h4>😐 Neutral</h4><h2>${summary.Neutral}</h2></div>
            <div class="card negative"><h4>😡 Negative</h4><h2>${summary.Negative}</h2></div>
        </div>
        <div class="charts-grid">
            <div class="chart-card"><h3>📊 Sentiment</h3><canvas id="barChart"></canvas></div>
            <div class="chart-card"><h3>📉 Overall</h3><canvas id="pieChart"></canvas></div>
        </div>
        <div class="insight-card">
            <h3>💡 Insights</h3>
            <ul>${data.insights.map(i => `<li>${i}</li>`).join("")}</ul>
        </div>
    </div>`;

    showSection("dashboard");

    // Chart Logic
    const labels = ["Positive", "Neutral", "Negative"];
    const values = [summary.Positive, summary.Neutral, summary.Negative];
    const colors = ["#22c55e", "#9ca3af", "#ef4444"];

    new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    new Chart(document.getElementById("pieChart"), {
        type: "doughnut",
        data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 🔌 OPTIONAL API CONNECT (you can keep or remove)
async function connectAPI() {

    const outputDiv = document.getElementById("output");

    outputDiv.innerText = "⏳ Connecting to API...";

    try {
        const res = await fetch("https://dummyjson.com/comments");
        const data = await res.json();

        const reviews = data.comments.map(c => c.body);

        document.getElementById("totalReviews").innerText = reviews.length;

        outputDiv.innerText =
            "✅ API Connected\n\n" +
            reviews.slice(0, 10).join("\n\n");

    } catch (err) {
        outputDiv.innerText = "❌ API connection failed";
    }
}


// 🔥 Show selected file name (UI improvement)
document.getElementById("fileInput").addEventListener("change", function () {
    if (this.files.length > 0) {
        const fileName = this.files[0].name;
        document.querySelector(".upload-content h3").innerText = fileName;
    }
});
function renderReviews(data) {

    const container = document.getElementById("reviews");
    container.innerHTML = "<h1>Reviews</h1>";

    const searchBar = document.createElement("input");
    searchBar.placeholder = "Search...";
    searchBar.className = "search-bar";
    container.appendChild(searchBar);

    const list = document.createElement("div");
    container.appendChild(list);

    function displayReviews(filtered) {

        list.innerHTML = "";

        filtered.forEach((r, index) => {

            let emoji = "😐";
            if (r.label === "Positive") emoji = "😄";
            else if (r.label === "Negative") emoji = "😡";

            const div = document.createElement("div");
            div.className = "review-card";

            div.innerHTML = `
                <b>${index + 1}. ${r.text}</b><br>
                Sentiment: ${r.label} (${Math.round(r.confidence * 100)}%)
                <div class="emoji hidden">${emoji}</div>
            `;

            div.onclick = () => {
                const emojiEl = div.querySelector(".emoji");
                emojiEl.classList.toggle("hidden");
                emojiEl.classList.add("animate");
            };

            list.appendChild(div);
        });
    }

    displayReviews(data.reviews);

    searchBar.addEventListener("input", () => {
        const val = searchBar.value.toLowerCase();

        const filtered = data.reviews.filter(r =>
            r.text.toLowerCase().includes(val)
        );

        displayReviews(filtered);
    });
}
function toggleEmoji(index) {

    const emojiSpan = document.getElementById(`emoji-${index}`);
    const review = window.allReviews[index];

    if (!emojiSpan.classList.contains("hidden")) {
        emojiSpan.classList.add("hidden");
        emojiSpan.innerText = "";
        return;
    }

    let emoji = "😐";

    if (review.label === "Positive") emoji = "😊";
    else if (review.label === "Negative") emoji = "😡";

    emojiSpan.innerText = " " + emoji;
    emojiSpan.classList.remove("hidden");
}
function filterReviews() {

    const query = document.getElementById("searchInput").value.toLowerCase();

    const filtered = window.allReviews.filter(r => r.review.toLowerCase().includes(query));

    renderFilteredReviews(filtered);
}
function renderFilteredReviews(reviews) {

    let tbody = "";

    reviews.forEach((r, index) => {

        tbody += `
        <tr onclick="toggleEmoji(${index})">

            <td>${index + 1}</td>

            <td>
                ${r.text}
                <span id="emoji-${index}" class="emoji hidden"></span>
            </td>

            <td>
                <span class="badge ${r.label.toLowerCase()}">
                    ${r.label}
                </span>
            </td>

            <td>${Math.round(r.confidence * 100)}%</td>

            <td>${r.product || "Unknown"}</td>

        </tr>
        `;
    });

    document.getElementById("reviewTableBody").innerHTML = tbody;

    window.allReviews = reviews;
}
function getEmoji(sentiment) {
    if (sentiment === "Positive") return "😊";
    if (sentiment === "Negative") return "😡";
    return "😐";
}
function renderTrend(data) {

    console.log("TREND DATA:", data);

    const trendData = data.trend_data;

    if (!Array.isArray(trendData)) {
        console.log("❌ trend_data is not array");
        return;
    }

    // 🔥 Save globally
    window.trendData = trendData;

    // 🔥 Populate dropdown
    const products = [...new Set(trendData.map(d => d.product))];

    const dropdown = document.getElementById("productFilter");
    dropdown.innerHTML = `<option value="All">All Products (Company View)</option>`;

    products.forEach(p => {
        dropdown.innerHTML += `<option value="${p}">${p}</option>`;
    });

    // 🔥 IMPORTANT FIX HERE
    drawTrendChart(trendData);   // ✅ NOT data

    showSection("trend");
}
function drawTrendChart(data) {
    const canvas = document.getElementById("trendChart");

if (!canvas) {
    console.log("❌ Canvas not found");
    return;
}
    const grouped = {};

    data.forEach(item => {
        const date = item.date;

        if (!grouped[date]) {
            grouped[date] = { Positive: 0, Neutral: 0, Negative: 0 };
        }

        grouped[date][item.sentiment]++;
    });

    const labels = Object.keys(grouped);

    const positive = labels.map(d => grouped[d].Positive);
    const neutral = labels.map(d => grouped[d].Neutral);
    const negative = labels.map(d => grouped[d].Negative);

    // 🔥 DESTROY OLD CHART (IMPORTANT)
    if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
    }

    window.trendChartInstance = new Chart(
        document.getElementById("trendChart"),
        {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Positive",
                        data: positive,
                        borderColor: "#22c55e",
                        tension: 0.4
                    },
                    {
                        label: "Neutral",
                        data: neutral,
                        borderColor: "#9ca3af",
                        tension: 0.4
                    },
                    {
                        label: "Negative",
                        data: negative,
                        borderColor: "#ef4444",
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }
    );
}
function filterTrend() {

    const selected = document.getElementById("productFilter").value;

    let filtered = window.trendData;

    if (selected !== "All") {
        filtered = window.trendData.filter(d => d.product === selected);
    }

    drawTrendChart(filtered);  // ✅ correct
}
function renderMiniCards(data) {

    const summary = data.sentiment;

    // 🔥 DESTROY OLD CHARTS (FIX ERROR)
    if (window.miniBarChart) {
        window.miniBarChart.destroy();
    }

    if (window.miniTrendChart) {
        window.miniTrendChart.destroy();
    }

    // ✅ MINI BAR CHART
    const barCanvas = document.getElementById("miniBar");

    if (barCanvas) {
        window.miniBarChart = new Chart(barCanvas, {
            type: "bar",
            data: {
                labels: ["Positive", "Neutral", "Negative"],
                datasets: [{
                    data: [
                        summary.Positive || 0,
                        summary.Neutral || 0,
                        summary.Negative || 0
                    ],
                    backgroundColor: ["#22c55e", "#9ca3af", "#ef4444"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // ✅ MINI TREND CHART
    const trendCanvas = document.getElementById("miniTrend");

    if (trendCanvas) {
        window.miniTrendChart = new Chart(trendCanvas, {
            type: "line",
            data: {
                labels: ["Start", "Mid", "End"],
                datasets: [{
                    data: [10, 30, 20],
                    borderColor: "#2563eb",
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // ✅ ALERT TEXT
    const alertBox = document.getElementById("alertText");

    if (alertBox && data.insights) {
        alertBox.innerText = data.insights[0];
    }
}
function connectAPI() {
    fetch('/api-reviews')
    .then(res => res.json())
    .then(apiData => {

        // 🔥 SEND FULL OBJECT (NOT ONLY TEXT)
        fetch("/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviews: apiData.reviews })
        })
        .then(res => res.json())
        .then(data => {

            document.getElementById("totalReviews").innerText = data.total_reviews;

            renderDashboard(data);
            renderReviews(data);
            renderTrend(data);
            renderMiniCards(data);

            document.getElementById("output").innerText = "✅ API Data Loaded";

        });

    })
    .catch(err => {
        console.error(err);
        alert("API failed ❌");
    });
}

function generateNumberButtons() {

    const products = getUniqueProducts();
    const container = document.getElementById("numberButtons");

    container.innerHTML = "";

    for (let i = 1; i <= products.length; i++) {
        container.innerHTML += `
            <div class="box" onclick="selectCount(${i}, this)">
                ${i}
            </div>
        `;
    }
}
function getUniqueProducts() {

    if (!globalData || !globalData.reviews) return [];

    const set = new Set();

    globalData.reviews.forEach(r => {
        set.add(r.product || "Unknown");
    });

    return Array.from(set);
}
function selectCount(n, el) {

    selectedCount = n;
    selectedProducts = [];

    document.querySelectorAll("#numberButtons .box")
        .forEach(b => b.classList.remove("selected"));

    el.classList.add("selected");

    generateProductBoxes();
}
function generateProductBoxes() {

    const products = getUniqueProducts();
    const container = document.getElementById("productButtons");

    container.innerHTML = "";

    products.forEach(p => {
        container.innerHTML += `
            <div class="box" onclick="selectProduct('${p}', this)">
                ${p}
            </div>
        `;
    });
}
function selectProduct(product, el) {

    if (selectedProducts.includes(product)) {
        selectedProducts = selectedProducts.filter(p => p !== product);
        el.classList.remove("selected");
    } else {
        if (selectedProducts.length < selectedCount) {
            selectedProducts.push(product);
            el.classList.add("selected");
        } else {
            alert("You can select only " + selectedCount + " products");
        }
    }
}
function runComparison() {

    if (!globalData) {
        alert("No data loaded");
        return;
    }

    if (selectedProducts.length === 0) {
        alert("Select products");
        return;
    }

    const container = document.getElementById("comparisonCharts");
    container.innerHTML = "";

    selectedProducts.forEach(product => {

        const reviews = globalData.reviews.filter(r => r.product === product);

        const stats = { Positive: 0, Neutral: 0, Negative: 0 };

        reviews.forEach(r => {
            stats[r.label]++;
        });

        const canvasId = "chart_" + product.replace(/\s/g, "");

        container.innerHTML += `
            <div class="chart-card">
                <h3>${product}</h3>
                <canvas id="${canvasId}"></canvas>
            </div>
        `;

        new Chart(document.getElementById(canvasId), {
            type: "bar",
            data: {
                labels: ["Positive", "Neutral", "Negative"],
                datasets: [{
                    data: [
                        stats.Positive,
                        stats.Neutral,
                        stats.Negative
                    ],
                    backgroundColor: ["#22c55e", "#9ca3af", "#ef4444"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    });
}
window.addEventListener("load", function () {
  const intro = document.getElementById("introScreen");

  setTimeout(() => {
    intro.style.opacity = "0";

    setTimeout(() => {
      intro.remove(); // ✅ completely removes it
    }, 1000);

  }, 3000); // 👉 change to 3 sec (better UX)
});

