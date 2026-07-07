import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';

@Component({
  selector: 'app-gate-scanner',
  imports: [RouterLink, UserMenu],
  templateUrl: './gate-scanner.html',
  styleUrl: './gate-scanner.scss',
})
export class GateScanner {

}
