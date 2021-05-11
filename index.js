#!/usr/bin/env node

import asciichart from "asciichart";
import chalk from "chalk";
import commander from "commander";
import Configstore from "configstore";
import fetch from "node-fetch";
import { interpolateArray } from "array-interpolatejs";
import { cnnMarket } from "cnn-market";
import * as fs from "fs";
import humanReadableNumbers from "human-readable-numbers";
import yahoo from "yahoo-stocks";
import lodash from "lodash/fp.js";
import _ from "lodash/fp.js";

const { toHumanString } = humanReadableNumbers;
const { version } = JSON.parse(fs.readFileSync("./package.json", "utf8"));

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
    "10y",
];

// Comand Line Parsing
const program = new commander.Command()
program
    .option("-c , --chart <string>", "chart for stock symbol e.g. MSFT")
    .option("-r , --range <string>", validRange.join(" "))
    .option("-h , --height <int>", "Height of the chart")
    .option("-z , --zebra", "Visual even-odd zebra-striped table mode")
    .option("-w , --width <int>", "Width of the chart")
    .version(version)
    .parse(process.argv);

const param = program.opts();

const range = _.defaultTo("5y")(param.range);
const height = _.defaultTo(14)(parseInt(param.height));
const width = _.defaultTo(80)(parseInt(param.width));

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
    console.log(chalk.red("Error. Could not find symbol: " + param.chart));
    process.exit(1);
};

// API Data Functions
const getQuote = async (stocks) => {
    const res = await fetch(
        "https://finance.beuke.org/quote/batch/" + stocks
    ).catch(errorHandler);
    return await res.json();
};
const getHist = async () =>
    await yahoo.history(param.chart, {
        interval: interval(),
        range: range,
    }).catch(errorHandler);

// Helper Functions
const plusSign = (i) => (i > 0 ? "+" + i : i);
const pad = (i) => (i ? i : "").toString().padStart(COL_PAD);
const dollar = (i) => (i ? "$" + i : "");
const humanString = (i) => (i ? toHumanString(i).replace("G", "B") : null);
const [red, green] = [_.pipe(pad, chalk.red), _.pipe(pad, chalk.green)];

const watchlist = JSON.parse(fs.readFileSync("./watchlist.json", "utf8"));
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
    "YTDChange",
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
const zebra = (x) =>
    param.zebra
        ? x.map((y, i) => (i % 2 ? _.map(_.pipe(chalk.bold, chalk.dim))(y) : y))
        : x;

// Colors
const percentColor = (i) => (i.includes("-") ? red(i) : green(i));
const shortColor = (i) => (i.length > 5 ? red(i) : i);
const peColor = (i) => {
    switch (true) {
        case i < 0 || i > 40:
            return red(i);
        case i < 10:
            return green(i);
        default:
            return i;
    }
};

const symColor = (price) => (symbol) =>
    chalk.bold(price < 0 ? red(symbol) : green(symbol));

// Table of market data and quotes from watchlist
const quotes = async () => {
    const [marketData, stocks] = await Promise.all([
        cnnMarket(),
        getQuote(config.get("stocks")),
    ]);

    // Print market table header
    const f = (i) => _.find({ symbol: i }, marketData);
    const x = [
        // eslint-disable-line no-undef
        f("DOW"),
        f("HongKong"),
        f("Gold"),
        f("S&P500"),
        f("London"),
        f("Oil"),
        f("NASDAQ"),
        f("Germany"),
        f("Yield10y"),
    ].map((x, i) =>
        tableHead(
            (i % 3 == 0 ? "\n" : "") + x.symbol,
            COL_PAD,
            x.value.length > 7 ? x.value.slice(0, -3) : x.value,
            x.change,
            x.changePcnt
        )
    );
    console.log("\n\n" + _.map(pad, colNames).join("  "));

    console.log("-".repeat(DELIM_LEN));
    _.pipe(
        _.map((q) => [
            // Parse API data in human readable format
            symColor(q.change)(q.symbol.padEnd(COL_PAD)),
            dollar(q.price),
            // numColor(plusSign(q.change ? q.change : null)),
            percentColor((q.price - q.prevClose).toFixed(2)),
            percentColor(q.change),
            shortColor(q.shortFloat),
            peColor(_.defaultTo("")(q.peRatio ? q.peRatio : null)),
            q.cap.replace(/\.\d\d/i, ""),
            dollar(q.fiftyTwoWeekRange.replace(/\s.+/i, "")),
            dollar(q.fiftyTwoWeekRange.replace(/\d+.\d+\s-\s/i, "")),
            percentColor(plusSign(q.perfYTD)),
        ]),
        _.map(_.map(_.defaultTo(""))),
        _.map(_.map(pad)),
        zebra,
        _.map(_.join("  ")),
        _.forEach(console.log)
    )(stocks);
};

// Stock chart of a symbol e.g. AAPL
const chart = async () => {
    const [hist, qt] = await Promise.all([
        getHist(),
        getQuote(param.chart),
    ]);
    const chart = _.pipe(
        _.map(_.identity),
        _.tail,
        _.flatMap(_.map("close")),
        interpolateArray(width),
        _.compact,
        (x) => asciichart.plot(x, { height: height })
    )(hist);
    const q = qt[0];
    console.log(chart);
    console.log(
        " ".repeat(15) +
            (q.symbol +
                " " +
                range +
                " chart. Latest Price: $" +
                q.price +
                " | MktCap: " +
                q.cap)
    );
};

// Main function / Entrypoint
const main = async () => (param.chart ? chart() : quotes());
main();
