import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {getFirestore, setDoc, doc} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


    const firebaseConfig = {
    apiKey: "AIzaSyAiliFYPVr2KU6Mazj24QBCaPsomKF0Ok4",
    authDomain: "loginin-a8a50.firebaseapp.com",
    projectId: "loginin-a8a50",
    storageBucket: "loginin-a8a50.appspot.com",
    messagingSenderId: "256549944410",
    appId: "1:256549944410:web:1c3549de822dfaa4f22c63",
    measurementId: "G-4484MRLSV6"
  };

  const app = initializeApp(firebaseConfig);
  function showMessage(message, divId){
    var messageDiv=document.getElementById(divId);
    messageDiv.style.display="block";
    messageDiv.innerHTML=message;
    messageDiv.style.opacity=1;
    setTimeout(function(){
        messageDiv.style.opacity=0;
    },5000);
 }
 const signUp=document.getElementById('submitSignUp');
 signUp.addEventListener('click', (event)=>{
    event.preventDefault();
    const email=document.getElementById('rEmail').value;
    const password=document.getElementById('rPassword').value;
    const firstName=document.getElementById('fName').value;
    const lastName=document.getElementById('lName').value;
    const mobileNumber=document.getElementById('rmobileNumber').value;


    const auth=getAuth();
    const db=getFirestore();

    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential)=>{
        const user=userCredential.user;
        const userData={
            email: email,
            firstName: firstName,
            lastName:lastName,
            mobileNumber:mobileNumber,
            creditLimit: 0
        };
        showMessage('Account Created Successfully', 'signUpMessage');
        const docRef=doc(db, "users", user.uid);
        setDoc(docRef,userData)
        .then(()=>{
            window.location.href='index.html';
        })
        .catch((error)=>{
            console.error("error writing document", error);

        });
    })
    .catch((error)=>{
        const errorCode=error.code;
        if(errorCode=='auth/email-already-in-use'){
            showMessage('Email Address Already Exists !!!', 'signUpMessage');
        }
        else{
            showMessage('unable to create User', 'signUpMessage');
        }
    })
 });

 const signIn=document.getElementById('submitSignIn');
 signIn.addEventListener('click', (event)=>{
    event.preventDefault();
    const email=document.getElementById('email').value;
    const password=document.getElementById('password').value;
    const auth=getAuth();

    signInWithEmailAndPassword(auth, email,password)
    .then((userCredential)=>{
        showMessage('login is successful', 'signInMessage');
        const user=userCredential.user;
        localStorage.setItem('loggedInUserId', user.uid);
        localStorage.setItem('loggedInUserEmail', email);
        window.location.href='user.html';
    })
    .catch((error)=>{
        const errorCode=error.code;
        if(errorCode==='auth/invalid-credential'){
            showMessage('Incorrect Email or Password', 'signInMessage');
        }
        else{
            showMessage('Account does not Exist', 'signInMessage');
        }
    });
});

// Password Recovery functionality
const recoverPassword = document.getElementById('recoverPasswordLink');
recoverPassword.addEventListener('click', () => {
  document.getElementById('passwordRecoveryModal').style.display = 'block';
});

const resetPasswordBtn = document.getElementById('resetPasswordBtn');
resetPasswordBtn.addEventListener('click', (event) => {
  event.preventDefault();
  const forgotEmail = document.getElementById('forgotEmail').value;
  const auth = getAuth();

  sendPasswordResetEmail(auth, forgotEmail)
    .then(() => {
      showMessage('Password reset link sent to your email.', 'passwordResetMessage');
      document.getElementById('passwordRecoveryModal').style.display = 'none';
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === 'auth/user-not-found') {
        showMessage('Email is not registered!', 'passwordResetMessage');
      } else {
        showMessage('Error sending reset email.', 'passwordResetMessage');
      }
    });
});

document.getElementById('recoverPasswordLink').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('passwordRecoveryModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
  });
  
  // Close Password Recovery Modal
  document.getElementById('closeModalBtn').addEventListener('click', function () {
    document.getElementById('passwordRecoveryModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
  });
 


