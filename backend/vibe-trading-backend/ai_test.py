import os
from google import genai
from dotenv import load_dotenv

# 1. Load the secret API key from your .env file
load_dotenv()

# 2. Initialize the Google GenAI client
# It automatically reads the GEMINI_API_KEY from your environment
client = genai.Client()

print("Sending prompt to Gemini...")

# 3. Ask the AI a question
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Give me a 1-sentence trading rule about risk management.",
)

# 4. Print the AI's response to your terminal
print("\n--- AI Response ---")
print(response.text)