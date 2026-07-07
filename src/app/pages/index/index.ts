import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-index',
  imports: [RouterLink, UserMenu],
  templateUrl: './index.html',
  styleUrl: './index.scss',
})
export class Index {

}
