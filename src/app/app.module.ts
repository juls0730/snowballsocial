import { HttpClientModule, HttpClientXsrfModule, HttpHeaders, HttpXsrfTokenExtractor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CookieService } from 'ngx-cookie-service';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; import { AppComponent } from './app.component';
import { PostCreateComponent } from './posts/post-create/post-create.component';
import { HeaderComponent } from './header/header.component';
import { PostListComponent } from './posts/post-list/post-list.component';
import { logincomponent } from './authentication/login/login.component';
import { signupcomponent } from './authentication/signup/signup.component';
import { AuthInterceptor } from './authentication/auth-interceptor';
import { ErrorInterceptor } from './error-interceptor';
import { PostShowComponent } from './posts/post-show/post-show.component';
import { UserShowComponent } from './users/user-show/user-show.component';
import { UserSettingComponent } from './users/user-setting/user-setting.component';
import { ConversationsListComponent } from './conversations/conversations-list/conversations-list.component';
import { ConversationShowComponent } from './conversations/conversation-show/conversation-show.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = {
	url: environment.socket_url, // socket server url;
	options: {}
}

@NgModule({
  declarations: [
    AppComponent,
    PostCreateComponent,
    HeaderComponent,
    PostListComponent,
    PostShowComponent,
    UserShowComponent,
    UserSettingComponent,
    ConversationsListComponent,
    ConversationShowComponent,
    logincomponent,
    signupcomponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    SocketIoModule.forRoot(config),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor, multi: true
    },
    CookieService,
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
  entryComponents: []
})
export class AppModule { }
