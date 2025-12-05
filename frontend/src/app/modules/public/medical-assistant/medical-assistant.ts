import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicalAiService, MedicalResponse, ExampleQuestion } from '../../../core/services/medical-ai';
import { FormatTextPipe } from '../../../shared/pipes/format-text-pipe';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestedActions?: string[];
  id?: string;
}

@Component({
  selector: 'app-medical-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatTextPipe, Header, Footer],
  templateUrl: './medical-assistant.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    @keyframes fade-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-up {
      animation: fade-up 0.6s ease-out forwards;
    }

    .animation-delay-200 {
      animation-delay: 0.2s;
    }

    .animation-delay-400 {
      animation-delay: 0.4s;
    }

    .animation-delay-600 {
      animation-delay: 0.6s;
    }
  `]
})
export class MedicalAssistant implements OnInit, OnDestroy {
  userInput = '';
  messages: ChatMessage[] = [];
  examples: ExampleQuestion[] = [];
  isLoading = false;

  welcomeMessage = `Hello! I'm your AI Medical Assistant. I can help you with:<br><br>
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-[#0C969C] rounded-full"></span>
        <span>Information about medical specializations</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-[#6BA3BE] rounded-full"></span>
        <span>Finding the right doctor for your symptoms</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-[#0A7075] rounded-full"></span>
        <span>General health guidance and recommendations</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-[#032F30] rounded-full"></span>
        <span>Emergency situation detection</span>
      </div>
    </div><br>
    How can I help you today?`;

  private sessionId: string;
  private chatHistory: Map<string, ChatMessage[]> = new Map();
  private questionCache: Map<string, { answer: string; timestamp: Date; suggestedActions?: string[] }> = new Map();

  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;

  constructor(private medicalAiService: MedicalAiService, private cdr: ChangeDetectorRef) {
    this.sessionId = this.generateSessionId();
  }

  ngOnInit() {
    this.loadExamples();
    this.loadChatHistory();
    if (this.messages.length === 0) {
      this.addWelcomeMessage();
    }
    this.scrollToBottom();
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.saveChatHistory();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private loadChatHistory() {
    try {
      const stored = sessionStorage.getItem('medical_assistant_history');
      if (stored) {
        const history = JSON.parse(stored);
        this.messages = history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        this.chatHistory.set(this.sessionId, this.messages);
      }

      // Load question cache
      const cacheStored = sessionStorage.getItem('medical_assistant_cache');
      if (cacheStored) {
        const cache = JSON.parse(cacheStored);
        this.questionCache = new Map(Object.entries(cache));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  private saveChatHistory() {
    try {
      sessionStorage.setItem('medical_assistant_history', JSON.stringify(this.messages));
      sessionStorage.setItem('medical_assistant_cache', JSON.stringify(Object.fromEntries(this.questionCache)));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  private addWelcomeMessage() {
    this.messages.push({
      content: this.welcomeMessage,
      isUser: false,
      timestamp: new Date(),
      suggestedActions: [],
      id: 'welcome_' + Date.now()
    });
  }

  private loadExamples() {
    this.medicalAiService.getExamples().subscribe({
      next: (response) => {
        if (response.success) {
          this.examples = response.examples;
        }
      },
      error: (error) => {
        console.error('Error loading examples:', error);
        // Fallback examples
        this.examples = [
          { question: 'Tell me about Cardiology', description: 'Learn about heart specialists' },
          { question: 'Best doctor for skin rash', description: 'Find dermatology specialists' },
          { question: 'I have a headache, what should I do?', description: 'Get medical advice' },
          { question: 'Recommend a good pediatrician', description: 'Find children\'s doctors' }
        ];
      }
    });
  }

  private findSimilarQuestion(query: string): { answer: string; suggestedActions?: string[] } | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Check cache for similar questions
    for (const [cachedQuery, cachedResponse] of this.questionCache.entries()) {
      const similarity = this.calculateSimilarity(normalizedQuery, cachedQuery.toLowerCase());
      if (similarity > 0.7) { // 70% similarity threshold
        return cachedResponse;
      }
    }

    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  sendMessage() {
    const query = this.userInput.trim();
    if (!query || query.length > 500) return;

    // Check for similar question in cache
    const similarResponse = this.findSimilarQuestion(query);
    if (similarResponse) {
      this.addUserMessage(query);
      this.addBotMessage(similarResponse.answer, similarResponse.suggestedActions);
      this.userInput = '';
      this.scrollToBottom();
      this.cdr.detectChanges();
      return;
    }

    // Add user message
    this.addUserMessage(query);
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    // Send to AI service
    this.medicalAiService.ask(query).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        if (response.success && response.data) {
          const answer = response.data.answer;
          const suggestedActions = response.data.suggested_actions || [];

          // Cache the response
          this.questionCache.set(query, {
            answer,
            suggestedActions,
            timestamp: new Date()
          });

          this.addBotMessage(answer, suggestedActions);
        } else {
          this.addBotMessage('Sorry, I encountered an error processing your request. Please try again.');
        }

        this.saveChatHistory();
        this.scrollToBottom();

        // Trigger change detection to update the view
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Medical AI Error:', error);

        // Provide more specific error messages based on error type
        let errorMessage = 'Sorry, there was an error connecting to the medical assistant. Please try again later.';
        if (error.status === 500) {
          errorMessage = 'The medical assistant is temporarily unavailable. Please try again in a few moments.';
        } else if (error.status === 0) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        }

        this.addBotMessage(errorMessage);
        this.scrollToBottom();

        // Trigger change detection to update the view
        this.cdr.detectChanges();
      }
    });
  }

  private addUserMessage(content: string) {
    this.messages.push({
      content,
      isUser: true,
      timestamp: new Date(),
      suggestedActions: [],
      id: 'user_' + Date.now()
    });
  }

  private addBotMessage(content: string, suggestedActions: string[] = []) {
    this.messages.push({
      content,
      isUser: false,
      timestamp: new Date(),
      suggestedActions,
      id: 'bot_' + Date.now()
    });
  }

  useExample(question: string) {
    this.userInput = question;
    this.cdr.detectChanges(); // Update input field immediately
    setTimeout(() => this.sendMessage(), 100);
  }

  performAction(action: string) {
    // Handle suggested actions
    if (action.toLowerCase().includes('book') || action.toLowerCase().includes('appointment')) {
      // Navigate to booking page (implement later)
      console.log('Navigate to booking page');
    } else if (action.toLowerCase().includes('view') || action.toLowerCase().includes('profile')) {
      // Navigate to doctor profile (implement later)
      console.log('Navigate to doctor profile');
    } else {
      // Use the action as a new query
      this.userInput = action;
      this.sendMessage();
    }
  }

  autoResize(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  trackByMessage(index: number, message: ChatMessage): string {
    return message.id || index.toString();
  }
}
