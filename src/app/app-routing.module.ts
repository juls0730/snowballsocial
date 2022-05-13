import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { logincomponent } from './authentication/login/login.component';
import { PostCreateComponent } from './posts/post-create/post-create.component';
import { PostListComponent } from './posts/post-list/post-list.component';
import { signupcomponent } from './authentication/signup/signup.component';
import { AuthGuard } from './authentication/auth.guard';
import { PostShowComponent } from './posts/post-show/post-show.component';
import { UserShowComponent } from './users/user-show/user-show.component';

const routes: Routes = [
  { path: '', component: PostCreateComponent, canActivate:[AuthGuard] },
  { path: '', component: PostListComponent, outlet: 'secondary', pathMatch: 'full', canActivate:[AuthGuard] },
  { path: 'post/:id', component: PostShowComponent, pathMatch: 'full', canActivate:[AuthGuard] },
  { path: 'login', component: logincomponent },
  { path: 'signup', component: signupcomponent },
  { path: 'user/:id', component: UserShowComponent, pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers:[AuthGuard]  
})

export class AppRoutingModule {

}  