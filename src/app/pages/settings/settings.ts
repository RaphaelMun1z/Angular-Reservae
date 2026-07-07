import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-settings',
  imports: [RouterLink, UserMenu],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {

}
