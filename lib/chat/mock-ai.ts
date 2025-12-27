/**
 * Mock AI response generator.
 * Simulates AI thinking time and returns contextual responses.
 * Replace this with actual LangChain integration later.
 */

const MOCK_RESPONSES = [
  "That's an interesting question! Let me think about that...",
  "I understand what you're asking. Here's my perspective:",
  "Great point! Here's what I think:",
  "That's a thoughtful observation. Let me elaborate:",
]

/**
 * Generates a mock AI response with simulated thinking delay.
 */
export async function generateMockResponse(userMessage: string): Promise<string> {
  // Simulate AI thinking time (500-1500ms)
  const thinkingTime = 500 + Math.random() * 1000
  await new Promise(resolve => setTimeout(resolve, thinkingTime))

  // Pick a random response opener
  const opener = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]

  // Generate contextual response
  return `${opener}

I received your message: "${userMessage}"

This is a mock AI response for development purposes. In the future, this will be powered by a real language model using LangChain.

Some things I could help you with:
- Creating flashcards from your notes
- Explaining complex topics in simple terms
- Generating quiz questions
- Suggesting study strategies

Feel free to ask me anything!`
}
