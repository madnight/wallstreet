require! {
  axios
  path
  'human-readable-numbers': { toHumanString }
  'lodash/fp': { forEach, dropRight, drop, last, flatMap, map, values, tail, flatMap }
  'node-iex-cloud': { IEXCloudClient }
  'node-fetch': fetch
}

const asciichart                    = require ('asciichart')

const alpha = require('alphavantage')({ key: 'qweqweqwe' })

iex = new IEXCloudClient fetch,
    sandbox: false
    publishable: "pk_64fdeb84e42e4d239b3e87ab58d76e09"
    version: "stable"

# token = "pk_64fdeb84e42e4d239b3e87ab58d76e09"
# baseURL = "https://cloud.iexapis.com/stable/"
# batchAPI = "/stock/market/batch?symbols="
# types = "&types=quote&token="
# (await require("axios")(baseURL + batchAPI + it + types + token)).data

getQuote = ->> await iex.symbols(it).batch "quote"

getQuote = ->> await iex.symbols(it).batch "quote"

stocks = <[ msft googl aapl nflx dis amnz fb brk.b baba v ]>.sort!
plusSign = -> if (it > 0) then "+" + it else  it
pad = -> it.toString!padStart(9)
colNames = ["Symbol".padEnd(9)] ++ <[ Price Change Change% AvgVolume P/E MktCap Week52Low Week52High YTDChange ]>

main = ->>
    console.log '\033[2J'
    # console.log((await getQuote(stocks)))
    console.log map(pad, colNames) * "  "
    console.log "-------------------------------------------------------------------------------------------------------------"
    (await getQuote(stocks))
    |> map 'quote'
    |> map( (v) ->
        map(pad)([
         v.symbol.padEnd(9),
         ("$" + v.latestPrice.toFixed(2)),
         # ("$" + v.close),
         # "$" + v.high,
         # "$" + v.low,
         plusSign(v.change),
         plusSign((v.changePercent * 100).toFixed(2)) + "%",
         # toHumanString(v.previousVolume),
         toHumanString(v.avgTotalVolume),
         if v.peRatio then (v.peRatio).toFixed(1) else "",
         if v.marketCap then toHumanString(v.marketCap) else  "",
         "$" + v.week52Low.toFixed(2),
         "$" + v.week52High.toFixed(2),
         plusSign((v.ytdChange * 100).toFixed(2)) + "%",
        ]))
    |> map(-> it * "  ")
    |> forEach console.log

# main!

console.log '\033[2J'
# iex
#   .symbol("aapl")
#   .chart("3m", { chartCloseOnly: true, chartSimplify: false })
#   .then((res) -> console.log(asciichart.plot(map('close',res), { height: 14 })))

chart = ->>
    (await alpha.data.monthly("msft"))
    |> map( (x) -> x )
    |> tail
    |> flatMap(map(values))
    |> map( (x) -> x[3] )
    # |> asciichart.plot
    |> console.log
    # |> asciichart.plot(map('close',res), { height: 14 }))

chart!
