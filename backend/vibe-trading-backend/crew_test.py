import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew

# Import CrewAI's native tool maker instead of Langchain! <--- THE FIX
from crewai.tools import tool 
from duckduckgo_search import DDGS

load_dotenv()
gemini_model = "gemini/gemini-2.5-flash"

# --- OUR CUSTOM SEARCH TOOL ---
@tool("Search the Internet")
def search_tool(search_query: str) -> str:
    """Use this tool to search the live internet for news and information."""
    try:
        results = DDGS().text(search_query, max_results=3)
        return str(results)
    except Exception as e:
        return f"Search failed: {e}"

print("Booting up your live-connected AI Crew...")

# 1. The Analyst 
stock_analyst = Agent(
    role="Senior Stock Analyst",
    goal="Search the web for the latest breaking news and analyze market sentiment.",
    backstory="You are an expert Wall Street quant who relies on up-to-the-minute news to make decisions.",
    llm=gemini_model,
    tools=[search_tool], 
    verbose=True
)

# 2. The Writer
financial_writer = Agent(
    role="Lead Financial Journalist",
    goal="Convert raw news data into a brief, high-impact newsletter.",
    backstory="You transform complex news into clear text for retail investors.",
    llm=gemini_model,
    verbose=True
)

# 3. The Live Tasks
task_research = Task(
    description="Search the internet for the most recent news today regarding Apple (AAPL). Find at least 2 current events or headlines.",
    expected_output="A bulleted list of the latest AAPL news facts.",
    agent=stock_analyst
)

task_write = Task(
    description="Take the analyst's live news points and write a short, punchy 1-paragraph summary.",
    expected_output="A clean 1-paragraph news summary.",
    agent=financial_writer
)

# 4. Form the Crew
live_news_crew = Crew(
    agents=[stock_analyst, financial_writer],
    tasks=[task_research, task_write],
    max_rpm=2
)

print("\nStarting the workflow... Watch the Analyst search the web!")
result = live_news_crew.kickoff()

print("\n--- Live Market Update ---")
print(result)