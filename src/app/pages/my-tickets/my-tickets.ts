import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-my-tickets',
  imports: [RouterLink, UserMenu],
  templateUrl: './my-tickets.html',
  styleUrl: './my-tickets.scss',
})
export class MyTickets {

}
