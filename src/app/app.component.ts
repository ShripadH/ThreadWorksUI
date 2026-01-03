import { Component } from '@angular/core';
import { MenuComponent } from './shared/menu/menu/menu.component';
import { SHARED_IMPORTS } from './shared/shared.imports';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [MenuComponent, SHARED_IMPORTS],
})
export class AppComponent {
  constructor() {
  }
}
