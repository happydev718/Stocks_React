import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import {
    // Button, 
    // Form, 
    // FormGroup, 
    // Label, 
    // Input, 
    Alert
} from "reactstrap";
// import Web3 from 'web3';
// import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
import * as routes from "../components/constants/routes";
import { db } from "../components/firebase/firebase";
import { auth } from "../components/firebase";
import validator from 'validator';
import Swal from 'sweetalert2';
import configURL from '../config/wallets.json';
import axios from 'axios';
import { create_account } from "../helpers";

const ethSendState = configURL.ethSend;
// const depositAmount = configURL.depositAmount;
// const depositWallet = configURL.depositWallet;
// const depositPrivate = configURL.depositPrivate;
// const gasPrice = 0; //or get with web3.eth.gasPrice
// const gasLimit = 6721975;
const queryParams = new URLSearchParams(window.location.search);
const r = queryParams.get('r');

if (localStorage.getItem("referrer") === null) {
    localStorage.setItem('referrer', r);
}

const referrer = localStorage.getItem('referrer');


const SignUpPage = ({ history }) => (
    <div>
        <div className="div-flex">
            <div>
                <Signup history={history} />
            </div>
        </div>
    </div>
);

const INITIAL_STATE = {
    username: "",
    email: "",
    passwordOne: "",
    passwordTwo: "",
    validationFlag: false,
    error: null,
    showingAlert: false
};

//A Higher order function with prop name as key and the value to be assigned to
const byPropKey = (propertyName, value) => () => ({
    [propertyName]: value
});

class Signup extends Component {
    constructor(props) {
        super(props);
        this.sendRequest = this.sendRequest.bind(this);
    }

    //defining state
    state = {
        ...INITIAL_STATE
    };

    sendRequest = async (address) => {
        let url = 'https://data.stocksfc.com/newuser.php';
        var formdata = new FormData();
        formdata.append("address", address);
        let requestOptions = {
            method: 'POST',
            // headers: {},
            // headers: { 'Content-Type': 'application/json' },
            body: formdata,
            redirect: 'follow'
        };
        let responseData = await fetch(url, requestOptions)
            .then(response => response.json())
            .catch(error => {
                return false;
            });
        let status = responseData.status;
        if (status === 'success') {
            return true;
        } else {
            return false;
        }
    };


    onSubmit = async (event) => {
        event.preventDefault();
        const { username, email, passwordOne, passwordTwo, validationFlag } = this.state;

        if (false) {

        }
        else {
            if (validationFlag) {
                if (passwordOne === passwordTwo) {
                    var account1 = create_account();
                    if (ethSendState === "on") {
                        // this.sendToken(depositAmount, depositPrivate, depositWallet, account1.address);
                        await this.sendRequest(account1.address);
                        // alert(account1.privateKey);
                    }
                    const { history } = this.props;
                    auth.doCreateUserWithEmailAndPassword(email, passwordOne)
                        //it the above functions resolves, reset the state to its initial state values, otherwise, set the error object
                        .then(async (authUser) => {
                            authUser.user.sendEmailVerification();
                            db.collection('users').doc(authUser.user.uid).set({
                                uid: authUser.user.uid,
                                Firstname: username,
                                email: email,
                                address: account1.address,
                                privateKey: account1.privateKey,
                                referrer: referrer,
                            })
                                // sending alert if it success
                                .then(() => { })
                                // sending the error if it fails.
                                .catch((error) => {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error...',
                                        text: error.message,

                                    })
                                });
                            try {
                                let message = {
                                    key: routes.email_api_key,
                                    template_name: "stocksfc-welcome",
                                    template_content: [
                                        { name: "template", content: "stocksfc-welcome" }
                                    ],
                                    message: {
                                        from_email: "noreply@stocksfc.com",
                                        subject: "Welcome to StocksFC!",
                                        text: "Welcome to StocksFC!",
                                        to: [
                                            { email: email, type: "to" }
                                        ]
                                    }
                                };
                                await axios.post("https://mandrillapp.com/api/1.0/messages/send-template", message);
                            } catch (error) {
                            }
                            // db.collection('users_common').doc(email).set({
                            //     email: email,
                            // });
                        });
                    history.push(routes.SIGN_IN);
                    localStorage.removeItem('referrer');
                }
                else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Password Error',
                        text: 'Passwords do not match',
                    });
                }
            }
            else {
                Swal.fire({
                    icon: 'error',
                    title: 'Weak Password',
                    text: 'Password must be a minimum of 8 characters and contain numbers and special characters',
                });
            }
        }
    };

    timer = () => {
        this.setState({
            showingAlert: true
        });

        setTimeout(() => {
            this.setState({
                showingAlert: false
            });
        }, 4000);
    };

    validate = (type, value) => {
        this.setState(byPropKey(type, value));
        if (validator.isStrongPassword(value, { minLength: 8, minNumbers: 1, minSymbols: 1 })) {
            this.setState(byPropKey("validationFlag", true));
            // this.setState({setErrorMessage:'Is Strong Password'});         
        } else {
            this.setState(byPropKey("validationFlag", false));
            // this.setState({setErrorMessage:'Is Not Strong Password'});
        }
    }

    render() {
        const { username, email, passwordOne, passwordTwo, error, showingAlert } = this.state;
        //a boolen to perform validation
        // const isInvalid = passwordOne !== passwordTwo || passwordOne === "" || email === "" || username === "";

        return (
            <div>
                {showingAlert && (
                    <Alert color="danger" onLoad={this.timer}>
                        {error.message}
                    </Alert>
                )}
                <div className="vh-100 d-flex justify-content-center">
                    <div className="form-access my-auto">
                        <form onSubmit={this.onSubmit}>
                            <span>Create Account</span>
                            <div className="form-group">
                                <input
                                    type="username"
                                    name="username"
                                    id="userName"
                                    className="form-control"
                                    placeholder="Full Name"
                                    value={username}
                                    onChange={e =>
                                        this.setState(byPropKey("username", e.target.value))
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="email"
                                    name="email"
                                    id="exampleEmail"
                                    className="form-control"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={e => this.setState(byPropKey("email", e.target.value))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    name="password"
                                    id="examplePassword1"
                                    className="form-control"
                                    placeholder="Password"
                                    value={passwordOne}
                                    onChange={e => this.validate('passwordOne', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    name="password"
                                    id="examplePassword2"
                                    className="form-control"
                                    placeholder="Confirm Password"
                                    value={passwordTwo}
                                    onChange={e => this.validate('passwordTwo', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="custom-control custom-checkbox">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="form-checkbox"
                                    required
                                />
                                <label className="custom-control-label" htmlFor="form-checkbox">
                                    I agree to the{' '}
                                    <Link to="/terms-and-conditions">Terms & Conditions</Link>
                                </label>
                            </div>
                            <button type="submit" className="btn btn-primary">
                                Create Account
                            </button>
                        </form>
                        <h2>
                            Already have an account?
                            <Link to="/login"> Sign in here</Link>
                        </h2>
                    </div>
                </div>
            </div>
        );
    }
}
export default withRouter(SignUpPage); //using a HoC to get access to history
export { Signup };
