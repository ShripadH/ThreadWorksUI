import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { OrderListComponent } from './order-list/order-list.component';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  standalone: true,
  imports: [SHARED_IMPORTS, OrderListComponent],
})
export class OrderComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
