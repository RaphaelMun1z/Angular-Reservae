import { Component } from '@angular/core';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';

@Component({
  selector: 'app-support',
  imports: [SiteNavbar, SiteFooter],
  templateUrl: './support.html',
  styleUrl: './support.scss',
})
export class Support {

}
