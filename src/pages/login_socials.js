import { Button, Form, FormGroup, Label, Input, Alert } from "reactstrap";
import React, { Component } from "react";
import { auth, db } from "../components/firebase";
import * as routes from "../components/constants/routes";
import { Link } from "react-router-dom";
import { withRouter } from "react-router-dom";
import Swal from "sweetalert2";

const SignInPage = ({ history }) => {
  return (
    <div className="div-flex">
      <div>
        <Login history={history} />
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
class Login extends Component {
  state = { ...INITIAL_STATE };

  componentDidMount() {
    const { history } = this.props;
    let uid = localStorage.getItem("account-info");
    if (uid != null) {
      history.push(routes.HAALAND);
    }
  }
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
        //history.push(routes.HAALAND);
        window.location.reload();
      })
      .catch((error) => {
        this.setState(byPropKey("error", error));
        this.timer(); //defined below
      });
    event.preventDefault();
  };

  onGoogle = async (event) => {
    const res = await auth.signInWithGoogle();
    const { history } = this.props;
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

  onYahoo = async (event) => {
    const res = await auth.doSignInWithYahoo();
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
        <div className="vh-100 d-flex justify-content-center">
          <div className="form-access my-auto">
            <form onSubmit={this.onSubmit}>
              <span>Sign In</span>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="user@gmail.com"
                  className="form-control"
                  id="exampleEmail"
                  value={email}
                  placeholder="Email Address"
                  onChange={(event) =>
                    this.setState(byPropKey("email", event.target.value))
                  }
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
                  onChange={(event) =>
                    this.setState(byPropKey("password", event.target.value))
                  }
                  required
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
              <button type="submit" className="btn btn-primary">
                Sign In
              </button>
              <button
                type="button"
                className="btn btn-indo"
                onClick={this.onGoogle}
              >
                Google
              </button>
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

export { Login };
