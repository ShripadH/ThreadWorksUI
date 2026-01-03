import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MenuComponent } from './shared/menu/menu/menu.component';

// @NgModule({
//   declarations: [AppComponent],
//   imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, MenuComponent],
//   providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
//   bootstrap: [AppComponent],
// })
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule],
  
})
export class AppModule {}
