import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-support',
  imports: [RouterLink, UserMenu],
  templateUrl: './support.html',
  styleUrl: './support.scss',
})
export class Support {

}
