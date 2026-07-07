import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-sector-selection',
  imports: [RouterLink, UserMenu],
  templateUrl: './sector-selection.html',
  styleUrl: './sector-selection.scss',
})
export class SectorSelection {

}
