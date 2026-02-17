let chartStock = {};//this var will be resued across different functions

displayStockList();//called to display first one's details right form start of the website

async function getStockList1() {
    // get profit,bookValue of all the stocks
    return await fetch("https://stock-market-api-k9vl.onrender.com/api/stocksstatsdata")//all 3-static apis
        .then((stock) => stock.json())// converts the stock response in json format to a js object
        .then((a) => {
            return a.stocksStatsData[0];
        })
        .catch((error) => console.log(error));
}

// list section of all stocks,bookValue and profit
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
    // default display summary and display chart with first stock
    await displaySummary();//called wo an arg so its default value(undefined) will be assigned for its para
    await displayChart();
}

async function displaySummary(event) {
    let StockValues = await getStockList1();
    let stockSummary = await fetch("https://stock-market-api-k9vl.onrender.com/api/profiledata")
        .then((response) => response.json())
        .then((a) => {
            return a.stocksProfileData[0];
        })
        .catch((error) => console.log(error));

    let summaryContainer = document.getElementById("summary");
    let subheading = document.createElement("h2");
    let p = document.createElement("p");
    if (!event) {//initial first company view
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
}

async function displayChart(stock = "AAPL", period = "5y", event) {
    const response = await fetch("https://stock-market-api-k9vl.onrender.com/api/stocksdata");
    const data = await response.json();
    chartStock = data["stocksData"][0]; // Store in globally created chartStock array
    if (!event) {//if event arg is not given it is undefined which is a falsy value
        createButtons(stock); // Load buttons for AAPL initially
        plotChart(stock, period);
    }
    if (event) {
        for (let stock in chartStock) {
            if (stock != "_id" && stock == event.target.textContent) {
                createButtons(stock);
                plotChart(stock, period);
            }
        }
    }
}

// Function to create chart data for a specific stock and period
function getChartData(stock, period) {
    const traces = [];

    if (chartStock[stock] && chartStock[stock][period]) {//check if respective values available
        const timeStamps = chartStock[stock][period]["timeStamp"];
        const values = chartStock[stock][period]["value"];

        // Convert timestamps to readable dates
        const x = timeStamps.map(ts => new Date(ts * 1000).toLocaleDateString("en-US"));
        // in api,each timestamp is in sec from a earlier respective date,multiply it with 1000  make it millisecond 
        // create a date obj with this and convert it to a string format to make it human readable in ui

        // Create trace for the selected stock
        // but the obj being pushed to traces must have these specific names as plotly requires
        traces.push({
            x: x,
            y: values,
            mode: 'lines',
            line: {//mode customization key must match mode name
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

    const maxIndex = values.indexOf(maxVal);// maxindex of maxvalue at value array,used to get the timestamp at respective
    // index
    const minIndex = values.indexOf(minVal);

    const maxDate = new Date(timeStamps[maxIndex] * 1000).toLocaleDateString("en-US");//it is the date in timestamp array 
    // at maxindex and converted to date format
    const minDate = new Date(timeStamps[minIndex] * 1000).toLocaleDateString("en-US");

    // trace->Actual data to plot (lines, bars, dots, etc.)
    // annotations->Labels, arrows, or notes added to highlight info
    // Each object inside annotations is like a sticky note pointing to a spot like arrows
    const annotations = [
        {
            // peak arr
            x: maxDate,// coordinates of where to point using annotation arrows
            y: maxVal,
            text: `Peak: $${maxVal}`,
            showarrayow: true,
            arrayowhead: 2,// specifies arrayowhead style
            ax: 0,// text is placed in this coordinate with respect to its default position (by def all are 30px below the x,y arrayow pointing)
            ay: -30,
            font: { color: 'green', size: 12 },
            bgcolor: 'white'
        },
        {
            // low value arrow
            x: minDate,
            y: minVal,
            text: `Low: $${minVal}`,
            showarrayow: true,
            arrayowhead: 2,
            ax: 0,
            ay: 30,
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

    Plotly.newPlot('chart', data, layout);//data is the traces

}

// Function to create buttons for periods and call plotChart with args
function createButtons(stock) {
    const buttonsContainer = document.getElementById('buttons');
    buttonsContainer.innerHTML = ""; // Clear previous buttons to avoid having repeated buttons

    // Create period buttons dynamically
    ["1mo", "3mo", "1y", "5y"].forEach(period => {
        let button = document.createElement('button');//buttons are created in js as each btn need to have diff
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
    displaySummary(event);// called with event arg and handled accordingly
}
// Book Value = Total Assets − Total Liabilities
// like If we shut down the company today and sold everything, it tells what would be left for the shareholders.