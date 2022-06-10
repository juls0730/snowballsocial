import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { logincomponent } from './authentication/login/login.component';
import { PostCreateComponent } from './posts/post-create/post-create.component';
import { PostListComponent } from './posts/post-list/post-list.component';
import { signupcomponent } from './authentication/signup/signup.component';
import { AuthGuard } from './authentication/auth.guard';
import { PostShowComponent } from './posts/post-show/post-show.component';
import { UserShowComponent } from './users/user-show/user-show.component';
import { UserSettingComponent } from './users/user-setting/user-setting.component';
import { ConversationsListComponent } from './conversations/conversations-list/conversations-list.component';
import { ConversationShowComponent } from './conversations/conversation-show/conversation-show.component';

const routes: Routes = [
  { path: '', component: PostCreateComponent, canActivate:[AuthGuard] },
  { path: '', component: PostListComponent, outlet: 'secondary', pathMatch: 'full', canActivate:[AuthGuard] },
  { path: 'post/:id', component: PostShowComponent, pathMatch: 'full' },
  { path: 'login', component: logincomponent },
  { path: 'signup', component: signupcomponent },
  { path: 'user/:id', component: UserShowComponent, pathMatch: 'full' },
  { path: 'settings', component: UserSettingComponent, pathMatch: 'full', canActivate:[AuthGuard] },
  { path: 'messages', component: ConversationsListComponent, pathMatch: 'full', canActivate:[AuthGuard] },
  { path: 'conversations/:id', component: ConversationShowComponent, pathMatch: 'full', canActivate:[AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]  
})

export class AppRoutingModule {

}  