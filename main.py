from colorama import Fore, Style
import requests
import configparser
from tabulate import tabulate

def parse_price(details):
    price = round(float(details['Price'][1:]), 2)
    return '${:.2f}'.format(price)

def parse_change(value):
    change = round(float(value.rstrip('%')), 2)
    change_str = '{:.2f}%'.format(change)
    return Fore.RED + change_str + Style.RESET_ALL if float(change) < 0 else change_str

def read_config_file(filename):
    config = configparser.ConfigParser()
    config.read(filename)
    return config.get('Symbols', 'stocks').split(',')

def get_stock_data(symbols):
    url = 'https://finance.beuke.org/quote/{}'.format(symbols)
    return requests.get(url).json()

def parse_price(details):
    price = round(float(details['Price'][1:]), 2)
    return price  # return as float

def calculate_absolute_price(base_price, percentage):
    return base_price * (1 + percentage / 100)

def format_stock_data(data):
    return [
        {
            'Symbol': stock['symbol'],
            'Price': '${:.2f}'.format(parse_price(stock)),
            'Change': parse_change(stock['Change']),
            'Average Volume': stock['Avg Volume'],
            'P/E': stock['P/E'],
            'Market Cap': stock['Market Cap'],
            '52W Low': '${:.2f}'.format(calculate_absolute_price(parse_price(stock), float(stock['52W High'].rstrip('%')))),
            '52W High': '${:.2f}'.format(calculate_absolute_price(parse_price(stock), float(stock['52W Low'].rstrip('%')))),
            'YTD Change': parse_change(stock['Perf YTD']),
        }
        for stock in data
    ]

def print_stock_data(data):
    print(tabulate(data, headers='keys', stralign='right', tablefmt='simple_outline'))

def get_all_stock_data(symbols):
    all_data = []
    for symbol in symbols:
        data = get_stock_data(symbol)
        all_data.append(data)
    return all_data

symbols = read_config_file('config.ini')
data = get_all_stock_data(symbols)
formatted_data = format_stock_data(data)
print_stock_data(formatted_data)
