import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Discount } from './components/discount/discount';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule, MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { M } from '@angular/cdk/keycodes';



@NgModule({
  declarations: [
    Header,
    Footer,
    Discount,
    ChatbotComponent
  ],
  imports: [
    CommonModule,
    MatIcon,
    MatBadgeModule,
    MatButtonModule,
    RouterModule,
    MatIconModule,
    FormsModule,
    MatSnackBarModule
],
   exports: [Header, Footer, Discount, ChatbotComponent]  
})
export class CoreModule { }
