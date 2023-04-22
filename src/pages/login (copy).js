import {Alert} from "reactstrap";
import React, {Component} from "react";
import {Link} from "react-router-dom";
import {withRouter} from "react-router-dom";
import Swal from "sweetalert2";
import validator from 'validator';
import {GoogleReCaptchaProvider, withGoogleReCaptcha} from "react-google-recaptcha-v3";
import {auth} from "../components/firebase";
import * as routes from "../components/constants/routes";
import Spinner from "../components/Spinner";
import iconGoogle from "../assets/img/svg/icon_google.svg";
import iconApple from "../assets/img/svg/icon_apple.svg";
import iconMicorsoft from "../assets/img/svg/icon_microsoft.svg";
import "../assets/css/custom.css";
import { backUrl } from "../components/constants/routes";
import axios from "axios";
// import { getAuth } from "firebase/auth";

const SignInPage = (props) => {
    return (
        <div className="div-flex">
            <div>
                <GoogleReCaptchaProvider
                    reCaptchaKey="6Lcc03kjAAAAAOFYd7RFFgViyFtOYhG5VRp6oLEv"
                    useRecaptchaNet
                    scriptProps={{async: true, defer: true, appendTo: 'body'}}
                >
                    <Login {...props} />
                </GoogleReCaptchaProvider>
            </div>
        </div>
    );
};
const byPropKey = (propertyName, value) => () => ({
    [propertyName]: value,
});
const INITIAL_STATE = {
    email: "",
    password: "",
    error: null,
    showingAlert: false,
    validationFlag: true,
    isSubmitting: false,
};


class LoginInner extends Component {
    state = {...INITIAL_STATE};

    componentDidMount() {
        const {history} = this.props;
        let uid = localStorage.getItem("account-info");
        if (uid !== null) {
            history.push(routes.HAALAND);
        }
    }

 onSubmit = async (event) => {
        event.preventDefault();
        const {email, password, validationFlag} = this.state;
        const {history} = this.props;
        if (validationFlag) {
            const {executeRecaptcha} = (this.props).googleReCaptchaProps;
            if (!executeRecaptcha) {
                console.log('Recaptcha has not been loaded');
                return false;
            }
            const token = await executeRecaptcha('login');
            if (token) {
                this.setState({isSubmitting: true})
               auth.doSignInWithEmailAndPassword(email, password)
.then(async (res) => {
if (res.user.emailVerified) {
const twoFAEnabled = await this.twofa_check(res.user.uid); // check if 2FA is enabled for this user
if (twoFAEnabled) {
// If 2FA is enabled, request the 2FA code and present the popup for the user to enter the code
const twoFACode = await this.get_2fa_code(res.user.uid);
Swal.fire({
title: '2FA Verification',
text: 'Please enter the code sent to your email',
input: 'text',
inputPlaceholder: 'Enter code here',
showCancelButton: true,
confirmButtonText: 'Verify',
}).then(async (result) => {
if (result.value) {
const code_correct = await this.check_2fa_code(res.user.uid, result.value);
if (code_correct) {
// if the code is correct, allow the user to login
this.setState({...INITIAL_STATE});
if (res.user.uid) {
localStorage.setItem("account-info", res.user.uid);
}
history.push(routes.HAALAND);
window.location.reload();
} else {
Swal.fire({
icon: 'error',
title: 'Incorrect Code',
text: 'The code entered is incorrect, please try again',
});
}
}
});
} else {
// if 2FA is not enabled, allow the user to login
this.setState({...INITIAL_STATE});
if (res.user.uid) {
localStorage.setItem("account-info", res.user.uid);
}
history.push(routes.HAALAND);
window.location.reload();
}
}
else {
auth.doSignOut();
Swal.fire({
icon: 'error',
title: 'Email Verification',
text: 'Your email is not verified, yet. Please check your email and verify.',
});
}
})
.catch(error => {
this.setState({error, isSubmitting: false});
console.error("Error signing in with password and email", error);
});
}
}
};
                
                
                twofa_check = async (user_id) => {
  try {
    const response = await axios.post(backUrl + "check_2fa", {user_id});
    return response.data.twoFAEnabled;
  } catch (error) {
    console.error(`Error in twofa_check: ${error}`);
    return false;
  }
};

get_2fa_code = async (user_id) => {
  try {
    const response = await axios.post(backUrl + "request_2fa_code", {user_id});
    return response.data.twoFACode;
  } catch (error) {
    console.error(`Error in get_2fa_code: ${error}`);
    return false;
  }
};

check_2fa_code = async (user_id, code) => {
  try {
    const response = await axios.post(backUrl + "check_2fa_code", {user_id, code});
    return response.data.success;
  } catch (error) {
    console.error(`Error in check_2fa_code: ${error}`);
    return false;
  }
};
            
                            
                            
                            

