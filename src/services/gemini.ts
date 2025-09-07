import { AIMessage, AITeacherContext, Word } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export class GeminiService {
  private async callGemini(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      // Fallback to enhanced mock responses for development
      return this.getEnhancedMockResponse(prompt);
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
      return this.getEnhancedMockResponse(prompt);
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
    
    // Enhanced conversation history - include more context and conversation flow
    const allMessages = messages.slice(-12); // Include more messages for better context
    const conversationHistory = allMessages.map((msg, index) => {
      const role = msg.sender === 'user' ? 'Student' : 'Teacher';
      const timestamp = msg.timestamp ? ` (${msg.timestamp.toLocaleTimeString()})` : '';
      return `${role}${timestamp}: ${msg.content}`;
    }).join('\n');

    // Add conversation analysis for better context understanding
    const lastUserMessages = messages.filter(m => m.sender === 'user').slice(-3);
    const conversationTopic = this.extractConversationTopic(allMessages);
    const studentProgress = this.analyzeStudentProgress(messages);

    const prompt = `${systemPrompt}

CONVERSATION ANALYSIS:
- Topic: ${conversationTopic}
- Student recent messages: ${lastUserMessages.map(m => m.content).join(' | ')}
- Progress: ${studentProgress}

FULL CONVERSATION HISTORY:
${conversationHistory}

IMPORTANT INSTRUCTIONS:
1. Read and understand the ENTIRE conversation history above
2. Remember what you and the student discussed previously
3. Build upon previous topics and conversations
4. If student asks follow-up questions, refer to earlier messages
5. Maintain conversation flow and continuity
6. Don't repeat welcome messages if you're already in conversation

Please respond as the AI teacher, keeping conversation context in mind. After your response, on new lines, add:
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

  // Helper method to extract conversation topic
  private extractConversationTopic(messages: AIMessage[]): string {
    if (messages.length === 0) return 'General conversation';
    
    const recentMessages = messages.slice(-6).map(m => m.content.toLowerCase()).join(' ');
    
    // Common topic keywords
    if (recentMessages.includes('food') || recentMessages.includes('eat') || recentMessages.includes('cooking')) {
      return 'Food and cooking';
    } else if (recentMessages.includes('travel') || recentMessages.includes('trip') || recentMessages.includes('visit')) {
      return 'Travel experiences';
    } else if (recentMessages.includes('work') || recentMessages.includes('job') || recentMessages.includes('career')) {
      return 'Work and career';
    } else if (recentMessages.includes('hobby') || recentMessages.includes('free time') || recentMessages.includes('interest')) {
      return 'Hobbies and interests';
    } else if (recentMessages.includes('family') || recentMessages.includes('friend') || recentMessages.includes('people')) {
      return 'Family and relationships';
    } else if (recentMessages.includes('learn') || recentMessages.includes('study') || recentMessages.includes('school')) {
      return 'Learning and education';
    } else {
      return 'General conversation';
    }
  }

  // Helper method to analyze student progress
  private analyzeStudentProgress(messages: AIMessage[]): string {
    const userMessages = messages.filter(m => m.sender === 'user');
    
    if (userMessages.length === 0) return 'New conversation';
    if (userMessages.length < 3) return 'Just started';
    if (userMessages.length < 6) return 'Getting familiar';
    
    // Check message complexity
    const averageWordCount = userMessages.reduce((sum, msg) => 
      sum + msg.content.split(' ').length, 0) / userMessages.length;
    
    if (averageWordCount > 15) return 'Advanced responses';
    if (averageWordCount > 8) return 'Improving fluency';
    return 'Building vocabulary';
  }

  // Natural conversational AI response like ChatGPT
  private getEnhancedMockResponse(prompt: string): string {
    console.log('🤖 Generating natural conversational response...');
    
    // Extract conversation history
    const historyMatch = prompt.match(/FULL CONVERSATION HISTORY:\s*([\s\S]*?)\s*IMPORTANT INSTRUCTIONS:/);
    const conversationHistory = historyMatch ? historyMatch[1].trim() : '';
    
    console.log('🤖 Conversation context:', conversationHistory.substring(0, 200));
    
    if (!conversationHistory) {
      // Natural welcome message
      return "Hi there! I'm here to help you practice English. What's on your mind today?\n\nUSED_WORDS: \nSUGGESTED_WORDS: practice: work on improving, mind: thoughts\nDIFFICULTY: 2";
    }
    
    // Parse the last user message
    const lines = conversationHistory.split('\n');
    let allUserMessages = [];
    let allTeacherMessages = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('Student')) {
        const message = trimmedLine.replace(/^Student.*?:\s*/, '');
        allUserMessages.push(message);
      } else if (trimmedLine.startsWith('Teacher')) {
        const message = trimmedLine.replace(/^Teacher.*?:\s*/, '');
        allTeacherMessages.push(message);
      }
    }
    
    // Get the most recent user message
    const lastMessage = allUserMessages.length > 0 ? allUserMessages[allUserMessages.length - 1].toLowerCase() : '';
    
    console.log('🤖 User said:', lastMessage);
    console.log('🤖 Conversation length:', allUserMessages.length, 'messages');
    
    // Natural conversational responses based on what user actually said
    
    // Greeting responses
    if (lastMessage.includes('hi') || lastMessage.includes('hello') || lastMessage.includes('hey')) {
      if (lastMessage.includes('how are you') || lastMessage.includes('how are you doing')) {
        return "Hi! I'm doing great, thank you for asking! It's nice to meet you. How has your day been so far?\n\nUSED_WORDS: great, meet\nSUGGESTED_WORDS: wonderful: very good, pleasant: nice and enjoyable\nDIFFICULTY: 2";
      } else {
        return "Hello! Nice to meet you! I'm excited to chat with you today. What brings you here?\n\nUSED_WORDS: excited, chat\nSUGGESTED_WORDS: brings: causes to come, conversation: talking together\nDIFFICULTY: 2";
      }
    }
    
    // Experience/personal questions
    if (lastMessage.includes('experience') && allUserMessages.length > 1) {
      return "That's a great topic! Everyone has different experiences that shape who they are. What kind of experience are you thinking about? Something recent or from your past?\n\nUSED_WORDS: great, recent\nSUGGESTED_WORDS: shape: influence and form, reflect: think carefully about\nDIFFICULTY: 3";
    }
    
    // Learning/English related
    if (lastMessage.includes('learn') || lastMessage.includes('english') || lastMessage.includes('language')) {
      return "That's awesome that you're working on your English! What's your biggest challenge with the language? Grammar, vocabulary, speaking, or maybe pronunciation?\n\nUSED_WORDS: awesome, challenge\nSUGGESTED_WORDS: pronunciation: how words sound, fluency: speaking smoothly\nDIFFICULTY: 3";
    }
    
    // Work/job related
    if (lastMessage.includes('work') || lastMessage.includes('job') || lastMessage.includes('career')) {
      return "Work is such a big part of life, isn't it? What do you do for work? And more importantly - do you enjoy it?\n\nUSED_WORDS: enjoy, important\nSUGGESTED_WORDS: fulfilling: satisfying and meaningful, passionate: very interested\nDIFFICULTY: 3";
    }
    
    // Hobbies/interests
    if (lastMessage.includes('hobby') || lastMessage.includes('hobbies') || lastMessage.includes('interest')) {
      return "I love talking about hobbies! They tell us so much about a person. What do you like to do in your free time?\n\nUSED_WORDS: love, person\nSUGGESTED_WORDS: passion: strong interest, leisure: free time activities\nDIFFICULTY: 3";
    }
    
    // Travel related
    if (lastMessage.includes('travel') || lastMessage.includes('trip') || lastMessage.includes('vacation')) {
      return "Oh, travel! That's one of my favorite topics. There's something magical about exploring new places. Where's the most interesting place you've been?\n\nUSED_WORDS: favorite, magical, exploring\nSUGGESTED_WORDS: adventure: exciting journey, culture: way of life\nDIFFICULTY: 4";
    }
    
    // Daily life/routine
    if (lastMessage.includes('day') || lastMessage.includes('daily') || lastMessage.includes('routine') || lastMessage.includes('today')) {
      return "I'm curious about your day! Everyone has such different routines. What does a typical day look like for you?\n\nUSED_WORDS: curious, typical, different\nSUGGESTED_WORDS: routine: regular daily activities, schedule: planned timetable\nDIFFICULTY: 3";
    }
    
    // Generic but natural responses based on conversation length
    if (allUserMessages.length <= 2) {
      return "I'm really enjoying our conversation! Tell me more about yourself - what makes you tick?\n\nUSED_WORDS: enjoying, conversation\nSUGGESTED_WORDS: personality: who you are, interests: things you like\nDIFFICULTY: 3";
    } else {
      // Extract a meaningful word from their message
      const meaningfulWords = lastMessage.split(' ').filter(w => w.length > 3 && !['that', 'with', 'this', 'have', 'been', 'were'].includes(w));
      const focusWord = meaningfulWords[0] || 'that';
      
      return `That's really interesting! I can tell you have thoughts about ${focusWord}. Can you share more? I'd love to understand your perspective better.\n\nUSED_WORDS: thoughts, perspective, understand\nSUGGESTED_WORDS: opinion: what you think, viewpoint: way of seeing things\nDIFFICULTY: 4`;
    }
  }
}

export const geminiService = new GeminiService();