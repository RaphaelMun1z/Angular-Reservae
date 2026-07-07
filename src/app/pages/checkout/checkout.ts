import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, UserMenu],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {

}
