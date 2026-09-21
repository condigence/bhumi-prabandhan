import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth/auth';

type Step = 'mobile' | 'otp';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly step = signal<Step>('mobile');
  readonly mobile = signal('');
  readonly otp = signal('');
  readonly errorMessage = signal('');

  sendOtp(): void {
    this.errorMessage.set('');
    if (!this.auth.requestOtp(this.mobile())) {
      this.errorMessage.set('Enter a valid 10-digit mobile number.');
      return;
    }
    this.step.set('otp');
  }

  verifyOtp(): void {
    this.errorMessage.set('');
    if (!this.auth.verifyOtp(this.mobile(), this.otp())) {
      this.errorMessage.set('Invalid OTP. Please try again.');
      return;
    }
    this.router.navigateByUrl('/home');
  }

  changeNumber(): void {
    this.step.set('mobile');
    this.otp.set('');
    this.errorMessage.set('');
  }
}