    onGoogle = async (event) => {
        const res = await auth.signInWithGoogle();
        // const { history } = this.props;
        if (res.status) {
            if (res.user.uid) {
                localStorage.setItem("account-info", res.user.uid);
            }
            window.location.reload();
        } else {
            Swal.fire({
                icon: "error",
                title: "Error...",
                text: res.error,
            });
        }
    };

    onMicrosoft = async (event) => {
        const res = await auth.doSignInWithMicrosoft();
        if (res.status) {
            if (res.user.uid) {
                localStorage.setItem("account-info", res.user.uid);
            }
            // Swal.fire({
            //   icon: "success",
            //   title: "Login",
            //   text: "Login successfully done",
            // });
            //history.push(routes.HAALAND);
            window.location.reload();
        } else {
            Swal.fire({
                icon: "error",
                title: "Error...",
                text: res.error,
            });
        }
    };

    onApple = async (event) => {
        const res = await auth.doSignInWithApple();
        // const { history } = this.props;
        if (res.status) {
            if (res.user.uid) {
                localStorage.setItem("account-info", res.user.uid);
            }
            window.location.reload();
        } else {
            Swal.fire({
                icon: "error",
                title: "Error...",
                text: res.error,
            });
        }
    };

    timer = () => {
        this.setState({
            showingAlert: true,
        });

        setTimeout(() => {
            this.setState({
                showingAlert: false,
            });
        }, 4000);
    };

    validate = (type, value) => {
        this.setState(byPropKey(type, value));
        if (validator.isStrongPassword(value, {minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1})) {
            this.setState(byPropKey("validationFlag", true));
            // this.setState({setErrorMessage:'Is Strong Password'});         
        } else {
            this.setState(byPropKey("validationFlag", false));
            // this.setState({setErrorMessage:'Is Not Strong Password'});
        }
    }

    email_validation = (value) => {
        this.setState(byPropKey("email", value));
    }

    render() {
        const {email, password, error, showingAlert, isSubmitting} = this.state;
        // const isInvalid = password === "" || email === "";
        return (
            <div>
                {showingAlert && (
                    <Alert color="danger" onLoad={this.timer}>
                        {error.message}
                    </Alert>
                )}
                <div className="vh-100 d-flex justify-content-center">
                    <div className="form-access my-auto" style={{maxWidth: 400}}>
                        <form onSubmit={this.onSubmit}>
                            <span>Sign In</span>
                            <div className="form-group">
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    id="exampleEmail"
                                    value={email}
                                    placeholder="Email Address"
                                    onChange={(event) => this.email_validation(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    name="password"
                                    className="form-control"
                                    id="examplePassword"
                                    placeholder="Password"
                                    value={password}
                                    required
                                    onChange={(event) => this.setState(byPropKey("password", event.target.value))}
                                />
                            </div>
                            <div className="text-right">
                                <Link to="/reset">Forgot Password?</Link>
                            </div>
                            <div className="custom-control custom-checkbox">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="form-checkbox"
                                />
                                <label className="custom-control-label" htmlFor="form-checkbox">
                                    Remember me
                                </label>
                            </div>
                            <div style={{textAlign: 'center'}}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minHeight: 50 }}
              >
                {isSubmitting ? <Spinner /> : "Sign In"}
              </button>
                                <button
                                    type="button"
                                    className="btn btn-primary minHeight-40"
                                    onClick={this.onGoogle}
                                >
                                    <img src={iconGoogle} alt="google" />&nbsp;&nbsp;
                                    Sign with Google
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary minHeight-40"
                                    onClick={this.onApple}
                                >
                                    <img src={iconApple} alt="apple" />&nbsp;&nbsp;
                                    Sign with Apple
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary minHeight-40"
                                    onClick={this.onMicrosoft}
                                >
                                    <img src={iconMicorsoft} alt="microsoft" />&nbsp;&nbsp;
                                    Sign with Microsoft
                                </button>
                                <div><p></p></div>
                            </div>
                        </form>
                        <h2>
                            Don't have an account? <Link to="/signup">Sign up here</Link>
                        </h2>
                    </div>
                </div>
            </div>
        );
    }
}
export default withRouter(SignInPage);
const Login = withGoogleReCaptcha(LoginInner);
export {Login};
