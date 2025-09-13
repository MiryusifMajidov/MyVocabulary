import { AIMessage, AITeacherContext, Word } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Free AI alternatives if Gemini doesn't work
const FREE_AI_ENDPOINTS = [
  'https://api.openai.com/v1/chat/completions', // OpenAI (if user has key)
  'https://api.anthropic.com/v1/messages', // Claude (if user has key)
  'https://api.cohere.ai/v1/generate', // Cohere
  'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large' // HuggingFace
];

export class GeminiService {
  private async callGemini(prompt: string): Promise<string> {
    // First try Gemini
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
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
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 800,
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.candidates[0]?.content?.parts[0]?.text;
          if (result) {
            return result;
          }
        }
      } catch (error) {
        console.warn('Gemini API failed, trying alternatives:', error);
      }
    }

    // Try HuggingFace as free alternative
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 200,
            temperature: 0.8,
            do_sample: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data[0]?.generated_text) {
          return data[0].generated_text.replace(prompt, '').trim();
        }
      }
    } catch (error) {
      console.warn('HuggingFace API failed:', error);
    }

    // Try a simple GPT-style API call (if available)
    try {
      // This could be any free AI service
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}` // User would need to provide
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {"role": "system", "content": "You are a helpful English teacher."},
            {"role": "user", "content": prompt}
          ],
          max_tokens: 300,
          temperature: 0.8
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      }
    } catch (error) {
      console.warn('OpenAI API failed:', error);
    }

    // Last resort - use a completely different approach
    return await this.callLocalLLM(prompt);
  }

  // Try to call any available local or free LLM
  private async callLocalLLM(prompt: string): Promise<string> {
    // Try Ollama (if running locally)
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2', // or any available model
          prompt: prompt,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          return data.response;
        }
      }
    } catch (error) {
      console.warn('Local Ollama not available:', error);
    }

    // Try other free APIs here...

    // If ALL AI services fail, return an error message
    throw new Error('No AI service available. Please configure an API key for Gemini, OpenAI, or install Ollama locally.');
  }

  generateSystemPrompt(context: AITeacherContext, username?: string): string {
    const { userLevel, learnedWords, focusWords } = context;
    const studentName = username || 'Student';

    // Keep it simple but informative
    const learnedWordsText = learnedWords.slice(0, 10).map(w => w.english || w.word).join(', ');
    const focusWordsText = focusWords.slice(0, 5).join(', ');

    return `You are having a natural conversation with ${studentName}, who is learning English at ${userLevel} level.

CONTEXT:
- Student name: ${studentName}
- Level: ${userLevel} 
- Known words: ${learnedWordsText}
- Focus words: ${focusWordsText}

BE NATURAL:
- Respond directly to what they say
- Have a real conversation like friends
- Use simple language for ${userLevel} level
- Include their known words naturally: ${learnedWordsText}
- Keep responses short (2-3 sentences)

RESPOND TO THEIR MESSAGE DIRECTLY. Don't give generic lessons - have a real chat!

After your natural response, add:
USED_WORDS: [known words you used]
SUGGESTED_WORDS: [1 new word: meaning]  
DIFFICULTY: [1-10]`;
  }

  async generateResponse(
      messages: AIMessage[],
      context: AITeacherContext,
      username?: string
  ): Promise<{ content: string; usedWords: string[]; suggestedWords: Word[]; difficulty: number }> {
    const systemPrompt = this.generateSystemPrompt(context, username);

    // Get recent conversation context
    const recentMessages = messages.slice(-4);
    const conversationHistory = recentMessages.map((msg) => {
      const role = msg.sender === 'user' ? `${username || 'Student'}` : 'Teacher';
      return `${role}: ${msg.content}`;
    }).join('\n');

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.sender === 'user').slice(-1)[0];
    const userSaid = lastUserMessage ? lastUserMessage.content : '';

    const prompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

STUDENT'S LATEST MESSAGE: "${userSaid}"

Respond naturally to what the student just said. Have a real conversation about their topic.`;

    try {
      const fullResponse = await this.callGemini(prompt);

      // Parse the AI response
      const lines = fullResponse.split('\n');
      let content = '';
      let usedWords: string[] = [];
      let suggestedWords: Word[] = [];
      let difficulty = this.getDifficultyByLevel(context.userLevel);

      for (const line of lines) {
        if (line.startsWith('USED_WORDS:')) {
          const wordsText = line.replace('USED_WORDS:', '').trim();
          usedWords = wordsText.split(',').map(w => w.trim()).filter(w => w && w !== '');
        } else if (line.startsWith('SUGGESTED_WORDS:')) {
          const wordsText = line.replace('SUGGESTED_WORDS:', '').trim();
          if (wordsText && wordsText !== '') {
            const [word, meaning] = wordsText.split(':').map(s => s.trim());
            if (word && meaning) {
              suggestedWords.push({
                id: `suggested_${Date.now()}_${Math.random()}`,
                english: word,
                meaning: meaning,
              });
            }
          }
        } else if (line.startsWith('DIFFICULTY:')) {
          const diffText = line.replace('DIFFICULTY:', '').trim();
          const parsedDiff = parseInt(diffText);
          if (!isNaN(parsedDiff) && parsedDiff >= 1 && parsedDiff <= 10) {
            difficulty = parsedDiff;
          }
        } else if (!line.includes('USED_WORDS:') && !line.includes('SUGGESTED_WORDS:') && !line.includes('DIFFICULTY:')) {
          if (line.trim()) {
            content += line + '\n';
          }
        }
      }

      return {
        content: content.trim() || this.extractMainContent(fullResponse),
        usedWords,
        suggestedWords,
        difficulty
      };

    } catch (error) {
      // If AI fails completely, show error to user
      console.error('All AI services failed:', error);
      return {
        content: "I'm sorry, I'm having trouble connecting to AI services right now. Please check your API configuration or try again later.",
        usedWords: [],
        suggestedWords: [],
        difficulty: 1
      };
    }
  }

  private getDifficultyByLevel(level: string): number {
    switch (level) {
      case 'beginner': return 2;
      case 'intermediate': return 4;
      case 'advanced': return 6;
      default: return 3;
    }
  }

  private extractMainContent(response: string): string {
    const lines = response.split('\n');
    const mainContent = lines.filter(line =>
        !line.includes('USED_WORDS:') &&
        !line.includes('SUGGESTED_WORDS:') &&
        !line.includes('DIFFICULTY:')
    ).join('\n');

    return mainContent.trim();
  }

  async generateConversationTitle(messages: AIMessage[]): Promise<string> {
    if (messages.length === 0) return 'Yeni Söhbət';

    const recentContent = messages.slice(0, 4).map(m => m.content).join(' ');
    const prompt = `Create a short conversation title (2-4 words) based on: "${recentContent.substring(0, 200)}"
    
Examples: "Daily Life Chat", "Hobbies Discussion", "Work Talk"
    
Title:`;

    try {
      const response = await this.callGemini(prompt);
      return response.trim().replace(/^Title:\s*/, '') || 'English Practice';
    } catch (error) {
      return 'English Practice';
    }
  }
}

export const geminiService = new GeminiService();