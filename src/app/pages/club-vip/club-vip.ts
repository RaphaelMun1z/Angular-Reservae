import { Component } from '@angular/core';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';

@Component({
  selector: 'app-club-vip',
  imports: [SiteNavbar, SiteFooter],
  templateUrl: './club-vip.html',
  styleUrl: './club-vip.scss',
})
export class ClubVip {

}
