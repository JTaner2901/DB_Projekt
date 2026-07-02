import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Auth {
  // Platzhalter-Zugangsdaten fürs Testen - später durch echten Login-API-Call ersetzen
  private readonly TEST_USERNAME = 'taner';
  private readonly TEST_PASSWORD = '1234';

  isLoggedIn = signal(false);

  login(username: string, password: string): boolean {
    const success = username === this.TEST_USERNAME && password === this.TEST_PASSWORD;
    if (success) {
      this.isLoggedIn.set(true);
    }
    return success;
  }

  logout(): void {
    this.isLoggedIn.set(false);
  }
}
