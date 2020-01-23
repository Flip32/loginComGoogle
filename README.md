<h1 align="center">
Login com Google Ionic 4 e Firebase
</h1>


<h4 align="center"> O conteúdo do projeto foi feito em cima de informações encontradas na internet.</h4>

<h4 align="center"> Esse conteúdo tem o único propósito servir de guia para mim e a quem interessar para criar uma aplicação em Ionic 4 e Firebase com Login utilizando Google plus. </h4>

<h4 align="center"> Também é utilizado acesso restrito com <span style="font-weight: bolder"> CanActivate </span>. </h4> 

## Pré Requisitos
<h4> 
<p> Ter Node </p>    
<p> Ter Ionic e Cordova  </p>
    
    npm install -g ionic cordova
    
<p> Ter conta no Firebase </p> 
<p> Liberar no Firebase a autenticação com Google. </p>

</h4>

## Começando
<p style="font-weight: bold"> Crie o projeto Ionic com id </p>

    ionic start nomeProjeto blank --id=com.app.nomeProjeto
    
<p> Caso esteja num projeto já em andamento e não adicionou id. Basta ir em Config.xml e mudar manualmente. Algo como => widget id="com.app.nomeProjeto" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0"
</p>

<p style="font-weight: bold"> No console do projeto instale o firebase </p>

 	npm install firebase @angular/fire --save

<p> Agora vá até o Firebase em seu projeto e adicione os aplicativos ios e android. </p>

<p> Configurações > adicionar aplicativo/ ios > em 'Código do pacote do IOS' escreva: o seu domínio ao contrário
<p style="font-style: italic">ex.: com.app.nomeDoProjeto. </p>
<p> Não é obrigatório ter o domínio registrado para funcionar. </p>
&nbsp;&nbsp;&nbsp;
<p style="font-weight: bold">Faça a mesma coisa para adicionar o Android, porém é necessário preencher a SHA-1, para isso vá no console do projeto:</p>

	keytool -exportcert -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore

<p> A senha inicial é 'android' </p>
<p style="font-weight: bold">Copie e cole no firebase e clique em registrar app.</p>

## Adicionar o google plus

<p style="font-weight: bold">Também é necessário adicionar o plugin do cordova para o gplus. Criado por 
<a href="https://twitter.com/eddyverbruggen">  Eddy Verbruggen</a>. </p>

	npm install --save @ionic-native/google-plus@beta
	
	ionic cordova plugin add cordova-plugin-googleplus --save --variable REVERSED_CLIENT_ID=YOUR_REVERSE_CLIENT_ID

	
<p>Sua REVERSED_CLIENT_ID só é necessaria para ios. Pode encontrá-la no GoogleService-Info.plist </p>
<p> Deve possuir o seguinte esquema:  
<span style="font-weight: bolder"> com.googleusercontent.apps.uniqueId </span>
</p>


<p> Adicione agora, no firebase, o app da Web, para usarmos o Database e salvar os usuários INSERIR IMAGEM AQUI!! </p> 

<p style="font-weight: bold">Copie a firebaseConfig, do seu projeto no Firebase Console, e cole em 
<span style="font-style: italic"> environments.ts </span>, no seu projeto. OBS: Não se esqueça de trocar o " = " por " : "  </p>

    export const environment = {
    production: false,
    firebaseConfig : {
        apiKey: "sua api key",
        authDomain: "tutoriallogin-b787e.firebaseapp.com",
        databaseURL: "https://tutoriallogin-b787e.firebaseio.com",
        projectId: "tutoriallogin-b787e",
        storageBucket: "",
        messagingSenderId: "274302836228",
        appId: "1:274302836228:web:b5677c248ec2d870"
    }
    };

## Crie um banco de dados
<p>  No menu esquerdo do console do Firebase, clique em Database. E depois em Criar banco de dados. </p> 
<p> Deixe em modo Teste (Se desejar depois mude as configurações de segurança, aconselhavel) </p>
<p> Dentro da pasta do projeto, no console: </p>

<h4> Crie um serviço </h4>

	ionic g service services/auth

<h4> Crie um guard no serviço </h4>

	ionic g guard services/auth

<h4> Crie Pagina de login </h4>

	ionic g page login

<h4> Crie Interface do usuário </h4>
<p> Na pasta services, adicione um arquivo 
<span style="font-style: italic"> user.model.ts </span> </p>

    export interface User {
        uid: string;
     email: string;
        photoURL?: string;
        displayName?: string;
        somethingCustom?: string;
    }


<h4> Agora vá em 
 <span style="font-style: italic"> app.module.ts </span>  e import, algo do tipo: </h4>


    import { AngularFirestoreModule } from '@angular/fire/firestore';
    import { AngularFireAuthModule } from '@angular/fire/auth';
    import {environment} from '../environments/environment';
    import { AngularFireModule } from '@angular/fire';
    import { GooglePlus } from '@ionic-native/google-plus/ngx';  (Não esquecer do ngx se tiver usando verão mais recente)


    imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule,AngularFireModule.initializeApp(environment.firebaseConfig), AngularFirestoreModule, AngularFireAuthModule]

    providers: [
        StatusBar,
     SplashScreen,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
         GooglePlus      

    ],

<h4> Em 
 <span style="font-style: italic"> app-routing.module.ts </span></h4>
