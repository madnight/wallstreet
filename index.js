const Configstore                           = require('configstore')
const asciichart                            = require('asciichart')
const axios                                 = require('axios')
const chalk                                 = require('chalk')
const commander                             = require('commander')
const fetch                                 = require('node-fetch')
const fs                                    = require('fs')
const path                                  = require('path')
const scrapeIt                              = require('scrape-it')
const { IEXCloudClient }                    = require('node-iex-cloud')
const { cnbcMarket }                        = require('cnbc-market')
const { cnnMarket }                         = require('cnn-market')
const { identity, values, defaultTo, pipe } = require('lodash/fp')
const { interpolateArray }                  = require('array-interpolatejs')
const { lookup, history }                   = require('yahoo-stocks')
const { tail, forEach, flatMap, map, find } = require('lodash/fp')
const { compact }                           = require('lodash/fp')
const { toHumanString }                     = require('human-readable-numbers')

const validRange = ['1m', '5m', '10m', '15m', '20m', '30m', '40m', '50m',
'1h', '2h', '3h', '4h', '8h', '1d', '2d', '5d', '1mo', '1y', '5y', '10y']

// Comand Line Parsing
commander
  .option('-c, --chart <string>', 'chart for stock symbol e.g. MSFT')
  .option('-r, --range <string>', validRange.join(" "))
  .option('-h, --height <int>', 'Height of the chart')
  .option('-z, --zebra', 'Visual even-odd zebra-striped table mode')
  .option('-w, --width <int>', 'Width of the chart')
  .parse(process.argv)

const range    = defaultTo("5y")(commander.range)
const height   = defaultTo(14)(parseInt(commander.height))
const width    = defaultTo(80)(parseInt(commander.width))

if (!validRange.includes(range)){
    console.log(chalk.red("Invalid -r range option. See --help. " +
    "Valid values are:\n" + validRange.join(" ")))
    process.exit(1)
}

// Quotes API
const iex = new IEXCloudClient(fetch,
  { publishable: 'pk_64fdeb84e42e4d239b3e87ab58d76e09' }
)

// Constants
const {COL_PAD, DELIM_LEN} = {COL_PAD: 9, DELIM_LEN: 109}
const interval = () => {
  if (["1mo", "1y", "5y", "10y"].includes(range))
      return "1d"
  if (['8h', '1d', '2d', '5d'].includes(range))
      return "1h"
  return "1m"
}

// Helper Functions
const getQuote = async i => {
  try {
      return await iex.symbols(i).batch('quote')
  } catch (e) {
      console.log(chalk.red("Error. Could not find symbol: " + commander.chart))
      process.exit(1)
  }
}
const getHist = async () => {
  try {
      return await history(commander.chart, { interval: interval(), range: range })
  } catch (e) {
      console.log(chalk.red("Error. Could not find symbol: " + commander.chart))
      process.exit(1)
  }
}
const plusSign    = i => i > 0 ? '+' + i : i
const pad         = i => i.toString().padStart(COL_PAD)
const tablePad    = i => i.padEnd(COL_PAD)
const dollar      = i => '$' + i.toFixed(2)
const percentage  = i => (i * 100).toFixed(2) + '%'
const humanString = i => i ? toHumanString(i).replace("G","B") : null
const red         = pipe(pad, chalk.red)
const green       = pipe(pad, chalk.green)
const config      = new Configstore('stock-chart-cli',
  JSON.parse( fs.readFileSync('watchlist.json'))
)
const colNames    = [tablePad('Symbol')].concat(
  ['Price', 'Change', 'Change%', 'AvgVolume', 'P/E',
   'MktCap', 'Week52Low', 'Week52High', 'YTDChange']
)
const tableHead = (name, pad, symbol, chg, chgPcnt) =>
  process.stdout.write(chalk.bold(name.padEnd(pad)) + symbol.padStart(10)
    + (chgPcnt ? (" [" + chg + "|" + chgPcnt + "]").padStart(18).padEnd(22)
      : (" [" + chg + "]").padStart(9).padEnd(11))
  )
const zebra = x => commander.zebra ?
  x.map((y,i) => i % 2 ? map(pipe(chalk.bold, chalk.dim))(y) : y) : x

// Colors
const percentColor = i => i.includes("-") ? red(i) : green(i)
const numColor     = i => i < 0 ?  red(i) : green(i)
const peColor      = i => {
  switch (true) {
    case i < 0 || i > 40 : return red(i)
    case i < 10          : return green(i)
    default              : return i
  }
}

const symColor = price => symbol =>
  chalk.bold((price < 0) ? red(symbol) : green(symbol))

// Table of market data and quotes from watchlist
quotes = async () => {
  const [marketData, stocks] = await Promise.all([
  cnnMarket(), getQuote(config.get('stocks'))])

  // Print market table header
  const f = i => find({ symbol: i }, marketData)
  _ = [
    f("DOW"),    f("HongKong"), f("Gold"),
    f("S&P500"), f("London"),   f("Oil"),
    f("NASDAQ"), f("Germany"),  f("Yield10y"),
  ].map( (x, i) =>
    tableHead((i % 3 == 0 ? "\n" : "") +
      x.symbol, COL_PAD, x.value, x.change, x.changePcnt)
  )
  console.log("\n\n"+ map(pad, colNames).join("  "))
  console.log("-".repeat(DELIM_LEN))
  pipe(
      map('quote'),
      map( q =>
      [ // Parse API data in human readable format
        symColor(q.change)(tablePad(q.symbol)),
        dollar(q.latestPrice),
        numColor(plusSign(q.change ? q.change.toFixed(2) : null)),
        percentColor(percentage(plusSign(q.changePercent))),
        humanString(q.avgTotalVolume),
        peColor(defaultTo("")(q.peRatio ? q.peRatio.toFixed(1) : null)),
        humanString(q.marketCap),
        dollar(q.week52Low),
        dollar(q.week52High),
        percentColor(plusSign(percentage(q.ytdChange)))
      ]),
     map(map(defaultTo(""))),
     map(map(pad)),
     zebra,
     map(i  => i.join("  ")),
     forEach(console.log)
  )((stocks))
}


// Stock chart of a symbol e.g. AAPL
const chart = async () => {
    const [hist, qt] = await Promise.all([getHist(), getQuote(commander.chart)])
    const chart = pipe(
      map(identity),
      tail,
      flatMap(map('close')),
      interpolateArray(width),
      compact,
      x => asciichart.plot(x, {height: height}),
    )(hist)
    const q = map('quote')(qt)[0]
    console.log(chart)
    console.log(" ".repeat(15)+(q.companyName + " " + range +
    " chart. Latest Price: $" + q.latestPrice + " | MktCap: " +
    humanString(q.marketCap)))
}

// Main function / Entrypoint
const main = async () => commander.chart ? chart() : quotes()
main()
