# wallstreet
Stock quotes and charts for the terminal

<a href="https://npmjs.com/package/wallstreet"><img height="20" src="https://img.shields.io/npm/v/wallstreet.svg" alt="npm"/></a>
<a href="https://nodejs.org/en/download/releases/"><img height="20" src="https://img.shields.io/badge/node-%3E%3D%2014.0-brightgreen.svg" alt="License: MIT" /></a>
<a href="https://opensource.org/licenses/MIT"><img height="20" src="https://img.shields.io/badge/License-MIT-brightgreen.svg" alt="License: MIT" /></a>
<a href="https://github.com/madnight/wallstreet/actions/workflows/CI.yml"><img src="https://img.shields.io/github/workflow/status/madnight/wallstreet/CI" alt="Build Status" /></a>
<a href="https://codeclimate.com/github/madnight/wallstreet/issues"><img height="20" src="https://codeclimate.com/github/madnight/wallstreet/badges/issue_count.svg?maxAge=2592000" alt="Issue Count" /></a>
 <br> <br>

![image](https://user-images.githubusercontent.com/10064471/63653846-91edf100-c772-11e9-883e-96761e295766.png)

# Usage
```bash
# install
npm install wallstreet -g

# (alternative) install with yarn
yarn global add wallstreet

# (alternative) run without install
npx wallstreet

# run default
wallstreet

# run with options
wallstreet --zebra
wallstreet --chart MSFT --range 8h
```

# Options

```bash
Usage: wallstreet [options]

Options:
  -c , --chart <string>  chart for stock symbol e.g. MSFT
  -r , --range <string>  1m 5m 10m 15m 20m 30m 40m 50m 1h 2h 3h 4h 8h 1d 2d 5d 1mo 1y 5y 10y
  -h , --height <int>    Height of the chart
  -z , --zebra           Visual even-odd zebra-striped table mode
  -w , --width <int>     Width of the chart
  -h, --help             output usage information
```

# Config

The list of stocks can be configured via the wallstreet.json file.
```bash
cat $HOME/.config/configstore/wallstreet.json

{
    stocks": [
        "AAPL",
        "MSFT",
        "GOOGL",
        "INTC",
        "AMD",
        "PEP",
        "MU",
        "TSLA",
        "NFLX",
        "DIS",
        "AMZN",
        "SBUX",
        "FB",
        "BRK.B",
        "BABA",
        "V",
        "QQQ",
        "SPY"
}
```


![image](https://user-images.githubusercontent.com/10064471/63654140-86042e00-c776-11e9-9e1c-072f733f6631.png)
