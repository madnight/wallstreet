#!/usr/bin/env node

const asciichart = require("asciichart");
const chalk = require("chalk");
const commander = require("commander");
const Configstore = require("configstore");
const fetch = require("node-fetch");
const watchlist = require("./watchlist.json");
const { interpolateArray } = require("array-interpolatejs");
const { cnnMarket } = require("cnn-market");
const { toHumanString } = require("human-readable-numbers");
const { identity, defaultTo, pipe } = require("lodash/fp");
const { tail, forEach, flatMap } = require("lodash/fp");
const { compact, find, map, join } = require("lodash/fp");
const { IEXCloudClient } = require("node-iex-cloud");
const { history } = require("yahoo-stocks");
const { version } = require('./package.json');

// Constants
const { COL_PAD, DELIM_LEN } = { COL_PAD: 9, DELIM_LEN: 109 };
const validRange = [
    "1m",
    "5m",
    "10m",
    "15m",
    "20m",
    "30m",
    "40m",
    "50m",
    "1h",
    "2h",
    "3h",
    "4h",
    "8h",
    "1d",
    "2d",
    "5d",
    "1mo",
    "3mo",
    "6mo",
    "1y",
    "5y",
    "10y"
];

// Comand Line Parsing
commander
    .option("-c , --chart <string>", "chart for stock symbol e.g. MSFT")
    .option("-r , --range <string>", validRange.join(" "))
    .option("-h , --height <int>", "Height of the chart")
    .option("-z , --zebra", "Visual even-odd zebra-striped table mode")
    .option("-w , --width <int>", "Width of the chart")
    .version(version)
    .parse(process.argv);

const range = defaultTo("5y")(commander.range);
const height = defaultTo(14)(parseInt(commander.height));
const width = defaultTo(80)(parseInt(commander.width));

// Comand Line Validation
if (!validRange.includes(range)) {
    console.log(
        chalk.red(
            "Invalid -r range option. See --help. " +
                "Valid values are:\n" +
                validRange.join(" ")
        )
    );
    process.exit(1);
}

// Error Handlers
const errorHandler = () => {
    console.log(chalk.red("Error. Could not find symbol: " + commander.chart));
    process.exit(1);
};

// API Data Functions
const getQuote = async stocks => {
    const res = await fetch("https://finance.beuke.org/quote/batch/" + stocks)
         .catch(errorHandler);
    return await res.json();
}
const getHist = async () =>
    await history(commander.chart, {
        interval: interval(),
        range: range
    }).catch(errorHandler);

// Helper Functions
const plusSign = i => (i > 0 ? "+" + i : i);
const pad = i => (i ? i : "").toString().padStart(COL_PAD);
const dollar = i => (i ? "$" + i : "");
const percentage = i => (i ? (i * 100).toFixed(2) + "%" : "");
const humanString = i => (i ? toHumanString(i).replace("G", "B") : null);
const [red, green] = [pipe(pad, chalk.red), pipe(pad, chalk.green)];

const config = new Configstore("wallstreet", watchlist);

const colNames = ["Symbol".padEnd(COL_PAD)].concat([
    "Price",
    "Change",
    "Change%",
    "Short",
    "P/E",
    "MktCap",
    "Week52Low",
    "Week52High",
    "YTDChange"
]);
const tableHead = (name, pad, symbol, chg, chgPcnt) =>
    process.stdout.write(
        chalk.bold(name.padEnd(pad)) +
            symbol.padStart(10) +
            (chgPcnt
                ? (" [" + chg + "|" + chgPcnt + "]").padStart(17).padEnd(22)
                : (" [" + chg + "]").padStart(9).padEnd(11))
    );
const interval = () => {
    if (["1mo", "3mo", "6mo", "1y", "5y", "10y"].includes(range)) return "1d";
    if (["8h", "1d", "2d", "5d"].includes(range)) return "1h";
    return "1m";
};
const zebra = x =>
    commander.zebra
        ? x.map((y, i) => (i % 2 ? map(pipe(chalk.bold, chalk.dim))(y) : y))
        : x;

// Colors
const percentColor = i => (i.includes("-") ? red(i) : green(i));
const shortColor = i => i.length > 5 ? red(i) : i;
const numColor = i => (i < 0 ? red(i) : green(i));
const peColor = i => {
    switch (true) {
        case i < 0 || i > 40:
            return red(i);
        case i < 10:
            return green(i);
        default:
            return i;
    }
};

const symColor = price => symbol =>
    chalk.bold(price < 0 ? red(symbol) : green(symbol));

const humanStr = i => (i ? toHumanString(i).replace("G", "B") : null);

// Table of market data and quotes from watchlist
const quotes = async () => {
    const [marketData, stocks] = await Promise.all([
        cnnMarket(),
        getQuote(config.get("stocks"))
    ]);

    // Print market table header
    const f = i => find({ symbol: i }, marketData);
    _ = [
        // eslint-disable-line no-undef
        f("DOW"),
        f("HongKong"),
        f("Gold"),
        f("S&P500"),
        f("London"),
        f("Oil"),
        f("NASDAQ"),
        f("Germany"),
        f("Yield10y")
    ].map((x, i) =>
        tableHead(
            (i % 3 == 0 ? "\n" : "") + x.symbol,
            COL_PAD,
            x.value.length > 7 ? x.value.slice(0, -3) : x.value,
            x.change,
            x.changePcnt
        )
    );
    console.log("\n\n" + map(pad, colNames).join("  "));


    console.log("-".repeat(DELIM_LEN));
    pipe(
        map(q => [
            // Parse API data in human readable format
            symColor(q.change)(q.symbol.padEnd(COL_PAD)),
            dollar(q.price),
            // numColor(plusSign(q.change ? q.change : null)),
            percentColor((q.price - q.prevClose).toFixed(2)),
            percentColor(q.change),
            shortColor(q.shortFloat),
            peColor(defaultTo("")(q.peRatio ? q.peRatio : null)),
            q.cap.replace(/\.\d\d/i, ""),
            dollar(q.fiftyTwoWeekRange.replace(/\s.+/i, "")),
            dollar(q.fiftyTwoWeekRange.replace(/\d+.\d+\s-\s/i, "")),
            percentColor(plusSign(q.perfYTD))
        ]),
        map(map(defaultTo(""))),
        map(map(pad)),
        zebra,
        map(join("  ")),
        forEach(console.log)
    )(stocks);
};

// Stock chart of a symbol e.g. AAPL
const chart = async () => {
    const [hist, qt] = await Promise.all([
        getHist(),
        getQuote(commander.chart)
    ]);
    const chart = pipe(
        map(identity),
        tail,
        flatMap(map("close")),
        interpolateArray(width),
        compact,
        x => asciichart.plot(x, { height: height })
    )(hist);
    const q = map("quote")(qt)[0];
    console.log(chart);
    console.log(
        " ".repeat(15) +
            (q.companyName +
                " " +
                range +
                " chart. Latest Price: $" +
                q.latestPrice +
                " | MktCap: " +
                humanString(q.marketCap))
    );
};

// Main function / Entrypoint
const main = async () => (commander.chart ? chart() : quotes());
main();
