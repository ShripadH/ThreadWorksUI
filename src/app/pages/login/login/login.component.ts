import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class LoginComponent  implements OnInit {
  loading = false;
  error: string | null = null;

  constructor() { }

  ngOnInit() {}

  onGoogleLogin() {
    this.loading = true;
    this.error = null;
    // TODO: Integrate Google login here (e.g., Firebase Auth, angularx-social-login, or custom)
    // After successful login, get the Google ID token and call your backend:
    // this.http.post('/api/auth/google', { idToken: googleIdToken })
    //   .subscribe({
    //     next: (user) => {
    //       // If user profile incomplete, navigate to profile form
    //     },
    //     error: (err) => {
    //       this.error = err.error || 'Login failed';
    //       this.loading = false;
    //     }
    //   });
    setTimeout(() => {
      this.loading = false;
      this.error = 'Google login integration not implemented.';
    }, 1500);
  }
}
