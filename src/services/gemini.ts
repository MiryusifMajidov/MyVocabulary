import { AIMessage, AITeacherContext, Word } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export class GeminiService {
  private async callGemini(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      // Fallback to mock responses for development
      return this.getMockResponse(prompt);
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I cannot generate a response right now.';
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getMockResponse(prompt);
    }
  }

  private getMockResponse(prompt: string): string {
    // Check if this is a conversation continuation by looking for previous messages
    const hasConversationHistory = prompt.includes('CONVERSATION HISTORY:') && prompt.includes('Student:');
    
    if (hasConversationHistory) {
      // Extract the last user message for context
      const lines = prompt.split('\n');
      let lastUserMessage = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith('Student:')) {
          lastUserMessage = lines[i].replace('Student:', '').trim().toLowerCase();
          break;
        }
      }
      
      // Respond based on user's actual message
      if (lastUserMessage.includes('day') || lastUserMessage.includes('today')) {
        return "That sounds interesting! What did you learn today? I'd love to help you practice those new words.";
      } else if (lastUserMessage.includes('learn') || lastUserMessage.includes('english') || lastUserMessage.includes('improve')) {
        return "That's wonderful! Learning English is a great goal. What specific areas would you like to work on - vocabulary, grammar, or conversation?";
      } else if (lastUserMessage.includes('yes') || lastUserMessage.includes('ok') || lastUserMessage.includes('sure')) {
        return "Great! Let's start with some vocabulary. Can you tell me about your hobbies or interests? I'll help you learn new words related to those topics.";
      } else if (lastUserMessage.includes('no') || lastUserMessage.includes('not really')) {
        return "No problem! How about we talk about something else? What are you interested in - sports, movies, music, or travel?";
      } else {
        // Generic contextual response
        return `I see you mentioned "${lastUserMessage.split(' ')[0]}". That's a good topic to practice with! Can you tell me more about it using simple sentences?`;
      }
    } else {
      // Welcome message for new conversations
      const welcomeMessages = [
        "Hello! I'm your AI English teacher. I'm here to help you improve your English through conversation. What would you like to talk about today?",
        "Hi there! Welcome to our English practice session. I'm excited to help you learn! How are you feeling about practicing English today?",
        "Greetings! I'm your personal English tutor. Let's have a friendly conversation to practice your skills. Tell me, what interests you most?"
      ];
      return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    }
  }

  generateSystemPrompt(context: AITeacherContext, username?: string): string {
    const { userLevel, learnedWords, focusWords, conversationGoals } = context;
    
    const learnedWordsText = learnedWords.slice(0, 20).map(w => w.english || w.word).join(', ');
    const focusWordsText = focusWords.slice(0, 10).join(', ');
    const goals = conversationGoals.length > 0 ? conversationGoals.join(', ') : 'general English practice';
    const studentName = username || 'Student';

    return `You are an AI English teacher helping ${studentName}, a ${userLevel} level student, improve their English.

STUDENT PROFILE:
- Name: ${studentName}
- Level: ${userLevel}
- Words already learned: ${learnedWordsText}
- Current focus words: ${focusWordsText}
- Learning goals: ${goals}
- Total learned words: ${learnedWords.length}

TEACHING INSTRUCTIONS:
1. Address the student by their name (${studentName}) occasionally to make it personal
2. Use simple, clear language appropriate for ${userLevel} level
3. Frequently incorporate the words they've already learned: ${learnedWordsText}
4. Emphasize these focus words in conversations: ${focusWordsText}
5. Gently correct mistakes and explain why
6. Ask engaging questions to keep the conversation flowing
7. Suggest 1-2 new words per message when appropriate
8. Be encouraging and supportive about their progress
9. Reference their learned vocabulary to build confidence
10. Make learning fun and interactive

CONVERSATION STYLE:
- Be friendly, patient, and encouraging
- Use examples and context for new words
- Ask follow-up questions
- Praise good usage and progress
- Keep responses concise (2-4 sentences max)
- Celebrate their achievements (${learnedWords.length} words learned!)

Remember: Your goal is to help ${studentName} practice English naturally while reinforcing their learned vocabulary and building their confidence.`;
  }

  async generateResponse(
    messages: AIMessage[],
    context: AITeacherContext,
    username?: string
  ): Promise<{ content: string; usedWords: string[]; suggestedWords: Word[]; difficulty: number }> {
    const systemPrompt = this.generateSystemPrompt(context, username);
    const conversationHistory = messages.slice(-6).map(msg => 
      `${msg.sender === 'user' ? 'Student' : 'Teacher'}: ${msg.content}`
    ).join('\n');

    const prompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

Please respond as the AI teacher. After your response, on new lines, add:
USED_WORDS: [list the learned words you used in your response]
SUGGESTED_WORDS: [list 1-2 new words with meanings, if any]
DIFFICULTY: [rate 1-10 how complex your response was]`;

    const fullResponse = await this.callGemini(prompt);
    
    // Parse the response to extract metadata
    const lines = fullResponse.split('\n');
    let content = '';
    let usedWords: string[] = [];
    let suggestedWords: Word[] = [];
    let difficulty = 3; // default

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('USED_WORDS:')) {
        const wordsText = line.replace('USED_WORDS:', '').trim();
        usedWords = wordsText.split(',').map(w => w.trim()).filter(w => w);
      } else if (line.startsWith('SUGGESTED_WORDS:')) {
        const wordsText = line.replace('SUGGESTED_WORDS:', '').trim();
        // Parse suggested words (format: "word: meaning")
        const wordPairs = wordsText.split(',');
        suggestedWords = wordPairs.map(pair => {
          const [word, meaning] = pair.split(':').map(s => s.trim());
          if (word && meaning) {
            return {
              id: `suggested_${Date.now()}_${Math.random()}`,
              english: word,
              meaning: meaning,
            };
          }
          return null;
        }).filter(Boolean) as Word[];
      } else if (line.startsWith('DIFFICULTY:')) {
        const diffText = line.replace('DIFFICULTY:', '').trim();
        const parsedDiff = parseInt(diffText);
        if (!isNaN(parsedDiff) && parsedDiff >= 1 && parsedDiff <= 10) {
          difficulty = parsedDiff;
        }
      } else if (!line.startsWith('USED_WORDS:') && !line.startsWith('SUGGESTED_WORDS:') && !line.startsWith('DIFFICULTY:')) {
        content += line + '\n';
      }
    }

    return {
      content: content.trim() || fullResponse,
      usedWords,
      suggestedWords,
      difficulty
    };
  }

  async generateConversationTitle(messages: AIMessage[]): Promise<string> {
    if (messages.length === 0) return 'New Conversation';
    
    const firstFewMessages = messages.slice(0, 3).map(m => m.content).join(' ');
    const prompt = `Based on this conversation start: "${firstFewMessages}"
    
Generate a short, descriptive title (3-5 words) for this English learning conversation.
Examples: "Daily Routine Practice", "Food Vocabulary Chat", "Travel Experience Discussion"
    
Title:`;

    const response = await this.callGemini(prompt);
    return response.trim().replace(/^Title:\s*/, '') || 'English Practice';
  }
}

export const geminiService = new GeminiService();