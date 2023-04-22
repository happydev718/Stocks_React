import { auth, GoogleAuthProvider, OAuthProvider, db } from "./firebase"; //importing the previously instatiated object from the firebase.js config file
import { create_account } from "../../helpers";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import { backUrl } from "../constants/routes"
import Swal from "sweetalert2";
import { GoogleReCaptchaProvider, withGoogleReCaptcha } from "react-google-recaptcha-v3";
import * as routes from "../constants/routes";
import axios from "axios";




const referrer = localStorage.getItem("referrer") || "empty";


const AuthPage = (props) => (
  <div>
    <div className="div-flex">
      <div>
        <GoogleReCaptchaProvider 
                            reCaptchaKey="6Lcc03kjAAAAAOFYd7RFFgViyFtOYhG5VRp6oLEv" 
                            useRecaptchaNet
                            scriptProps={{ async: true, defer: true, appendTo: 'body' }}
                        >
          <AuthPage {...props} />
        </GoogleReCaptchaProvider>
      </div>
    </div>
  </div>
);



// import Web3 from "web3";
//## below the authentication functions ##

export const signInWithGoogle = async () => {


  
  // Check if user is already signed in
  const currentUser = auth.currentUser;
  if (currentUser) {
    Swal.fire({
      icon: "info",
      title: "Already signed in",
      text: "You are already signed in with Google. Please sign out before signing in with a different account.",
    });
    return;
  }

  try {
    // Sign in with Google
const googleProvider = new firebase.auth.GoogleAuthProvider();
const result = await auth.signInWithPopup(googleProvider);
const user = result.user;
    if(result.cancelled){
        Swal.fire({
          icon: "info",
          title: "Sign in canceled",
          text: "You have cancel the sign in process",
        });
        return;
    }
    // Send data to backend
    try {
const response = await axios.post(backUrl  + "social", {
    email: user.email,
    referrer: referrer
  }, {
  headers: {
    'Content-Type': 'application/json'
  }
});


      if (response.data.status === true) {
        console.log("Verifying Email")
        Swal.fire({
          icon: "success",
          title: "Registration Complete.",
          text: "Successss",
        });
        return { status: true, user: user };
        localStorage.removeItem("referrer");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error...",
          text: response.data.error,
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error...",
        text: "Server error",
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error...",
      text: "Google sign-in failed",
    });
  }
}
    
 export const doSignInWithMicrosoft = async () => {
  // Check if user is already signed in
  const currentUser = auth.currentUser;
  if (currentUser) {
    Swal.fire({
      icon: "info",
      title: "Already signed in",
      text: "You are already signed in. Please sign out before signing in with a different account.",
    });
    return;
  }

  try {
    // Sign in with Microsoft
    const microsoftProvider = new firebase.auth.OAuthProvider('microsoft.com');
    microsoftProvider.setCustomParameters({
  prompt: "consent",
})
    const result = await auth.signInWithPopup(microsoftProvider);
    const user = result.user;

    if (result.cancelled) {
      Swal.fire({
        icon: "info",
        title: "Sign in canceled",
        text: "You have canceled the sign in process",
      });
      return;
    }

    // Send data to backend
    try {
      const response = await axios.post(backUrl + "social", {
        email: user.email,
        referrer: referrer
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === true) {
        console.log("Verifying Email")
        Swal.fire({
          icon: "success",
          title: "Registration Complete.",
          text: "Successss",
        });
        return { status: true, user: user };
        localStorage.removeItem("referrer");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error...",
          text: response.data.error,
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error...",
        text: "Server error",
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error...",
      text: "Microsoft sign-in failed",
    });
  }
};




export const doSignInWithApple = async () => {
  // Check if user is already signed in
  const currentUser = auth.currentUser;
  if (currentUser) {
    Swal.fire({
      icon: "info",
      title: "Already signed in",
      text: "You are already signed in. Please sign out before signing in with a different account.",
    });
    return;
  }

  try {
    // Sign in with Apple
    const appleProvider = new firebase.auth.OAuthProvider('apple.com');
    appleProvider.setCustomParameters({
      prompt: "consent",
    });
    const result = await auth.signInWithPopup(appleProvider);
    const user = result.user;

    if (result.cancelled) {
      Swal.fire({
        icon: "info",
        title: "Sign in canceled",
        text: "You have canceled the sign in process",
      });
      return;
    }

    // Send data to backend
    try {
      const response = await axios.post(backUrl + "social", {
        email: user.email,
        referrer: referrer
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === true) {
        console.log("Verifying Email")
        Swal.fire({
          icon: "success",
          title: "Registration Complete.",
          text: "Successss",
        });
        return { status: true, user: user };
        localStorage.removeItem("referrer");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error...",
          text: response.data.error,
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error...",
        text: "Server error",
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error...",
      text: "Apple sign-in failed",
    });
  }
};



//sign up
export const doCreateUserWithEmailAndPassword = (email, password) =>
    auth.createUserWithEmailAndPassword(email, password);

//sign in
export const doSignInWithEmailAndPassword = (email, password) =>
    auth.signInWithEmailAndPassword(email, password);

//sign out
export const doSignOut = () =>
    auth.signOut().then(() => {

    });

//## below are two more functions, for resetting or changing passwords ##

//password reset
export const doPasswordReset = (email) => auth.sendPasswordResetEmail(email);

//password change
export const doPasswordChange = (password) =>
    auth.currentUser.updatePassword(password);

export const doGetAnUser = (uid) =>
    db.collection("users").where("uid", "==", uid).get();
//#### for
//     facebook #####
// export const doFacebookSignIn = () => auth.signInWithPopup(facebookProvider);
export const updateUserData = async (userId, userData) => {
    try {
        const userRef = db.collection("users").doc(userId);

        await userRef.update({
            ...userData,
        });

        return { success: true };
    } catch (error) {
        return { error, success: false };
    }
};
