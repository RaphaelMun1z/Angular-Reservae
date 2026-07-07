import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-shows',
  imports: [RouterLink, UserMenu],
  templateUrl: './shows.html',
  styleUrl: './shows.scss',
})
export class Shows {

}
