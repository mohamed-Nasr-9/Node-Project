import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: false,
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy {
  isOpen = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(private chatbotService: ChatbotService) {
    // Add welcome message
    this.messages.push({
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const userMessage = this.currentMessage.trim();
    this.currentMessage = '';

    // Add user message to chat
    this.messages.push({
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    });

    // Show loading state
    this.isLoading = true;

    // Send message to API
    this.chatbotService.sendMessage(userMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Add bot response to chat
          this.messages.push({
            text: response.reply || 'Sorry, I could not process your request.',
            isUser: false,
            timestamp: new Date()
          });
          this.isLoading = false;
          // Scroll to bottom after message
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Chatbot error:', error);
          this.messages.push({
            text: 'Sorry, I encountered an error. Please try again later.',
            isUser: false,
            timestamp: new Date()
          });
          this.isLoading = false;
          setTimeout(() => this.scrollToBottom(), 100);
        }
      });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
}

