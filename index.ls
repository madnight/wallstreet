require! {
  axios
  path
  asciichart
  \lodash/fp              : { forEach, last, flatMap, map, values, flatMap, defaultTo}
  \human-readable-numbers : { toHumanString }
  \node-iex-cloud         : { IEXCloudClient }
  \node-fetch             : fetch
}

alpha = require \alphavantage key: \qweqweqwe

iex = new IEXCloudClient fetch,
    sandbox: false
    publishable: \pk_64fdeb84e42e4d239b3e87ab58d76e09
    version: \stable

COL_PAD = 9
DELIM_LEN = 109
getQuote = ->> await iex.symbols(it).batch \quote
stocks = <[ msft googl aapl nflx dis amnz fb brk.b baba v qqq spy ]>.sort!
plusSign = -> if (it > 0) then \+ + it else  it
pad = (.toString!padStart(COL_PAD))
tablePad = (.padEnd(COL_PAD))
colNames = [tablePad \Symbol] ++
<[ Price Change Change% AvgVolume P/E MktCap Week52Low Week52High YTDChange ]>
dollar = -> \$ + it.toFixed(2)
percentage = -> (it * 100).toFixed(2) + \%
humanString = -> if it then toHumanString it

do ->>
    console.log \\033[2J
    console.log map(pad, colNames) * "  "
    console.log "-" * DELIM_LEN
    (await getQuote <| stocks)
    |> map 'quote'
    |> map( ->
        [
         it.symbol               |> tablePad
         it.latestPrice          |> dollar
         it.change               |> plusSign
         it.changePercent        |> plusSign     |> percentage
         it.avgTotalVolume       |> humanString
         it.peRatio?.toFixed(1)
         it.marketCap            |> humanString
         it.week52Low            |> dollar
         it.week52High           |> dollar
         it.ytdChange            |> percentage   |> plusSign
        ]
        |> map defaultTo ""
        |> map pad
    )
    |> map(-> it * "  ")
    |> forEach console.log

chart = ->>
    (await alpha.data.monthly("msft"))
    |> map( (x) -> x )
    |> tail
    |> flatMap(map(values))
    |> map( (x) -> x[3] )
    # |> asciichart.plot
    |> console.log
    # |> asciichart.plot(map('close',res), { height: 14 }))

# chart!
# main!
