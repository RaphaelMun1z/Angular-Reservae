import { Component } from '@angular/core';
import { SiteFooter } from '../../../../layouts/site-footer/site-footer';
import { SiteNavbar } from '../../../../layouts/site-navbar/site-navbar';

@Component({
  selector: 'app-club-vip',
  imports: [SiteNavbar, SiteFooter],
  templateUrl: './club-vip.html',
  styleUrl: './club-vip.scss',
})
export class ClubVip {

}
