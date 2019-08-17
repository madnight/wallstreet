const Configstore      = require('configstore')
const IEXCloudClient   = require('node-iex-cloud').IEXCloudClient
const asciichart       = require('asciichart')
const axios            = require('axios')
const chalk            = require('chalk')
const cnnMarket        = require('cnn-market').cnnMarket
const commander        = require('commander')
const fetch            = require('node-fetch')
const fs               = require('fs')
const interpolateArray = require('array-interpolatejs').interpolateArray
const path             = require('path')
const scrapeIt         = require('scrape-it')
const toHumanString    = require('human-readable-numbers').toHumanString
const cnbcMarket       = require('cnbc-market').cnbcMarket

const { tail, forEach, last, flatMap, map, find } = require('lodash/fp')
const { identity, get, values, defaultTo, pipe }  = require('lodash/fp')
const { lookup, history }                         = require('yahoo-stocks')

// Comand Line Parsing
commander
  .option('-c, --chart <string>', 'chart for stock symbol e.g. MSFT')
  .option('-i, --interval <string>', 'Interval of price changes: 1m, 1d, 5d, 1mo, 1y')
  .option('-r, --range <string>', 'Range of dates to include: 1m, 1d, 5d, 1mo, 1y')
  .option('-h, --height <int>', 'Height of the chart')
  .option('--width <int>', 'Width of the chart')
  .option('-w, --watch')
  .parse(process.argv)

const interval = defaultTo("1d")(commander.interval)
const range    = defaultTo("5y")(commander.range)
const height   = defaultTo(14)(parseInt(commander.height))
const width    = defaultTo(80)(parseInt(commander.width))

// Quotes API
const iex = new IEXCloudClient(fetch,
  { publishable: 'pk_64fdeb84e42e4d239b3e87ab58d76e09' }
)

// Constants
const {COL_PAD, DELIM_LEN} = {COL_PAD: 9, DELIM_LEN: 109}

// Helper Functions
const getQuote    = async (it) => await iex.symbols(it).batch('quote')
const plusSign    = i => i > 0 ? '+' + i : i
const pad         = i => i.toString().padStart(COL_PAD)
const tablePad    = i => i.padEnd(COL_PAD)
const dollar      = i => '$' + i.toFixed(2)
const percentage  = i => (i * 100).toFixed(2) + '%'
const humanString = i => i ? toHumanString(i) : null
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
  const marketData = await cnnMarket()

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
  console.log("\n\n"+[].join.call(map(pad, colNames), "  "))
  console.log("-".repeat(DELIM_LEN))
  return forEach(console.log)(
  map(i  => [].join.call(i, "  "))(
    map(q => {
    return map(pad)(
    map(defaultTo(""))(
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
    ]))
  })(
  map('quote')(
  (await getQuote(config.get('stocks')))))))
}

// Stock chart of a symbol e.g. AAPL
const chart = async () => {
  return pipe(
    map(identity),
    tail,
    flatMap(map('close')),
    interpolateArray(width),
    x => asciichart.plot(x, {height: height}),
    console.log
  )(
  await history(commander.chart, {
    interval: interval,
    range: range
  }))
}

// Main function / Entrypoint
const main = async () => commander.chart ?  chart() : quotes()
main()
