import React, { Component } from "react";
import { Button, Form, FormGroup, Label, Input, Alert } from "reactstrap";
// import { FacebookLoginButton } from "react-social-login-buttons";
import logo from "./logo.svg";

import { withRouter } from "react-router-dom";

import { SignUpLink } from "./SignUp";
// import { PasswordForgetLink } from "./PasswordForget";
import { auth, db } from "../firebase";
import * as routes from "../constants/routes";

const SignInPage = ({ history }) => {
    return (
        <div className="div-flex">
            <div>
                <h1 className="centered">Sign In</h1>
                {/* <img src={logo} className="App-logo" alt="My logo" /> */}

                <SignInForm history={history} />
                <SignUpLink />
                {/* <PasswordForgetLink /> */}
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
};

class SignInForm extends Component {

    state = { ...INITIAL_STATE };

    onSubmit = (event) => {
        const { email, password } = this.state;
        const { history } = this.props;

        auth
            .doSignInWithEmailAndPassword(email, password)
            .then((res) => {
                this.setState({ ...INITIAL_STATE });
                if (res.user.uid) {
                    localStorage.setItem("account-info", res.user.uid);
                }
                history.push(routes.HOME);
            })
            .catch((error) => {
                this.setState(byPropKey("error", error));
                this.timer(); //defined below
            });
        event.preventDefault();
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


    render() {

        const { email, password, error, showingAlert } = this.state;

        const isInvalid = password === "" || email === "";

        return (
            <div>
                {showingAlert && (
                    <Alert color="danger" onLoad={this.timer}>
                        {error.message}
                    </Alert>
                )}

                <Form onSubmit={this.onSubmit}>
                    <FormGroup>
                        <Label for="exampleEmail">Email</Label>
                        <Input
                            type="email"
                            name="email"
                            id="exampleEmail"
                            placeholder="user@gmail.com"
                            value={email}
                            onChange={(event) => 
                                this.setState(byPropKey("email", event.target.value))
                            }
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label for="examplePassword">Password</Label>
                        <Input
                            type="password"
                            name="password"
                            id="examplePassword"
                            placeholder="pass-test"
                            value={password}
                            onChange={(event) =>
                                this.setState(byPropKey("password", event.target.value))
                            }
                        />
                    </FormGroup>

                    <div className="text-center">
                        <Button disabled={isInvalid} type="submit"> Sign In </Button>
                        <Button disabled={isInvalid} type="submit"> Email Verify </Button>
                    </div>
                </Form>

                <hr />
            </div>
        );
    }
}

export default withRouter(SignInPage);

export { SignInForm };
