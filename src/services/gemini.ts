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
    const responses = [
      "Hello! I'm your AI English teacher. Let's practice together! Can you tell me about your day?",
      "That's great! I noticed you used some words we've been learning. Let me help you with pronunciation and usage.",
      "Excellent! Let's try using the word 'beautiful' in a sentence. Can you describe something beautiful you saw today?",
      "Perfect! You're making great progress. Let me suggest a new word: 'magnificent' - it means very beautiful or impressive.",
      "Well done! I can see you're understanding these concepts well. Would you like to practice with some new vocabulary?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateSystemPrompt(context: AITeacherContext): string {
    const { userLevel, learnedWords, focusWords, conversationGoals } = context;
    
    const learnedWordsText = learnedWords.slice(0, 20).map(w => w.english || w.word).join(', ');
    const focusWordsText = focusWords.slice(0, 10).join(', ');
    const goals = conversationGoals.length > 0 ? conversationGoals.join(', ') : 'general English practice';

    return `You are an AI English teacher helping a ${userLevel} level student improve their English.

STUDENT CONTEXT:
- Level: ${userLevel}
- Recently learned words: ${learnedWordsText}
- Focus on using these words: ${focusWordsText}
- Learning goals: ${goals}

TEACHING INSTRUCTIONS:
1. Use simple, clear language appropriate for ${userLevel} level
2. Frequently use the words the student has learned: ${learnedWordsText}
3. Emphasize these focus words in conversations: ${focusWordsText}
4. Gently correct mistakes and explain why
5. Ask engaging questions to keep the conversation flowing
6. Suggest 1-2 new words per message when appropriate
7. Be encouraging and supportive
8. Make learning fun and interactive

CONVERSATION STYLE:
- Be friendly and patient
- Use examples and context for new words
- Ask follow-up questions
- Praise good usage
- Keep responses concise (2-4 sentences max)

Remember: Your goal is to help the student practice English naturally while reinforcing their learned vocabulary.`;
  }

  async generateResponse(
    messages: AIMessage[],
    context: AITeacherContext
  ): Promise<{ content: string; usedWords: string[]; suggestedWords: Word[]; difficulty: number }> {
    const systemPrompt = this.generateSystemPrompt(context);
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