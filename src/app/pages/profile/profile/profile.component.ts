import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [SHARED_IMPORTS],
})
export class ProfileComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
