import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { Button } from 'react-bootstrap';
import {
	// Button,
	// Form,
	// FormGroup,
	// Label,
	// Input,
	Alert,
} from "reactstrap";
// import Web3 from 'web3';
// import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
import * as routes from "../components/constants/routes";
import { auth } from "../components/firebase";
import validator from "validator";
import Swal from "sweetalert2";
import axios from "axios";
import { backUrl } from "../components/constants/routes";
import Spinner from "../components/Spinner";
import { GoogleReCaptchaProvider, withGoogleReCaptcha } from "react-google-recaptcha-v3";
import iconGoogle from "../assets/img/svg/icon_google.svg";
import iconApple from "../assets/img/svg/icon_apple.svg";
import iconMicorsoft from "../assets/img/svg/icon_microsoft.svg";
const queryParams = new URLSearchParams(window.location.search);
const r = queryParams.get("r");

if (localStorage.getItem("referrer") === null) {
	localStorage.setItem("referrer", r);
}

const referrer = localStorage.getItem("referrer");

const SignUpPage = (props) => (
	<div>
		<div className="div-flex">
			<div>
				<GoogleReCaptchaProvider
					reCaptchaKey="6Lcc03kjAAAAAOFYd7RFFgViyFtOYhG5VRp6oLEv"
					useRecaptchaNet
					scriptProps={{ async: true, defer: true, appendTo: 'body' }}
				>
					<Signup {...props} />
				</GoogleReCaptchaProvider>
			</div>
		</div>
	</div>
);

const INITIAL_STATE = {
	email: "",
	username: "",
	passwordOne: "",
	passwordTwo: "",
	validationFlag: false,
	error: null,
	showingAlert: false,
	isSubmitting: false,
};

//A Higher order function with prop name as key and the value to be assigned to
const byPropKey = (propertyName, value) => () => ({
	[propertyName]: value,
});

class SignupInner extends Component {
	constructor(props) {
		super(props);
		this.sendRequest = this.sendRequest.bind(this);
		console.log(this.props);
	}

	//defining state
	state = {
		...INITIAL_STATE,
	};

