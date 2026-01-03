import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared.imports';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [SHARED_IMPORTS, RouterModule],
})
export class MenuComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
