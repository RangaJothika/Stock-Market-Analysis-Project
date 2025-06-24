let chartStock = {};

displayStockList();

async function getStockList1() {
    return await fetch("https://mocki.io/v1/a8a7e040-aa37-4451-bca3-e561868ec0e7")
        .then((stock) => stock.json())
        .then((a) => {
            // console.log(a.stocksStatsData[0]);
            return a.stocksStatsData[0];
        })
        
        .catch((error) => console.log(error));
}

async function displayStockList() {
    let StockValueData = await getStockList1();
    for (let key in StockValueData) {
        if (key != "_id") {
            let StockListEle = document.getElementById("StocKList");
            let li = document.createElement("li");
            li.innerHTML = `<button onclick="changeChartAndSummary(event)">${key}</button><span class="bookValue">$${StockValueData[key]["bookValue"]}</span><span class="profit">${StockValueData[key]["profit"].toFixed(2)}%</span>`;
            StockListEle.append(li);
            let zeroprofit = li.querySelector(".profit");
            if (StockValueData[key]["profit"].toFixed(2) == 0.00) {
                zeroprofit.classList.add("zeroprofit");
            }
        }
    }
    await displaySummary();
    await displayChart();
}

async function displaySummary(event) {
    let StockValues = await getStockList1();
    let stockSummary = await fetch("https://mocki.io/v1/643739c6-a043-45f7-9208-239087e003be")
        .then((response) => response.json())
        .then((a) => {
            // console.log(a.stocksProfileData[0])
            return a.stocksProfileData[0];
        })
        .catch((error) => console.log(error));

    let summaryContainer = document.getElementById("summary");
    let subheading = document.createElement("h2");
    let p = document.createElement("p");
    if (!event) {
        summaryContainer.innerHTML = "";
        subheading.innerHTML = `<span>AAPL</span>&nbsp;<span class="profit">${StockValues["AAPL"]["profit"]}%</span><span class="bookValue">$${StockValues["AAPL"]["bookValue"]}</span>`;
        p.innerHTML = `<p>${stockSummary["AAPL"]["summary"]}</p>`;
    }
    if (event) {
        for (let key in stockSummary) {
            if (key != "_id" && key == event.target.textContent) {
                summaryContainer.innerHTML = "";
                p.innerHTML = `<p>${stockSummary[key]["summary"]}</p>`;
                subheading.innerHTML = `<span>${key}</span>&nbsp;<span class="profit">${StockValues[key]["profit"]}%</span><span class="bookValue">$${StockValues[key]["bookValue"]}</span>`;
                let zeroprofit = subheading.querySelector(".profit");
                if (StockValues[key]["profit"].toFixed(2) == 0.00) {
                    zeroprofit.classList.add("zeroprofit");
                }
            }
        }
    }
    
    summaryContainer.append(subheading, p);
} // Declare globally

async function displayChart(stock = "AAPL", period = "5y", event) {
    const response = await fetch("https://mocki.io/v1/3295edc5-d4eb-41d4-931a-4ceb232ff1da");
    const data = await response.json();
    // console.log(data);
    chartStock = data["stocksData"][0]; // Store globally
    // console.log(chartStock);
    if (!event) {
        createButtons(stock); // Load buttons for AAPL initially
        plotChart(stock, period);
    }
    if (event) {
        for (let stock in chartStock) {
            if (stock != "_id" && stock == event.target.textContent) {
                createButtons(stock); // Load buttons for AAPL initially
                plotChart(stock, period);
            }
        }
    } // Default plot for AAPL with 1mo data
}

// Function to create chart data for a specific stock and period
function getChartData(stock, period) {
    const traces = [];

    if (chartStock[stock] && chartStock[stock][period]) {
        const timeStamps = chartStock[stock][period]["timeStamp"];
        const values = chartStock[stock][period]["value"];

        // Convert timestamps to readable dates
        const x = timeStamps.map(ts => new Date(ts * 1000).toLocaleDateString("en-US"));

        // Create trace for the selected stock
        traces.push({
            x: x,
            y: values,
            mode: 'lines',
            name: stock,
            line: {
                color: "#7FFF00",
            }
        });
    }

    return traces;
}

// Function to plot the chart for a specific stock and period
function plotChart(stock, period) {
    const data = getChartData(stock, period);
    const timeStamps = chartStock[stock][period]["timeStamp"];
    const values = chartStock[stock][period]["value"];
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);

    const maxIndex = values.indexOf(maxVal);
    const minIndex = values.indexOf(minVal);

    const maxDate = new Date(timeStamps[maxIndex] * 1000).toLocaleDateString("en-US");
    const minDate = new Date(timeStamps[minIndex] * 1000).toLocaleDateString("en-US");

    const annotations = [
        {
            x: maxDate,// arrow points towards this x,y cordinate
            y: maxVal,//for arrow
            text: `Peak: $${maxVal}`,
            showarrow: true,
            arrowhead: 2,
            ax: 0,// text is placed in this coodinate with respect to its default position (by def all are 30px below the x,y arrow pointing)
            ay: -30,//for text
            font: { color: 'green', size: 12 },
            bgcolor: 'white'
        },
        {
            x: minDate,//arrow points towards this x,y cordinate
            y: minVal,//for arrow
            text: `Low: $${minVal}`,
            showarrow: true,
            arrowhead: 2,
            ax: 0,//for text
            ay: 30,//for text
            font: { color: 'red', size: 12 },
            bgcolor: 'white'
        }
    ];

    const layout = {
        margin: { t: 0, b: 0, l: 0, r: 0 },
        xaxis: { visible: false },
        yaxis: { visible: false },
        hovermode: 'x unified',
        showlegend: false,
        plot_bgcolor: "rgb(3, 3, 90)",
        annotations: annotations,// Add annotations to the chart
    };

    Plotly.newPlot('chart', data, layout);

}

// Function to create buttons for periods and call plotChart with args
function createButtons(stock) {
    const buttonsContainer = document.getElementById('buttons');
    buttonsContainer.innerHTML = ""; // Clear previous buttons

    // Create period buttons dynamically
    ["1mo", "3mo", "1y", "5y"].forEach(period => {
        let button = document.createElement('button');
        button.textContent = period;
        button.style.padding = '10px';
        button.style.margin = '5px';
        button.style.fontSize = "20px";
        button.style.cursor = 'pointer';
        button.style.border = 'none';
        button.style.borderRadius = "10px";
        button.style.background = "rgb(3, 3, 90) ";
        button.style.color = "white";
        button.onclick = () => plotChart(stock, period); // Directly pass stock and period
        buttonsContainer.appendChild(button);
    });
}

function changeChartAndSummary(event) {
    const stock = event.target.textContent;
    displayChart(stock, "5y", event);
    displaySummary(event);
}
