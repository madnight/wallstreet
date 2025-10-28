# wallstreet
Stock quotes and comprehensive data for the terminal using Yahoo Finance

<a href="https://opensource.org/licenses/MIT"><img height="20" src="https://img.shields.io/badge/License-MIT-brightgreen.svg" alt="License: MIT" /></a>
 <br> <br>
![image](https://github.com/madnight/wallstreet/assets/10064471/61bac8ff-83a7-41f1-8f11-7f1f96cadc54)

# Features
- Fetches real-time stock data from Yahoo Finance using yfinance
- Displays comprehensive stock information including:
  - Current price and daily change (color-coded)
  - Volume and average volume
  - Market cap
  - Valuation ratios (P/E, Forward P/E, PEG, P/B)
  - Dividend yield
  - Beta
  - 52-week high/low
  - EPS and analyst target price
- Clean, colorful terminal output

# Usage
```bash
# run with default stocks (AAPL,MSFT,GOOGL,INTC,AMD,PEP,MU,TSLA,NFLX,DIS,AMZN,SPY,QQQ)
uv run main.py

# fetch specific stocks
uv run main.py AAPL MSFT GOOGL

# fetch a single stock
uv run main.py TSLA

# get help
uv run main.py --help
```
