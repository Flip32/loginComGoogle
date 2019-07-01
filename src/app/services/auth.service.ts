import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, Platform } from '@ionic/angular';

import { auth } from 'firebase/app'
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase'

import { GooglePlus } from '@ionic-native/google-plus/ngx';

import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { User } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user$: Observable<User>;

  constructor(private afAuth: AngularFireAuth,
              private afs: AngularFirestore,
              private router: Router,
              private gplus: GooglePlus,
              private platform: Platform,
              private loadingController: LoadingController) {
    this.user$ = this.afAuth.authState.pipe(
        switchMap (user => {
          if (user) {
            return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
          } else {
            return of (null)
          }
        })
    )
  }

  async loginGoogle(){
    const loading = await this.loadingController.create({
      message: 'Carregando..'
    });
    this.mostrarLoading(loading);
    if (!this.platform.is('cordova')) {
      //Logar com a WEB
      const provider = new auth.GoogleAuthProvider();
      const credential = await this.afAuth.auth.signInWithPopup(provider);
      loading.dismiss();
      return this.atualizaUser(credential.user)

      // loga com o cordova
    } else {
      const user = await this.gplus.login({
        webClientId: environment.googleWebClientId,
        offline: true,
        scopes: 'profile email'
      });
      const credential = await this.afAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(user.idToken));
      loading.dismiss();
      return this.atualizaUser(credential.user)
    }
  }

  async logOut(){
    await this.afAuth.auth.signOut();
    return this.router.navigate(['/'])
  }

  private atualizaUser(user){
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);
    const data = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }
    return userRef.set(data, { merge: true });
  }


  async mostrarLoading(loading) {
    return await loading.present();
  }
}



