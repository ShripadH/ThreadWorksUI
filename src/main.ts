import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { IonicModule } from '@ionic/angular';
import { AppRoutingModule } from './app/app-routing.module';
import { environment } from './environments/environment';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpLoggingInterceptor } from './app/interceptors/http-logging.interceptor';


if (environment.production) {
  enableProdMode();
}


bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(IonicModule.forRoot(), AppRoutingModule, HttpClientModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpLoggingInterceptor,
      multi: true
    }
  ]
});

