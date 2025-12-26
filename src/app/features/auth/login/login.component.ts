import { Component, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

type Step = 'email' | 'code' | 'success';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  @ViewChild('emailInput') emailInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('codeInput0') codeInput0Ref!: ElementRef<HTMLInputElement>;

  step = signal<Step>('email');
  email = signal('');
  code: string[] = ['', '', '', '', '', ''];
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  handleEmailSubmit(event: Event) {
    event.preventDefault();
    const emailValue = this.email();

    if (!emailValue) {
      this.errorMessage.set('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      this.errorMessage.set('Please enter a valid email');
      return;
    }

    this.errorMessage.set(null);
    this.step.set('code');

    setTimeout(() => {
      this.codeInput0Ref?.nativeElement.focus();
    }, 500);
  }

  handleCodeChange(index: number, value: string, inputEl: HTMLInputElement) {
    if (value.length <= 1) {
      this.code[index] = value;

      if (value && index < 5) {
        const nextInput = document.getElementById(`code-input-${index + 1}`) as HTMLInputElement;
        nextInput?.focus();
      }

      if (index === 5 && value) {
        const isComplete = this.code.every(digit => digit.length === 1);
        if (isComplete) {
          this.handleCodeSubmit();
        }
      }
    }
  }

  handleCodeKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  }

  async handleCodeSubmit() {
    const verificationCode = this.code.join('');

    if (verificationCode.length !== 6) {
      this.errorMessage.set('Please enter complete 6-digit code');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // Call AuthService to login
      await this.authService.loginWithEmail(this.email(), verificationCode);

      // Show success step
      this.step.set('success');

      // Navigate to dashboard after showing success
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);

    } catch (error: any) {
      this.isLoading.set(false);
      this.errorMessage.set(error.message || 'Invalid verification code. Please try again.');
    }
  }

  handleBack() {
    if (this.step() === 'code') {
      this.step.set('email');
      this.code = ['', '', '', '', '', ''];
      this.errorMessage.set(null);

      setTimeout(() => {
        this.emailInputRef?.nativeElement.focus();
      }, 100);
    }
  }

  async handleGoogleLogin() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.loginWithGoogle();
      // OAuth will redirect to callback URL
      // No need to navigate manually
    } catch (error: any) {
      this.isLoading.set(false);
      this.errorMessage.set(error.message || 'Google login failed. Please try again.');
    }
  }
}