<p> Mude a pagina inicial para login </p>

	const routes: Routes = [
  	{ path: '', redirectTo: 'login', pathMatch: 'full' },
 	 { path: 'home', loadChildren: './home/home.module#HomePageModule' },
	  { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
	];


<h4> E no serviço <span style="font-style: italic"> auth.service.ts </span> </h4>

    import { Injectable } from '@angular/core';
    import { Router } from '@angular/router';

    import { auth } from 'firebase/app';
    import { AngularFireAuth } from '@angular/fire/auth';
    import { AngularFirestore, AngularFirestoreDocument} from "@angular/fire/firestore";

    import { Observable, of } from 'rxjs';
    import {switchMap} from 'rxjs/operators';
    import { User } from './user.model';
    import { GooglePlus } from '@ionic-native/google-plus/ngx';
    import * as firebase from 'firebase';
    import { environment } from '../../environments/environment';
    import { LoadingController, Platform } from '@ionic/angular';


    @Injectable({
    providedIn: 'root'
    })
    export class AuthService {
    user$: Observable<User>;

    constructor(
        private afAuth: AngularFireAuth,
        private afs: AngularFirestore,
        private router: Router,
        private gplus: GooglePlus,
        private platform: Platform,
        private loadingController: LoadingController
    ) {
        this.user$ = this.afAuth.authState.pipe(
            switchMap (user => {
            if (user) {
                return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
            } else {
                return of(null);
            }
            })
        )
    }

    async googleSigninCordova() {
        const loading = await this.loadingController.create({
         message: 'Please wait...'
        });
        this.presentLoading(loading);
        if (!this.platform.is('cordova')) {
        const provider = new auth.GoogleAuthProvider();
        const credential = await this.afAuth.auth.signInWithPopup(provider);
        loading.dismiss();
        return this.updateUserData(credential.user)
        } else {
        const user = await this.gplus.login({
            webClientId: environment.googleWebClientId,
            offline: true,
            scopes: 'profile email'
        });
            const credential = await this.afAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(user.idToken));
        loading.dismiss();
        return this.updateUserData(credential.user)
        }
    }

  

    async signOut() {
        await this.afAuth.auth.signOut();
        return this.router.navigate(['/']);
    }

    private updateUserData(user) {
        const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);
        const data = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
        }
        return userRef.set(data, { merge: true });
    }

    async presentLoading(loading) {
        return await loading.present();
    }

    }


<p> Agora vá em <span style="font-style: italic"> login.page.ts </span> </p>

<p style="font-weight: bold"> import e declare uma variavel no construtor </p>

    import { AuthService } from '../services/auth.service';
    contructor(private auth: AuthService) { }


<h4> No template <span style="font-style: italic"> login.page.html </span> </h4>


<p> Insira a diretiva 
 <span style="font-weight: bolder"> *ngIf </span> para mostrar o botão logar quando não houver usuario logado, e o restante quando houver. </p>


    <ion-content>
    <div>
        <div *ngIf="auth.user$ | async as user; else login">
        <div>
            <h1> Bem Vindo {{user.displayName}}</h1>
            <ion-button color="secondary" routerLink="/home">Iniciar</ion-button>
            <ion-button (click)="auth.signOut()" color="warning">Log out</ion-button>

        </div>
        </div>
        <ng-template #login>
        <ion-button  color="primary" routerLink="/home">Iniciar Sem login</ion-button>
        <ion-button (click)="auth.googleSigninCordova()" color="danger">Log In with Google Cordova AuthFirebase</ion-button>
        </ng-template>
    </div>

    </ion-content>


## Restrições - Guard

<h4> Agora vamos implementar algumas restrições de acesso no aplicativo </h4>
<h5> Em <span style="font-style: italic"> auth.guard.ts </span> </h5>


    import { Injectable } from '@angular/core';
    import { CanActivate, Router } from '@angular/router';
    import { Observable } from 'rxjs';
    import { map, take, tap} from 'rxjs/operators';
    import { AuthService } from './auth.service';
    import { ToastController } from '@ionic/angular';

    @Injectable({
    providedIn: 'root'
    })
    export class AuthGuard implements CanActivate {

    constructor(private auth: AuthService, private router: Router, private toastCtrl: ToastController) {}

    canActivate(next, state): Observable<boolean>{
        return this.auth.user$.pipe(
            take(1),
            map(user => !!user),
            tap(loggedIn => {
            if (!loggedIn) {
                this.showToast('Acesso Negado!')
                this.router.navigate(['/'])
            }
        })
        );
    }

    showToast(msg) {
        this.toastCtrl.create({
        message: msg,
        duration: 1500
        }).then(toast => toast.present());
    }
    }

<h5> Volte em <span style="font-style: italic"> app-routing.module.ts </span> e import AuthGuard. Chame-o nas paginas que deseja limitar acesso ao usuário logado. </h5>

    import { AuthGuard } from './services/auth.guard';

    const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'home', loadChildren: './home/home.module#HomePageModule', canActivate: [AuthGuard] },
    { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
    ];


<p> Em home acessaremos os dados do usuário, que uma vez logado teve seus dados(email, nome, uid e url da imagem) salvas no DB. </p>

<h5> Import em <span style="font-style: italic"> home.page.ts </span>: </h5>

    import { AuthService } from '../services/auth.service';

<p> declare a variavel no construtor - private auth: AuthService </p>

<h5> Em <span style="font-style: italic">  home.page.html </span> algo como: </h5>

    <ion-header>
    <ion-toolbar>
        <ion-title>
        Logado como Google
        </ion-title>
    </ion-toolbar>
    </ion-header>

    <ion-content>
    <ion-card *ngIf="auth.user$ | async as user">
        <ion-item>
        <ion-avatar slot="start">
            <img src="{{ user.photoURL }}">
        </ion-avatar>
        <ion-label>{{ user.displayName }}</ion-label>
        <p>{{ user.email }}</p>
        </ion-item>
    </ion-card>
    </ion-content>


<h5> Isso é tudo! </h5>

