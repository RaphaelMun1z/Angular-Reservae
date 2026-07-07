import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, UserMenu],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {

}
