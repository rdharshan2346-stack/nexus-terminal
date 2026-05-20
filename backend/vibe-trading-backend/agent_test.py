import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client()

# --- THIS IS THE TOOL ---
# We write a normal Python function. The AI will read the description 
# to understand when and how to use it.
def get_mock_stock_price(ticker: str) -> str:
    """
    Fetches the live stock price for a given ticker symbol.
    Args:
        ticker: The stock symbol (e.g., AAPL, GOOG, TSLA)
    """
    # In real life, this function would call a real financial API.
    # For now, we mock it with some hardcoded data.
    prices = {
        "AAPL": "$175.50",
        "GOOG": "$150.25",
        "TSLA": "$180.00"
    }
    return f"The current price of {ticker} is {prices.get(ticker.upper(), 'unknown')}."

print("Asking the Agent a question that requires a tool...")

# --- THE AGENT LOOP ---
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Can you check the current stock price for AAPL?",
    # We pass our function directly into the config as a tool!
    config=types.GenerateContentConfig(
        tools=[get_mock_stock_price],
    )
)

print("\n--- Agent's Final Answer ---")
print(response.text)