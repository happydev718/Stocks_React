import { Alert } from "reactstrap";
import { auth } from "../components/firebase";
import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import * as routes from "../components/constants/routes";
import { withRouter } from "react-router-dom";
import Swal from 'sweetalert2'

const ResetPage = ({ history }) => (
  <div>
    <div className="div-flex">
      <div>
        <Reset history={history} />
      </div>
    </div>
  </div>
);
const byPropKey = (propertyName, value) => () => ({
  [propertyName]: value
});
const INITIAL_STATE = {
  email: "",
  error: null,
  showingAlert: false
};
class Reset extends Component {
  state = { ...INITIAL_STATE };
  onSubmit = event => {
    event.preventDefault();
    const { email } = this.state;
    const { history } = this.props;
    auth
      .doPasswordReset(email)
      .then((res) => {
        this.setState({ ...INITIAL_STATE });
        history.push(routes.HOME);
        Swal.fire({
          icon: 'success',
          title: 'Password Reset',
          text: 'If the email address exists a password reset email has been sent',
          closeButtonHtml: `
						<span class="cross-1px"></span>
					`,
        });
      })
      .catch(error => {
        Swal.fire({
          icon: 'success',
          title: 'Password Reset',
          text: 'If the email address exists a password reset email has been sent',
          closeButtonHtml: `
						<span class="cross-1px"></span>
					`,
        });
        this.setState(byPropKey("error", error));
        this.timer(); //defined below
      });
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
  render() {
    const {
      email,
      error,
      showingAlert
    } = this.state;
    //a boolen to perform validation
    // const isInvalid = email === "" ;
    return (
      <>
        {showingAlert && (
          <Alert color="danger" onLoad={this.timer}>
            {error.message}
          </Alert>
        )}
        <div className="auth-form">
          <form onSubmit={this.onSubmit}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  Reset password
                </h3>
              </div>
              <div className="card-body">
                <div className="mb-5">
                  <input
                    type="email"
                    name="email"
                    className="form-control mb-4"
                    id="exampleemail"
                    placeholder="Email address"
                    value={email}
                    onChange={event =>
                      this.setState(byPropKey("email", event.target.value))
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant='info'
                  className="w-100">
                  Reset
                </Button>
              </div>
            </div>
            <h5 className='mt-5 text-center'>
              <span className="text-muted">
                Remember Password?
              </span>
              {' '}
              <Link to="/login" className='link-underline fw-semibold'>
                Sign in here
              </Link>
            </h5>
          </form>
        </div>
      </>
    );
  }
}

export default withRouter(ResetPage); //using a HoC to get access to history
export { Reset };
