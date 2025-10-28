from colorama import Fore, Style
import yfinance as yf
import argparse
from tabulate import tabulate
from concurrent.futures import ThreadPoolExecutor, as_completed

def format_number(num):
    """Format large numbers with K, M, B, T suffixes"""
    if num is None or num == 'N/A':
        return 'N/A'
    try:
        num = float(num)
        if abs(num) >= 1e12:
            return f'${num/1e12:.2f}T'
        elif abs(num) >= 1e9:
            return f'${num/1e9:.2f}B'
        elif abs(num) >= 1e6:
            return f'${num/1e6:.2f}M'
        elif abs(num) >= 1e3:
            return f'${num/1e3:.2f}K'
        else:
            return f'${num:.2f}'
    except (ValueError, TypeError):
        return 'N/A'

def format_percentage(value):
    """Format percentage values with color coding"""
    if value is None or value == 'N/A':
        return 'N/A'
    try:
        pct = float(value) * 100
        pct_str = f'{pct:.2f}%'
        return Fore.RED + pct_str + Style.RESET_ALL if pct < 0 else Fore.GREEN + pct_str + Style.RESET_ALL
    except (ValueError, TypeError):
        return 'N/A'

def format_simple_percentage(value):
    """Format percentage values without color"""
    if value is None or value == 'N/A':
        return 'N/A'
    try:
        pct = float(value) * 100
        return f'{pct:.2f}%'
    except (ValueError, TypeError):
        return 'N/A'

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Fetch stock data from Yahoo Finance',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s                    # Use default stocks
  %(prog)s AAPL MSFT GOOGL    # Fetch specific stocks
  %(prog)s TSLA               # Fetch single stock
        '''
    )
    parser.add_argument(
        'symbols',
        nargs='*',
        help='Stock symbols to fetch (default: AAPL,MSFT,GOOGL,INTC,AMD,PEP,MU,TSLA,NFLX,DIS,AMZN,SPY,QQQ)'
    )
    args = parser.parse_args()
    
    # Use default symbols if none provided
    if not args.symbols:
        return ['AAPL', 'MSFT', 'GOOGL', 'INTC', 'AMD', 'PEP', 'MU', 'TSLA', 'NFLX', 'DIS', 'AMZN', 'SPY', 'QQQ']
    
    return [s.strip().upper() for s in args.symbols]

def get_stock_info(symbol):
    """Fetch comprehensive stock data from yfinance"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get current price and changes
        current_price = info.get('currentPrice') or info.get('regularMarketPrice')
        previous_close = info.get('previousClose')
        
        # Calculate change if we have both prices
        change_pct = None
        if current_price and previous_close:
            change_pct = (current_price - previous_close) / previous_close
        
        return {
            'Symbol': symbol,
            'Name': info.get('shortName', 'N/A')[:30],  # Truncate long names
            'Price': f'${current_price:.2f}' if current_price else 'N/A',
            'Change': format_percentage(change_pct),
            'Volume': info.get('volume', 'N/A'),
            'Market Cap': format_number(info.get('marketCap')),
            'P/E': f"{info.get('trailingPE', 'N/A'):.2f}" if isinstance(info.get('trailingPE'), (int, float)) else 'N/A',
            'Forward P/E': f"{info.get('forwardPE', 'N/A'):.2f}" if isinstance(info.get('forwardPE'), (int, float)) else 'N/A',
            'P/B': f"{info.get('priceToBook', 'N/A'):.2f}" if isinstance(info.get('priceToBook'), (int, float)) else 'N/A',
            'Div Yield': format_simple_percentage(info.get('dividendYield')),
            '52W Low': f"${info.get('fiftyTwoWeekLow'):.2f}" if info.get('fiftyTwoWeekLow') else 'N/A',
            '52W High': f"${info.get('fiftyTwoWeekHigh'):.2f}" if info.get('fiftyTwoWeekHigh') else 'N/A',
        }
    except Exception as e:
        print(f"{Fore.RED}Error fetching data for {symbol}: {str(e)}{Style.RESET_ALL}")
        return None

def get_all_stock_data(symbols):
    """Fetch data for all symbols in parallel"""
    all_data = []
    
    # Use ThreadPoolExecutor for parallel requests
    with ThreadPoolExecutor(max_workers=10) as executor:
        # Submit all tasks
        future_to_symbol = {executor.submit(get_stock_info, symbol): symbol for symbol in symbols}
        
        # Collect results as they complete
        for future in as_completed(future_to_symbol):
            symbol = future_to_symbol[future]
            try:
                data = future.result()
                if data:
                    all_data.append(data)
            except Exception as e:
                # Silently skip failed symbols
                pass
    
    # Sort by original order
    symbol_order = {symbol: i for i, symbol in enumerate(symbols)}
    all_data.sort(key=lambda x: symbol_order.get(x['Symbol'], 999))
    
    return all_data

def print_stock_data(data):
    """Print stock data in a formatted table"""
    if not data:
        return
    print(tabulate(data, headers='keys', tablefmt='simple_outline'))

if __name__ == '__main__':
    symbols = parse_arguments()
    data = get_all_stock_data(symbols)
    print_stock_data(data)
