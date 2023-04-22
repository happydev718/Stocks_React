import { Alert } from "reactstrap";
import React, { Component } from "react";
import { Row, Col, Button } from 'react-bootstrap';
import { Link } from "react-router-dom";
import { withRouter } from "react-router-dom";
import Swal from "sweetalert2";
import validator from 'validator';
import { GoogleReCaptchaProvider, withGoogleReCaptcha } from "react-google-recaptcha-v3";
import { auth } from "../components/firebase";
import * as routes from "../components/constants/routes";
import Spinner from "../components/Spinner";
import iconGoogle from "../assets/img/svg/icon_google.svg";
import iconApple from "../assets/img/svg/icon_apple.svg";
import iconMicorsoft from "../assets/img/svg/icon_microsoft.svg";
import axios from "axios";
import { backUrl } from "../components/constants/routes";
import "../assets/css/custom.css";
// import { getAuth } from "firebase/auth";

const SignInPage = (props) => {
	return (
		<div className="div-flex">
			<div>
				<GoogleReCaptchaProvider
					reCaptchaKey="6Lcc03kjAAAAAOFYd7RFFgViyFtOYhG5VRp6oLEv"
					useRecaptchaNet
					scriptProps={{ async: true, defer: true, appendTo: 'body' }}
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
	state = { ...INITIAL_STATE };

	componentDidMount() {
		const { history } = this.props;
		let uid = localStorage.getItem("account-info");
		if (uid !== null) {
			history.push(routes.HAALAND);
		}
	}


	onSubmit = async (event) => {
		event.preventDefault();
		const { email, password, validationFlag } = this.state;
		const { history } = this.props;
		if (validationFlag) {
			const { executeRecaptcha } = (this.props).googleReCaptchaProps;
			if (!executeRecaptcha) {
				console.log('Recaptcha has not been loaded');
				return false;
			}
			const token = await executeRecaptcha('login');
			if (token) {
				this.setState({
					isSubmitting: true
				});
				auth.doSignInWithEmailAndPassword(email, password)
					.then(async (res) => {
						if (res.user.emailVerified) {
							console.log("running twoFAenabled");
							const twoFAEnabled = await this.twofa_check(email);
							console.log("twoFAEnabled RESULT", twoFAEnabled);

							if (twoFAEnabled === "undefined") {
								console.error("Error checking 2FA, user should not be logged in");
								Swal.fire({
									icon: "error",
									title: "Error Checking 2FA",
									text:
										"There was an error checking if 2FA is enabled. Please try again later.",
								});
								return;
							}

							if (twoFAEnabled === true) {
								console.log("2fa is turned on");
								// If 2FA is enabled, request the 2FA code and present the popup for the user to enter the code
								await this.get_2fa_code(email);
								Swal.fire({
									title: "2FA Verification",
									text: "Please enter the code sent to your email",
									input: "text",
									inputPlaceholder: "Enter code here",
									showCancelButton: true,
									confirmButtonText: "Verify",
								}).then(async (result) => {
									if (result.value) {
										const code_correct = await this.check_2fa_code(email, result.value);
										if (code_correct === true) {
											// if the code is correct, allow the user to login
											this.setState({ ...INITIAL_STATE });
											if (res.user.uid) {
												localStorage.setItem("account-info", res.user.uid);
											}
											history.push(routes.HAALAND);
											window.location.reload();
										} else {
											this.setState({
												isSubmitting: false
											});
											Swal.fire({
												icon: "error",
												title: "Incorrect Code",
												text: "The code entered is incorrect, please try again",
											});
										}
									} else {
										this.setState({
											isSubmitting: false
										});
									}
								});

							} else if (twoFAEnabled === false) {
								// if 2FA is not enabled, allow the user to login
								this.setState({ ...INITIAL_STATE });
								if (res.user.uid) {
									localStorage.setItem("account-info", res.user.uid);
								}
								history.push(routes.HAALAND);
								window.location.reload();
							}

						} else {
							auth.doSignOut();
							Swal.fire({
								icon: 'error',
								title: 'Email Verification',
								text: 'Your email is not verified, yet. Please check your email and verify.',
							});
						}
					})
					.catch(error => {
						this.setState({
							error,
							isSubmitting: false
						});
						const {
							executeRecaptcha
						} = this.props.googleReCaptchaProps;




						console.error("Error signing in with password and email", error);
						Swal.fire({
							icon: 'error',
							title: 'Incorrect Password',
							text: 'The password you entered is incorrect, please try again.',
						});
					});
			}
		}
	};






	check_2fa_code = async (email, code) => {
		try {
			const response = await axios.post(backUrl + "check_2fa_code", { email, code });
			return response.data;
		} catch (error) {
			console.error(`Error in check_2fa_code: ${error}`);
			Swal.fire({
				icon: 'error',
				title: 'Error Verifying 2FA Code',
				text: 'There was an error verifying the 2FA code. Please try again later.',
			});
			return error;
		}
	};


	twofa_check = async (email) => {
		try {
			const response = await axios.post(backUrl + "2fa_check", { email });
			console.log("twofa_check response", response)
			console.log("response.data", response.data)
			return response.data;
		} catch (error) {
			console.error(`Error in twofa_check: ${error}`);
			Swal.fire({
				icon: 'error',
				title: 'Error Checking 2FA',
				text: 'There was an error checking if 2FA is enabled. Please try again later.',
			});
			return error;
		}
	};

	get_2fa_code = async (email) => {
		try {
			const response = await axios.post(backUrl + "get_2fa_code", { email });
			return response.data.twoFACode;
		} catch (error) {
			console.error(`Error in get_2fa_code: ${error}`);
			Swal.fire({
				icon: 'error',
				title: 'Error Requesting 2FA Code',
				text: 'There was an error requesting the 2FA code. Please try again later.',
			});
			return error;
		}
	};




	onGoogle = async (event) => {
		const res = await auth.signInWithGoogle();
		if (res.user.uid) {
			const email = res.user.email;
			const twoFaEnabled = await this.twofa_check(email);
			if (twoFaEnabled) {
				await this.get_2fa_code(email);
				Swal.fire({
					title: 'Enter 2FA Code',
					text: `A 2FA code has been sent to your email. Please enter it below:`,
					input: 'text',
					inputAttributes: {
						autocapitalize: 'off'
					},
					showCancelButton: true,
					confirmButtonText: 'Verify',
					showLoaderOnConfirm: true,
					preConfirm: async (code) => {
						const verified = await this.check_2fa_code(email, code);
						if (!verified) {
							Swal.showValidationMessage(
								'Invalid 2FA code. Please try again.'
							);
						}
						return verified;
					},
					allowOutsideClick: () => !Swal.isLoading()
				}).then(async (result) => {
					if (result.value) {
						localStorage.setItem("account-info", res.user.uid);
						window.location.reload();
					}
				});
			} else {
				localStorage.setItem("account-info", res.user.uid);
				window.location.reload();
			}
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
				const email = res.user.email;
				const twoFaEnabled = await this.twofa_check(email);
				if (twoFaEnabled) {
					await this.get_2fa_code(email);
					Swal.fire({
						title: 'Two Factor Authentication',
						text: 'Please enter the 2FA code sent to your email',
						input: 'text',
						inputAttributes: {
							autocapitalize: 'off'
						},
						showCancelButton: true,
						confirmButtonText: 'Verify',
						showLoaderOnConfirm: true,
						preConfirm: async (code) => {
							const success = await this.check_2fa_code(email, code);
							if (!success) {
								Swal.showValidationMessage(
									'Incorrect 2FA code. Please try again.'
								);
							}
							return success;
						},
						allowOutsideClick: () => !Swal.isLoading()
					}).then((result) => {
						if (result.value) {
							localStorage.setItem("account-info", res.user.uid);
							window.location.reload();
						}
					});
				} else {
					localStorage.setItem("account-info", res.user.uid);
					window.location.reload();
				}
			}
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
				const email = res.user.email;
				const twoFAEnabled = await this.twofa_check(email);

				if (twoFAEnabled) {
					await this.get_2fa_code(email);
					Swal.fire({
						title: 'Enter 2FA Code',
						input: 'text',
						inputAttributes: {
							autocapitalize: 'off'
						},
						showCancelButton: true,
						confirmButtonText: 'Verify',
						showLoaderOnConfirm: true,
						preConfirm: async (code) => {
							const isCodeValid = await this.check_2fa_code(email, code);
							if (!isCodeValid) {
								Swal.showValidationMessage(
									'Invalid 2FA code. Please try again.'
								);
							}
							return isCodeValid;
						},
						allowOutsideClick: () => !Swal.isLoading()
					}).then(async (result) => {
						if (result.value) {
							localStorage.setItem("account-info", res.user.uid);
							window.location.reload();
						}
					});
				} else {
					localStorage.setItem("account-info", res.user.uid);
					window.location.reload();
				}
			}
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
		if (validator.isStrongPassword(value, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
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
		const { email, password, error, showingAlert, isSubmitting } = this.state;
		// const isInvalid = password === "" || email === "";
		return (
			<div>
				{showingAlert && (
					<Alert color="danger" onLoad={this.timer}>
						{error.message}
					</Alert>
				)}
				<div className="auth-form">
					<div className="card">
						<form onSubmit={this.onSubmit}>
							<div className="card-header">
								<h3 className="card-title">
									Sign In
								</h3>
							</div>
							<div className="card-body">
								<div className="mb-5">
									<input
										type="email"
										name="email"
										className="form-control mb-4"
										id="exampleEmail"
										value={email}
										placeholder="Email Address"
										onChange={(event) => this.email_validation(event.target.value)}
										required
									/>
									<input
										type="password"
										name="password"
										className="form-control mb-4"
										id="examplePassword"
										placeholder="Password"
										value={password}
										required
										onChange={(event) => this.setState(byPropKey("password", event.target.value))}
									/>
									<Row>
										<Col>
											<div className="form-check">
												<input
													type="checkbox"
													className="form-check-input"
													id="form-checkbox"
												/>
												<label className="form-check-label" htmlFor="form-checkbox">
													Remember me
												</label>
											</div>
										</Col>
										<Col style={{display: "flex", justifyContent: 'end'}}>
											<Link to="/reset" className='fw-semibold link-underline'>Forgot Password?</Link>
										</Col>
									</Row>
								</div>

								<Button
									type="submit"
									variant="info"
									className='w-100'
								>
									{isSubmitting ? <Spinner /> : "Sign In"}
								</Button>

								<div className="form-separator">
									<span className="form-separator__content">or</span>
								</div>

								<Button
									type="button"
									variant='light'
									className="mb-4 w-100"
									onClick={this.onGoogle}
								>
									<img src={iconGoogle} alt="google" />&nbsp;&nbsp;
									Sign with Google
								</Button>

								<Button
									type="button"
									variant='light'
									className="mb-4 w-100"
									onClick={this.onApple}
								>
									<img src={iconApple} alt="google" />&nbsp;&nbsp;
									Sign with Apple
								</Button>

								<Button
									type="button"
									variant='light'
									className="w-100"
									onClick={this.onMicrosoft}
								>
									<img src={iconMicorsoft} alt="microsoft" />&nbsp;&nbsp;
									Sign with Microsoft
								</Button>
							</div>
						</form>
					</div>

					<h5 className='mt-5 text-center'>
						<span className="text-muted">
							Don't have an account?
						</span>
						{' '}
						<Link to="/signup" className='link-underline fw-semibold'>
							Sign up
						</Link>
					</h5>
				</div>
			</div>
		);
	}
}
export default withRouter(SignInPage);
const Login = withGoogleReCaptcha(LoginInner);
export { Login };
