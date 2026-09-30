"""
Customer Agent — models a customer's intent and needs.

The Customer Agent:
  1. Receives the customer's raw request
  2. Analyses it to identify: what they want, constraints, preferences
  3. Formulates structured queries to send to the Store Agent
  4. Synthesises the Store Agent's responses into a final helpful answer

Think of it as the "smart shopper" brain.
"""

from app.ai.claude_client import chat

CUSTOMER_AGENT_SYSTEM = """\
You are the Customer Agent in a multi-agent retail assistant system.

Your role:
- You represent the customer's interests and intent.
- You receive the customer's request and break it down into clear, structured needs.
- You communicate with the Store Agent by asking it specific, actionable questions.
- After receiving the Store Agent's response, you synthesise everything into a 
  clear, friendly final answer for the customer.

Rules:
1. Be concise and specific in your questions to the Store Agent.
2. Ask at most 2-3 focused questions per turn.
3. Always keep the customer's actual goal in mind.
4. In your final synthesis, be warm, helpful, and actionable.
5. Format your questions to the Store Agent as a numbered list.
"""

CUSTOMER_FINAL_SYSTEM = """\
You are a friendly retail shopping assistant helping a customer at SmartMart.
Based on the conversation between agents, write a clear, warm, and helpful 
final response directly addressing the customer's original request.
Include specific product names, prices, aisles, and any relevant policy info.
Be concise (3-5 sentences max) and end with a helpful next step.
"""


def analyse_request(customer_request: str) -> str:
    """
    Customer Agent Step 1: Analyse the customer's request and formulate
    questions for the Store Agent.
    """
    prompt = f"""\
A customer has made the following request at our SmartMart store:

"{customer_request}"

As the Customer Agent, analyse this request and write 2-3 specific, 
focused questions to ask the Store Agent so you can help this customer.
Format as a numbered list. Be direct and specific.
"""
    return chat(
        user=prompt,
        system=CUSTOMER_AGENT_SYSTEM,
        max_tokens=300,
        temperature=0.3,
    )


def synthesise_response(
    customer_request: str,
    questions_asked: str,
    store_response: str,
) -> str:
    """
    Customer Agent Step 3: Synthesise the Store Agent's answers into
    a final response for the customer.
    """
    prompt = f"""\
Original customer request: "{customer_request}"

Questions the Customer Agent asked the Store Agent:
{questions_asked}

Store Agent's response:
{store_response}

Now write the final helpful response for the customer based on all the above.
"""
    return chat(
        user=prompt,
        system=CUSTOMER_FINAL_SYSTEM,
        max_tokens=400,
        temperature=0.4,
    )
