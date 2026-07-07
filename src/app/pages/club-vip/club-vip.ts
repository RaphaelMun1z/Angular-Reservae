import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-club-vip',
  imports: [RouterLink, UserMenu],
  templateUrl: './club-vip.html',
  styleUrl: './club-vip.scss',
})
export class ClubVip {

}
