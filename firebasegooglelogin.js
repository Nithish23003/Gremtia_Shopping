
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
  import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
  import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
  

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
  const auth = getAuth(app);
  auth.languageCode = 'en';
  const provider = new GoogleAuthProvider();


  const googleLoginRegister = document.getElementById("google-login-btn-register");
googleLoginRegister.addEventListener("click", function(){
    signInWithPopup(auth, provider)
    .then((result) => {
        const user = result.user;
        console.log(user);

        // Send verification email
        sendEmailVerification(user)
            .then(() => {
                // Email sent. Inform the user
                alert("Verification email sent to " + user.email);
            })
            .catch((error) => {
                console.error("Error sending email verification:", error);
            });

        window.location.href = "user.html";

    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
    });
});

const googleLoginSignin = document.getElementById("google-login-btn-signin");
googleLoginSignin.addEventListener("click", function(){
    signInWithPopup(auth, provider)
    .then((result) => {
        const user = result.user;
        console.log(user);

        // Send verification email
        sendEmailVerification(user)
            .then(() => {
                // Email sent. Inform the user
                alert("Verification email sent to " + user.email);
            })
            .catch((error) => {
                console.error("Error sending email verification:", error);
            });

        window.location.href = "user.html";

    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
    });
});
  