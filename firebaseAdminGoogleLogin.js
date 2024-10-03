
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {getFirestore,getDoc, setDoc, doc} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";


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
const db = getFirestore(app)
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();


const googleLoginSignin = document.getElementById("google-login-btn-admin");
googleLoginSignin.addEventListener("click", function(){
  signInWithPopup(auth, provider)
.then((result) => {
    const user = result.user;
        if (user.email === "rossarionithish23@gmail.com") {
            window.location.href = "admin.html"; // Redirect to admin page
        } else {
            firebase.auth().signOut(); // Sign out non-admin users
            document.getElementById('error-message').innerText = "You're not allowed.";
        }
    })
    .catch((error) => {
        console.error("Error signing in: ", error);
    });
});

const signIn = document.getElementById('submitAdminSignIn');
signIn.addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();  // Trim whitespace
    const password = document.getElementById('adminPassword').value;

    try {
        // Attempt to sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if the user is an admin
        if (email === 'rossarionithish26@gmail.com') {
            localStorage.setItem('loggedInUserId', user.uid);  // Store user ID locally
            window.location.href = 'admin.html';  // Redirect to admin page
        } else {
            showMessage("You're not allowed.", 'signInMessage');  // Non-admin error message
            await auth.signOut();  // Sign out non-admin users
        }
    } catch (error) {
        console.error("Error during sign-in:", error);
        showMessage('Incorrect Email or Password', 'signInMessage');  // Show error message
    }
});