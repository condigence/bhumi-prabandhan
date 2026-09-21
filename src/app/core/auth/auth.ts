import { Service, signal } from '@angular/core';

const STORAGE_KEY = 'bhumi_auth_mobile';
const HARDCODED_OTP = '123456';

@Service()
export class Auth {
  private readonly mobileSignal = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  readonly isLoggedIn = signal<boolean>(!!localStorage.getItem(STORAGE_KEY));
  readonly mobileNumber = this.mobileSignal.asReadonly();

  requestOtp(mobile: string): boolean {
    return /^[6-9]\d{9}$/.test(mobile);
  }

  verifyOtp(mobile: string, otp: string): boolean {
    if (otp !== HARDCODED_OTP) {
      return false;
    }
    localStorage.setItem(STORAGE_KEY, mobile);
    this.mobileSignal.set(mobile);
    this.isLoggedIn.set(true);
    return true;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.mobileSignal.set(null);
    this.isLoggedIn.set(false);
  }
}
