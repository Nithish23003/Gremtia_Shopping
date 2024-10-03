const signUpButton=document.getElementById('signUpButton');
const signInButton=document.getElementById('signInButton');
const signInForm=document.getElementById('signIn');
const signUpForm=document.getElementById('signup');

// New elements for admin login toggle
const adminSignInButton = document.getElementById('adminSignInButton');
const userSignInButton = document.getElementById('userSignInButton');
const adminSignInForm = document.getElementById('adminSignIn');

// Toggle between user sign-up and sign-in
signUpButton.addEventListener('click', function() {
    signInForm.style.display = "none";
    signUpForm.style.display = "block";
});
signInButton.addEventListener('click', function() {
    signInForm.style.display = "block";
    signUpForm.style.display = "none";
});

// Toggle between user sign-in and admin sign-in
adminSignInButton.addEventListener('click', function() {
    signInForm.style.display = "none";
    adminSignInForm.style.display = "block";
});

userSignInButton.addEventListener('click', function() {
    adminSignInForm.style.display = "none";
    signInForm.style.display = "block";
});