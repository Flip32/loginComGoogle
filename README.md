#Login com Google Ionic 4 e Firebase

## O conteúdo o projeto foi feito em cima de informações encontradas na internet.

### Esse conteúdo tem o único propósito servir de guia para mim e a quem servir para criar uma aplicação em Ionic 4 e Firebase com Login utilizando Google plus.
### Também é utilizado acesso restrito com CanActivate.

## É necessário
### Ter Ionic | Ter conta no Firebase | Liberar no Firebase a autenticação com Google


#####Crie o projeto Ionic com id
######ex.: ionic start nomeProjeto blank --id=com.app.nomeProjeto
######Caso esteja num projeto já em andamento e não adicionou id. Basta ir em Config.xml e mudar manualmente. Algo como
    <widget id="com.app.nomeProjeto" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">

#####No console do projeto instale o firebase

 	npm install firebase @angular/fire --save

#####Agora vá até o Firebase em seu projeto e adicione os aplicativos ios e android. 
######Configurações adicionar aplicativo/ ios e em 'Código do pacote do IOS' escreva o seu domínio ao contrário
######ex.: com.app.nomeDoProjeto. Não é obrigatório ter o domínio registrado para funcionar.
#####Faça a mesma coisa para adicionar o Android, porém é necessário preencher a SHA-1, para isso vá no console do projeto

	keytool -exportcert -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore

#####A senha inicial é 'android'
#####Copie e cole no firebase e clique em registrar app.

#####Adicionar o google plus
 #####E o plugin do cordova para o gplus, criado por Eddy Verbruggen https://twitter.com/eddyverbruggen.

	npm install --save @ionic-native/google-plus@beta
	
	ionic cordova plugin add cordova-plugin-googleplus --save --variable REVERSED_CLIENT_ID=YOUR_REVERSE_CLIENT_ID

	
####Sua REVERSED_CLIENT_ID só é necessaria para ios, e vc a encontra no GoogleService-Info.plist
######Deve possuir o seguinte esquema:  com.googleusercontent.apps.uniqueId


#####Adicione agora, no firebase, o app da Web, para usarmos o Database e salvar os usuários
#####Copie a firebaseConfig e cole no environments.ts (Não se esqueça de trocar o = por : )

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

#####Crie um banco de dados. No menu esquerdo no console do Firebase, clique em Database e depois criar banco de dados. Deixe em modo Teste (Se desejar depois mude as configurações de segurança, aconselhavel)
###Dentro da pasta do projeto, no console

####Criar um serviço

	ionic g service services/auth

####Criar um guard no serviço

	ionic g guard services/auth

####Criar Pagina de login

	ionic g page login

####Criar interface
#####Na pasta services adicione um arquivo user.model.ts

    export interface User {
        uid: string;
     email: string;
        photoURL?: string;
        displayName?: string;
        somethingCustom?: string;
    }


#####Agora vá em app.module.ts e import, algo do tipo:


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

####Em app-routing.module.ts
Mude a pagina inicial para login

	const routes: Routes = [
  	{ path: '', redirectTo: 'login', pathMatch: 'full' },
 	 { path: 'home', loadChildren: './home/home.module#HomePageModule' },
	  { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
	];


Em no serviço auth.service.ts

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


#####Agora vá em login.page.ts

#####import e declare uma variavel no construtor
    import {AuthService} from '../services/auth.service';

    contructor(private auth: AuthService) {}


#####No template login.page.html


#####Insira a diretiva *ngIf para mostrar o botão logar quando não houver usuario logado, e o restante quando houver.


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


#####Agora vamos implementar algumas restrições de acesso no aplicativo
#####No auth.guard.ts


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

#####Agora volte em app-routing.module.ts import AuthGuard e o chame nas paginas que deseja limitar acesso ao usuário logado.

    import {AuthGuard} from './services/auth.guard';

    const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'home', loadChildren: './home/home.module#HomePageModule', canActivate: [AuthGuard] },
    { path: 'login', loadChildren: './login/login.module#LoginPageModule' },
    ];


#####Em home acessaremos os dados do usuário, que uma vez logado teve seus dados(email, nome, uid e url da imagem) salvas no DB.
#####Em home.page.ts import 

    import {AuthService} from '../services/auth.service';

#####e declare a variavel no construtor - private auth: AuthService

#####em home.page.html, algo como

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


###Isso é tudo!
###
###
###