	sendRequest = async (address) => {
		let url = "https://data.stocksfc.com/newuser.php";
		var formdata = new FormData();
		formdata.append("address", address);
		let requestOptions = {
			method: "POST",
			// headers: {},
			// headers: { 'Content-Type': 'application/json' },
			body: formdata,
			redirect: "follow",
		};
		let responseData = await fetch(url, requestOptions)
			.then((response) => response.json())
			.catch((error) => {
				return false;
			});
		let status = responseData.status;
		if (status === "success") {
			return true;
		} else {
			return false;
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
						window.location.href = "/login";
					}
				});
			} else {
				localStorage.setItem("account-info", res.user.uid);
				window.location.href = "/login";
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
							window.location.href = "/login";
						}
					});
				} else {
					localStorage.setItem("account-info", res.user.uid);
					window.location.href = "/login";
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
							window.location.href = "/login";
						}
					});
				} else {
					localStorage.setItem("account-info", res.user.uid);
					window.location.href = "/login";
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


	onSubmit = async (event) => {
		event.preventDefault();
		const { email, passwordOne, passwordTwo, validationFlag } = this.state;

		if (!validationFlag) {
			Swal.fire({
				icon: "error",
				title: "Weak Password",
				text: "Password must be a minimum of 8 characters and contain numbers and special characters",
			});
			return;
		}

		if (passwordOne !== passwordTwo) {
			Swal.fire({
				icon: "error",
				title: "Password Error",
				text: "Passwords do not match",
			});
			return;
		}

		const { executeRecaptcha } = this.props.googleReCaptchaProps;
		if (!executeRecaptcha) {
			console.log("Recaptcha has not been loaded");
			return;
		}

		const token = await executeRecaptcha("register");
		if (!token) {
			Swal.fire({
				icon: "error",
				title: "Google Recaptcha",
				text: "Verification failed",
			});
			return;
		}

		this.setState({
			isSubmitting: true,
		});

		try {
			const { history } = this.props;
			try {
				const authUser = await auth.doCreateUserWithEmailAndPassword(email, passwordOne);
				authUser.user.sendEmailVerification();
			} catch (error) {
				if (error.code === 'auth/email-already-in-use') {
					Swal.fire({
						icon: "error",
						title: "Error...",
						text: "This email is already in use",
					});
					return;
				}
			}


			const response = await axios.post(backUrl + "signup", {
				email,
				referrer,
				token,
			});

			if (response.data.status === true) {
				console.log("Verifying Email")
				Swal.fire({
					icon: "success",
					title: "Registration Complete",
					text: "Click the link in the email to verify your account",
					
					closeButtonHtml: `
						<span class="cross-1px"></span>
					`,
				});
				history.push(routes.SIGN_IN);
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
		} finally {
			this.setState({ isSubmitting: false });
		}
	}






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
		if (
			validator.isStrongPassword(value, {
				minLength: 8,
				minNumbers: 1,
				minSymbols: 1,
			})
		) {
			this.setState(byPropKey("validationFlag", true));
			// this.setState({setErrorMessage:'Is Strong Password'});
		} else {
			this.setState(byPropKey("validationFlag", false));
			// this.setState({setErrorMessage:'Is Not Strong Password'});
		}
	};

	render() {
		const {
			username,
			email,
			passwordOne,
			passwordTwo,
			error,
			showingAlert,
			isSubmitting,
		} = this.state;
		//a boolen to perform validation
		// const isInvalid = passwordOne !== passwordTwo || passwordOne === "" || email === "" || username === "";

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
									Create Account
								</h3>
							</div>
							<div className="card-body">
								<div className="mb-5">
									<input
										type="text"
										name="name"
										id="exampleName"
										className="form-control mb-4"
										placeholder="Full name"
										value={username}
										onChange={(e) =>
											this.setState(byPropKey("username", e.target.value))
										}
										required
										autoComplete="name"
									/>
									<input
										type="email"
										name="email"
										id="exampleEmail"
										className="form-control mb-4"
										placeholder="Email Address"
										value={email}
										onChange={(e) =>
											this.setState(byPropKey("email", e.target.value))
										}
										required
										autoComplete="email"
									/>
									<input
										type="password"
										name="password"
										id="examplePassword1"
										className="form-control mb-4"
										placeholder="Password"
										value={passwordOne}
										onChange={(e) => this.validate("passwordOne", e.target.value)}
										required
										autoComplete="new-password"
									/>
									<input
										type="password"
										name="cpassword"
										id="examplePassword2"
										className="form-control mb-4"
										placeholder="Confirm Password"
										value={passwordTwo}
										onChange={(e) => this.validate("passwordTwo", e.target.value)}
										required
										autoComplete="new-password"
									/>

									<div className="form-check">
										<input
											type="checkbox"
											className="form-check-input"
											id="form-checkbox"
											required
										/>
										<label className="form-check-label" htmlFor="form-checkbox">
											<span className="text-muted">
												I agree to the {" "}
											</span>
											<Link to="/terms-and-conditions" className='fw-semibold link-underline'>Terms & Conditions</Link>
										</label>
									</div>
								</div>

								<Button
									type="submit"
									variant='info'
									className='w-100'
								>
									{isSubmitting ? <Spinner /> : "Create Account"}
								</Button>

								<div className="form-separator">
									<span className="form-separator__content">or</span>
								</div>

								<Button
									variant='light'
									className="w-100 mb-4"
									onClick={this.onGoogle}
								>
									<img src={iconGoogle} alt="google" />&nbsp;&nbsp;
									Sign with Google
								</Button>
								<Button
									variant='light'
									className="w-100 mb-4"
									onClick={this.onApple}
								>
									<img src={iconApple} alt="apple" />&nbsp;&nbsp;
									Sign with Apple
								</Button>
								<Button
									variant='light'
									className="w-100"
									onClick={this.onMicrosoft}
								>
									<img src={iconMicorsoft} alt="microsoft" />&nbsp;&nbsp;
									Sign with Microsoft
								</Button>

								<button onClick={() => {
									Swal.fire({
										icon: "success",
										title: "Registration Complete",
										text: "Click the link in the email to verify your account",
										closeButtonHtml: `
											<span class="cross-1px"></span>
										`,
									});
								}}>sadf</button>

							</div>
						</form>
					</div>

					<h5 className='mt-5 text-center'>
						<span className="text-muted">
							Already have an account?
						</span>
						{' '}
						<Link to="/login" className='link-underline fw-semibold'>
							Sign in here
						</Link>
					</h5>
				</div>
			</div>
		);
	}
}
export default withRouter(SignUpPage); //using a HoC to get access to history
const Signup = withGoogleReCaptcha(SignupInner);
export { Signup };
