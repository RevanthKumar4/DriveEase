import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

import { ChatbotService } from '../../services/chatbot.service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  time: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements AfterViewChecked {

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLDivElement>;

  isChatOpen = false;
  isLoading = false;
  userMessage = '';
  shouldScrollToBottom = false;

  messages: ChatMessage[] = [
    {
      text: 'Hello! I am your DriveU assistant. Ask me anything related to the DriveU project.',
      sender: 'bot',
      time: this.getCurrentTime()
    }
  ];

  suggestedQuestions: string[] = [
    'What is DriveU?',
    'How can I request a driver?',
    'What can an administrator manage?'
  ];

  constructor(private chatbotService: ChatbotService) {
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;

    if (this.isChatOpen) {
      this.shouldScrollToBottom = true;
    }
  }

  closeChat(): void {
    this.isChatOpen = false;
  }

  updateMessage(event: Event): void {
    const inputElement = event.target as HTMLTextAreaElement;
    this.userMessage = inputElement.value;
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendSuggestedQuestion(question: string): void {
    if (this.isLoading) {
      return;
    }

    this.userMessage = question;
    this.sendMessage();
  }

  sendMessage(): void {
    const trimmedMessage = this.userMessage.trim();

    if (!trimmedMessage || this.isLoading) {
      return;
    }

    this.messages.push({
      text: trimmedMessage,
      sender: 'user',
      time: this.getCurrentTime()
    });

    this.userMessage = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    this.chatbotService.askQuestion(trimmedMessage).subscribe({
      next: (result) => {
        const responseText =
          result && result.response
            ? result.response.trim()
            : 'Unable to get a response from the DriveU assistant.';

        this.messages.push({
          text: responseText,
          sender: 'bot',
          time: this.getCurrentTime()
        });

        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.messages.push({
          text: 'The DriveU assistant is temporarily unavailable. Please try again.',
          sender: 'bot',
          time: this.getCurrentTime()
        });

        this.isLoading = false;
        this.shouldScrollToBottom = true;
      }
    });
  }

  clearChat(): void {
    if (this.isLoading) {
      return;
    }

    this.messages = [
      {
        text: 'Chat cleared. Ask me anything related to the DriveU project.',
        sender: 'bot',
        time: this.getCurrentTime()
      }
    ];

    this.userMessage = '';
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom(): void {
    if (!this.messagesContainer) {
      return;
    }

    const element = this.messagesContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  private getCurrentTime(): string {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
