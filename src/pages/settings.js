import React, {useEffect, useState, Fragment} from "react";
import {Tab, Row, Col, Nav} from "react-bootstrap";
import {useHistory} from "react-router-dom";
import Swal from "sweetalert2";
import moment from "moment";
import validator from "validator";
import axios from "axios";
import {RampInstantSDK} from "@ramp-network/ramp-instant-sdk";
import {auth_profile} from "../components/firebase/firebase";
import {auth} from "../components/firebase";
import {doGetAnUser, updateUserData} from "../components/firebase/auth";
import Spinner from "../components/Spinner";
import {db} from "../components/firebase/firebase";
import {backUrl, ethPriceURL} from "../components/constants/routes";
import {coinbase_fee, withdraw_fee} from "../components/constants/const";
import firebase from "firebase";

import {
	accountSelector,
} from '../store/selectors';
import {connect} from 'react-redux';

function Settings() {

	const [user, setUser] = useState(null);
	const [balance, setBalance] = useState(0);

	const [width, setWidth] = useState(800);
	const [ethPriceData, setEthPriceData] = useState(2000);
	const handleWindowResize = () => {
		setWidth(window.innerWidth);
	}

	useEffect(() => {
		handleWindowResize();
		const unsubscribe = firebase.auth().onAuthStateChanged(user => {
			setUser(user);
		});
		window.addEventListener("resize", handleWindowResize);
		return () => {window.removeEventListener("resize", handleWindowResize); unsubscribe();}
	}, []);

	useEffect(() => {
		if (!user) {
			// console.error("User not logged in");
			return;
		}
		// console.log("running fetch2fa");
		fetch2fa();
	}, [user]);

	const [documents, setDocuments] = useState([]);
	const [fullTransactionData, setFullTransactionData] = useState([]);
	const [transactionData, setTransactionData] = useState([]);

	const [direction, setDirection] = useState(0);
	const [currentDate, setCurrentDate] = useState(0);
	const [transactionPage, setTransactionPage] = useState(0);

	const [searchWord, setSearchWord] = useState([]);
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [passwordError, setPasswordError] = useState({
		currentPasswordError: "",
		confirmPasswordError: "",
	});
	const [referrals, setReferrals] = useState("0");
	const [withdrawAddress1, setCurrentWithdrawAddress] = useState("Empty");

	const uid = localStorage.getItem("account-info");
	const history = useHistory();
	const currentUser = auth_profile.currentUser;

	useEffect(() => {
		if (!uid) {
			localStorage.clear();
			history.push("/login");
		}
		doGetAnUser(uid).then((query) => {
			if (query.docs.length !== 0) {
				let res = query.docs[0].data();
				setUser(res);
			}
		});
		async function fetchData() {
			await getReferrals();
			await getWithdrawAddress();
			let ethPriceData = await axios.get(ethPriceURL);
			if (ethPriceData.data) {
				setEthPriceData(parseFloat(ethPriceData.data.USD));
			}
		}
		fetchData();
		return () => {

		};
	}, [history, uid]);

	useEffect(() => {
		const unsubscribe = firebase
			.firestore()
			.collection('deposit')
			.doc(uid)
			.collection('deposit')
			.orderBy("timestamp")
			.startAfter(currentDate)
			.onSnapshot(snapshot => {
				const updatedDocuments = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				}));
				setDocuments(updatedDocuments);
			});
		return () => unsubscribe();
	}, [uid]);


	useEffect(() => {
		// console.log("Profile useEffect querySnapshot userTransaction 0 = : ", transactionPage, transactionData.length, currentDate);
		if (transactionData.length === 0) {
			if (transactionPage === 0) {
				db.collection("UserTransaction").doc(uid).collection("userTransaction")
					.orderBy("timestamp", "desc")
					.limit(20)
					.get().then((querySnapshot) => {
						console.log("Profile useEffect querySnapshot userTransaction 0 = : ");
						querySnapshot.docChanges().forEach((userTransactionDoc) => {
							let userTransaction = userTransactionDoc.doc.data();
							if (fullTransactionData.filter((element) => element.transaction_hash === userTransaction.transaction_hash).length === 0) {
								setFullTransactionData(fullTransactionData => [...fullTransactionData, userTransaction]);
								setTransactionData(transactionData => [...transactionData, userTransaction]);
							}
						});
					});
			} else {
				if (direction === 1) {
					db.collection("UserTransaction").doc(uid).collection("userTransaction")
						.orderBy("timestamp", "desc")
						// .where("timestamp", ">", currentDate)
						.startAfter(currentDate)
						.limit(20)
						.get().then((querySnapshot) => {
							console.log("Profile useEffect querySnapshot userTransaction 1 = : ");
							querySnapshot.docChanges().forEach((userTransactionDoc) => {
								let userTransaction = userTransactionDoc.doc.data();
								if (fullTransactionData.filter((element) => element.transaction_hash === userTransaction.transaction_hash).length === 0) {
									setFullTransactionData(fullTransactionData => [...fullTransactionData, userTransaction]);
									setTransactionData(transactionData => [...transactionData, userTransaction]);
								}
							});
						});
				} else {
					db.collection("UserTransaction").doc(uid).collection("userTransaction")
						.orderBy("timestamp", "asc")
						.startAfter(currentDate)
						.limit(20)
						.get().then((querySnapshot) => {
							console.log("Profile useEffect querySnapshot userTransaction -1 = : ");
							querySnapshot.docChanges().forEach((userTransactionDoc) => {
								let userTransaction = userTransactionDoc.doc.data();
								if (fullTransactionData.filter((element) => element.transaction_hash === userTransaction.transaction_hash).length === 0) {
									setFullTransactionData(fullTransactionData => [userTransaction, ...fullTransactionData]);
									setTransactionData(transactionData => [userTransaction, ...transactionData]);
								}
							});
						});
				}
			}
		}
	}, [transactionPage]);

	const moveTransactionPage = (page) => {
		if (page === 1) {
			if (fullTransactionData.length === 20) {
				setDirection(1);
				setCurrentDate(currentDate => fullTransactionData[fullTransactionData.length - 1].timestamp);
				setFullTransactionData([]);
				setTransactionData([]);
				setTransactionPage(transactionPage => transactionPage + 1);
			}
		} else if (page === -1 && transactionPage >= 1) {
			setDirection(-1);
			setCurrentDate(currentDate => fullTransactionData[0].timestamp);
			setFullTransactionData([]);
			setTransactionData([]);
			setTransactionPage(transactionPage => transactionPage - 1);
		}
		else if (transactionPage !== 0) {
			setDirection(0);
			setCurrentDate(currentDate => Math.floor(new Date().getTime() / 1000));
			setFullTransactionData([]);
			setTransactionData([]);
			setTransactionPage(0);
		}
	}

	const initial_rampInstant = () => {
		new RampInstantSDK({
			hostAppName: "Stocksfc.com",
			hostLogoUrl: "https://app.stocksfc.com/img/stocksfc.png",
			swapAsset: "ETH_ETH",
			webhookStatusUrl: `https://loadbalancer.web-services-uk-anubis.com:60435/a4529f49354d0467ea0c2abc67083b3f7c6afjrhc566787a0bc48ef858ghf4?customer_id=${uid}`,
			fiatCurrency: "GBP",
			//url: 'https://app.demo.ramp.network/',
			fiatValue: 250,
			userAddress: '0x28bd6f110138db0007e103ee7f176a2c9d246436',
			hostApiKey: 'kfgpytdr43haoovb59hfeyzwsjcwxeaxrtgc39cr',
			containerNode: document.getElementById("ramp-container"),
		}).show();
	}

	const withdraw_rampInstant = (swapAmount) => {
		new RampInstantSDK({
			hostAppName: "Stocksfc.com",
			hostLogoUrl: "https://app.stocksfc.com/img/stocksfc.png",
			swapAsset: "ETH_ETH",
			webhookStatusUrl: `https://loadbalancer.web-services-uk-anubis.com:60435/a4529f49354d0467ea0c2abc67083b3f7c6afjrhc566787a0bc48ef858ghf4?customer_id=${uid}`,
			fiatCurrency: "GBP",
			swapAmount: swapAmount,
			userAddress: '0x88af7D55745F7b87Fcec6C75bedC96A5cd4344c3',
			hostApiKey: 'kfgpytdr43haoovb59hfeyzwsjcwxeaxrtgc39cr',
			containerNode: document.getElementById("ramp-container"),
			enabledFlows: "OFFRAMP",
			defaultFlow: "OFFRAMP",
		}).show();
	};

	const getReferrals = async () => {
		let query_referrals = await db.collection("referrals").doc(localStorage.getItem("account-info")).get();
		if (query_referrals.data() !== undefined && query_referrals.data() !== null && query_referrals.data() !== []) {
			let referrals = query_referrals.data().referrals;
			if (referrals !== null && referrals !== undefined) {
				setReferrals(referrals);
			}
		}
	}

	const getWithdrawAddress = async () => {
		let query_getWithdrawAddress = await db.collection("withdrawAddresses").doc(localStorage.getItem("account-info")).get();
		if (query_getWithdrawAddress.data() !== undefined && query_getWithdrawAddress.data() !== null && query_getWithdrawAddress.data() !== []) {
			let withdrawAddress1 = query_getWithdrawAddress.data().withdrawalAddress;
			if (withdrawAddress1 !== null && withdrawAddress1 !== undefined) {
				setCurrentWithdrawAddress(withdrawAddress1);
				return withdrawAddress1;
			}
		}
		return null;
	};

	// console.log("current", withdrawAddress1);

	const changePassword = async (e) => {
		e.preventDefault();
		// Check if confirm password is correct
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setPasswordError({
				...passwordError,
				confirmPasswordError: "Passwords do not match",
			});
			return false;
		}

		// Check if new password is a strong password
		if (!validator.isStrongPassword(passwordData.newPassword, {
			minLength: 8,
			minNumbers: 1,
			minSymbols: 1,
			minUppercase: 0,
		})) {
			Swal.fire({
				icon: "error",
				title: "Weak Password",
				text: "Passwords must be a minimum of 8 characters and contain numbers and special characters",
			});
			return false;
		}

		// Check if 2FA is enabled for the user
		const twoFAEnabled = "true"
		if (twoFAEnabled) {
			// Get 2FA code
			const twoFACode = await get_2fa_code(user.email);

			// Prompt user for 2FA code
			Swal.fire({
				title: "Enter 2FA Code",
				input: "text",
				inputAttributes: {
					autocapitalize: "off",
				},
				showCancelButton: true,
				confirmButtonText: "Verify",
				showLoaderOnConfirm: true,
				preConfirm: (code) => {
					return check_2fa_code(user.email, code)
						.then((response) => {
							return response;
						})
						.catch((error) => {
							throw error;
						});
				},
				allowOutsideClick: () => !Swal.isLoading(),
			})
				.then(async (result) => {
					if (result.value) {
						console.log("correct 2fa");
						// Verify current password
						auth.doSignInWithEmailAndPassword(user.email, passwordData.currentPassword)
							.then((res) => {
								// Update password
								currentUser.updatePassword(passwordData.newPassword)
									.then(() => {
										var newUser = {...user};
										newUser["passwordOne"] = passwordData.newPassword;
										Swal.fire({
											icon: "success",
											title: "Password Changed",
											text: "Password successfully changed",
										});
										setPasswordData({currentPassword: "", newPassword: "", confirmPassword: ""});
										passwordChanged();
									})
									.catch(function (error) {
										Swal.fire({
											icon: "error",
											title: "Error...",
											text: error.message,
										});
									});
							})
							.catch((error) => {
								Swal.fire({
									icon: "error",
									title: "Incorrect Current Password",
									text: "The current password is not correct",
								});
								setPasswordData({
									currentPassword: "", newPassword: "",
									confirmPassword: ""
								});
							});
					}


				})
				.catch((error) => {
					Swal.fire({
						icon: "error",
						title: "Error...",
						text: error.message,
					});
				});
		} else {
			// Verify current password
			auth.doSignInWithEmailAndPassword(user.email, passwordData.currentPassword)
				.then((res) => {
					// Update password
					currentUser.updatePassword(passwordData.newPassword)
						.then(() => {
							var newUser = {...user};
							newUser["passwordOne"] = passwordData.newPassword;
							Swal.fire({
								icon: "success",
								title: "Password Change",
								text: "Password successfully changed",
							});
							setPasswordData({currentPassword: "", newPassword: "", confirmPassword: ""});
							passwordChanged();
						})
						.catch(function (error) {
							Swal.fire({
								icon: "error",
								title: "Error...",
								text: error.message,
							});
						});
				})
				.catch((error) => {
					Swal.fire({
						icon: "error",
						title: "Incorrect Current Password",
						text: "The current password is not correct",
					});
					setPasswordData({currentPassword: "", newPassword: "", confirmPassword: ""});
				});
			console.log("incorrect 2fa5")
		}
		console.log("incorrect 2fa3")
	};

	const check_2fa_code = async (email, code) => {
		try {
			const response = await axios.post(backUrl + "check_2fa_code", {email, code});
			console.log("actual response", response.data)
			if (response.data !== true) {
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: 'Incorrect Code.',
				});
			}
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

	const twofa_check = async (email) => {
		try {
			const response = await axios.post(backUrl + "2fa_check", {email});
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

	const get_2fa_code = async (email) => {
		try {
			const response = await axios.post(backUrl + "get_2fa_code", {email});
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

	const onSearchChange = (e) => {
		let keyWord = e.target.value;
		setSearchWord(keyWord);
		keyWord = keyWord.charAt(0).toUpperCase() + keyWord.slice(1);
		let transactionlist = [];
		for (let i = 0; i < fullTransactionData.length; i++) {
			if (fullTransactionData[i].eth_tokenName.startsWith(keyWord)) {
				transactionlist.push(fullTransactionData[i]);
			}
		}
		setTransactionData(transactionlist);
	}

	const create_retirar = async (amount1) => {
		let headers = {
			Accept: "application/json",
			"Content-Type": "application/json"
		};
		const user = firebase.auth().currentUser
		if (user) {
			const idToken = await user.getIdToken();
			const email = user.email;
			const twoFaEnabled = "false";

			if (twoFaEnabled) {
				const twoFaCode = await get_2fa_code(email);

				// Show a prompt for the user to enter the 2FA code
				const {value: code} = await Swal.fire({
					title: 'Enter 2FA Code',
					input: 'text',
					inputValue: twoFaCode,
					showCancelButton: true,
					inputValidator: value => {
						if (!value) {
							return 'You need to enter the code!';
						}
					}
				});

				if (code) {
					const isValid = await check_2fa_code(email, code);

					if (isValid) {
						var retirar_res = await axios.post(backUrl + "account_services_request", {
							"amount1": amount1,
						},
							{
								headers: {
									Authorization: 'Bearer ' + idToken
								}
							});
						await processResult(retirar_res.data);
					} else {
						Swal.fire({
							icon: 'error',
							title: 'Error',
							text: 'Incorrect Code.',
						});
					}
				}
			} else {
				var retirar_res = await axios.post(backUrl + "account_services_request", {
					"amount1": amount1,
				},
					{
						headers: {
							Authorization: 'Bearer ' + idToken
						}
					});
				await processResult(retirar_res.data);
			}
		} else {
			console.log("User not logged in");
		}
	};

	const [is2FAEnabled, setIs2FAEnabled] = useState(null);

	const fetch2fa = async () => {
		console.log("running fetch2fa 2")
		try {
			const user = firebase.auth().currentUser;
			if (!user) {
				console.error("User not logged in");
				return;
			}
			const idToken = await user.getIdToken();
			console.log("idtoken", idToken)
			const headers = {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${idToken}`,
			};
			const response = await axios.post(
				`${backUrl}2fatoggle`,
				{option: "empty"},
				{headers}
			);
			const {newsetting} = response.data;
			if (newsetting === "on") {
				setIs2FAEnabled(true);
				console.log("2fa enabled")
			} else if (newsetting === "off") {
				setIs2FAEnabled(false);
				console.log("2fa disabled")
			}
			return response.data;
		} catch (error) {
			console.error("Error sending axios request:", error);
		}
	};

	const toggle2FA = async (option, event) => {
		try {
			const user = firebase.auth().currentUser;
			if (!user) {
				console.error("User not logged in");
				return;
			}
			const idToken = await user.getIdToken();
			const headers = {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${idToken}`,
			};
			const response = await axios.post(
				`${backUrl}2fatoggle`,
				{option},
				{headers}
			);
			const {newsetting} = response.data;
			if (newsetting === "on") {
				setIs2FAEnabled(true);
			} else if (newsetting === "off") {
				setIs2FAEnabled(false);
			}
			return response.data;
		} catch (error) {
			console.error("Error sending axios request:", error);
		}
	};

	useEffect(() => {
		firebase.auth().onAuthStateChanged(async (user) => {
			if (user) {
				const idToken = await user.getIdToken();
				console.log(idToken);
				var res = await axios.post(backUrl + "account/get_eth_balance", {}, {
					headers: {
						Authorization: 'Bearer ' + idToken
					}
				});

				if (res.data.status) {
					setBalance(res.data.balance);
					console.log("User's Ethereum balance:", res.data.balance);
				}
			} else {
				console.log("User not logged in");
			}
		});
	}, []);

	const passwordChanged = async () => {
		try {
			const user = firebase.auth().currentUser
			if (!user) {
				console.error("User not logged in");
				return;
			}
			const idToken = await user.getIdToken()
			const headers = {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${idToken}`,
			};
			const changePassword = await axios.post(
				`${backUrl}changePassword`,
				{},
				{headers}
			);
			return changePassword.data;
		} catch (error) {
			console.error("Error sending axios request:", error);
		}
	};

	const startkyc = async () => {
		try {
			const {value: formValues} = await Swal.fire({
				title: 'Generate Token',
				html: `
				<input id="swal-input1" class="swal2-input" type="text" placeholder="First Name" pattern="[A-Za-z]{1,20}" maxlength="20">
				<input id="swal-input2" class="swal2-input" type="text" placeholder="Last Name" pattern="[A-Za-z]{1,20}" maxlength="20">
				<input id="swal-input3" class="swal2-input" type="text" placeholder="Date of Birth (DD-MM-YYYY)" pattern="\d{2}-\d{2}-\d{4}" maxlength="10">
				`,
				closeButtonHtml: `
					<span class="cross-1px"></span>
				`,
				focusConfirm: false,
				showCancelButton: true,
				preConfirm: () => {
					return [
						document.getElementById('swal-input1').value,
						document.getElementById('swal-input2').value,
						document.getElementById('swal-input3').value,
					];
				},
			});

			if (formValues) {
				const [firstName, lastName, dob] = formValues;
				const [day, month, year] = dob.split("-");
				const formattedDob = `${year}-${month}-${day}`;

				const user = firebase.auth().currentUser;
				if (user) {
					const idToken = await user.getIdToken();

					const response = await axios.post(backUrl + "kyctoken", {
						firstName,
						lastName,
						dob: formattedDob,
					}, {
						headers: {
							Authorization: 'Bearer ' + idToken,
						}
					});
					setToken(response.data.url);
				} else {
					Swal.fire({
						title: "Error",
						text: "User not logged in",
						icon: "error",
						confirmButtonText: "OK"
					});
				}
			}
		} catch (err) {
			Swal.fire({
				title: "Error",
				text: err.message,
				icon: "error",
				confirmButtonText: "OK"
			});
		}
	};

	const [token, setToken] = useState('');

	useEffect(() => {
		if (token) {
			window.location.href = token;
		}
	},);

	const EthWithdrawal = async () => {
		const withdrawAddress = await getWithdrawAddress();
		if (withdrawAddress === null || withdrawAddress === undefined || withdrawAddress === '') {
			Swal.fire("Please set a withdrawal address", "", "warning");
		} else {
			const maximumWithdrawal = balance - coinbase_fee;
			const {value: enteredAmount} = await Swal.fire({
				title: "Withdraw",
				confirmButtonText: 'Withdraw',
				html: `
				<h3>Coinbase Payment</h3>
				<h4 style="color:#989A9D; font-size: .9rem; padding-bottom:.5rem">Currency : <span style="color: #FDFDFD; font-size: .8rem">USD</span></h4>
				<input class="swal2-input" placeholder="Enter Amount" type="text" style="border-radius: 5px;" />
				<div style="display: flex; justify-content: space-between; margin-top : 1.4rem ">
					<div style="">
						<div class="modal-bottom-items-title">Total</div>
						<div class="modal-bottom-items-content">£${1.00}</div>
					</div>
					<div style="">
						<div class="modal-bottom-items-title">Fee</div>
						<div class="modal-bottom-items-content">£${0.10}</div>
					</div>
					<div style="">
						<div class="modal-bottom-items-title">You will receive:</div>
						<div class="modal-bottom-items-content">£${0.90}</div>
					</div>
				</div>
				`,
				// html: `Enter the amount to withdraw <br>Current balance: ${balance}<br>
				// 		 Current withdraw fee: ${coinbase_fee}<br>
				// 		 Maximum withdrawal: ${maximumWithdrawal}<br>
				// 		 Withdraw Address: ${withdrawAddress}`,
				closeButtonHtml: `
					<span class="cross-1px"></span>
				`,
				showCancelButton: true,
				inputValidator: (value) => {
					if (!value) {
						return 'You need to enter an amount!';
					}
					if (Number(value) > balance) {
						return 'The amount entered is greater than your balance!';
					}
				},
				onOpen: () => {
					const input = document.getElementById('swal2-input');
					input.addEventListener('input', () => {
						const updatedAmount = Number(input.value) - Number(coinbase_fee);
						Swal.update({
							text: `Amount after deducting fee: ${updatedAmount}`
						});
					});
				},
			});

			if (enteredAmount) {
				setAmount(enteredAmount);

				try {
					await create_retirar(enteredAmount);
				} catch (error) {
					console.error(`Error in withdraw request: ${error}`);
					Swal.fire({
						icon: 'error',
						title: 'Error with withdrawal',
						text: 'Please try again later.',
					});
				}
			}
		}
	};

	const newWithdrawAddress = async (withdrawAddress) => {
		let headers = {
			Accept: "application/json",
			"Content-Type": "application/json"
		};
		const user = firebase.auth().currentUser
		if (user) {
			const idToken = await user.getIdToken()
			var newAddress_res = await axios.post(backUrl + "set_new_address", {
				"newAddress": withdrawAddress,
			},
				{
					headers: {
						Authorization: 'Bearer ' + idToken
					}
				});
			await processResult(newAddress_res.data);
		} else {
			console.log("User not logged in")
		}
	}

	const processResult = async (res) => {
		if (res === null) {
			Swal.fire({
				icon: 'error',
				title: 'Error...',
				text: "Error 498 - connection error please report to StocksFC!",
			});
		}
		else {
			if (res.status === "success") {
				Swal.fire({
					icon: 'success',
					title: 'Success',
					text: "Your Withdrawal Request was submitted successfully",
				});
			}
			else {
				if (res.status === "success2") {
					Swal.fire({
						icon: 'success',
						title: 'success',
						text: "Withdrawal Address changed - Please wait 24 hours to withdraw to this address",
					});
				}
				else if (res.error === "deposit") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Your Balance is too low for this withdrawal",
					});
				}
				else if (res.error === "amount") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Your Balance is too low for this withdrawal",
					});
				}
				else if (res.error === "invalidEth") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Please enter a valid Ethereum Address",
					});
				}
				else if (res.error === "error4") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Please enter a valid Ethereum Address",
					});
				}
				else if (res.error === "age") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "You must wait 24 hours to withdraw after changing your withdraw address",
					});
				}
				else if (res.error === "high") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Enter an amount between 0.0001 and 100",
					});
				}
				else if (res.error === "failed") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Error 550 please contact support",
					});
				}
				else if (res.error === "error8") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Error 983 please contact support",
					});
				}
				else {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Error 330 - Please report to StocksFC",
					});
				}
			}
		}

	}

	const create_charge = async (amount) => {
		let headers = {
			Accept: "application/json",
			"Content-Type": "application/json"
		};
		const user = firebase.auth().currentUser
		if (user) {
			const idToken = await user.getIdToken()
			var depositresult = await axios.post(backUrl + "coinbase_deposit", {
				"amount": amount,
			},
				{
					headers: {
						Authorization: 'Bearer ' + idToken
					}
				})
				.then((response) => {
					window.open(response.data.data, "_self");
				});
		} else {
			console.log("User not logged in")
		}
	}

	const [amount, setAmount] = useState('');

	const handleWithdraw = async () => {
		const maximumWithdrawal = balance - coinbase_fee;
		const {value: enteredAmount} = 
		// await Swal.fire({
		// 	title: "Withdraw to Bank",
		// 	html: `Enter the amount to withdraw <br>Current balance: ${balance}<br>
		// 			 Current withdraw fee: ${coinbase_fee}<br>
		// 			 Maximum withdrawal: ${maximumWithdrawal}`,
		// 	input: 'text',
		// 	closeButtonHtml: `
		// 		<span class="cross-1px"></span>
		// 	`,
		// 	inputValue: amount,
		// 	showCancelButton: true,
		// 	inputValidator: (value) => {
		// 		if (!value) {
		// 			return 'You need to enter an amount!';
		// 		}
		// 		if (Number(value) > balance) {
		// 			return 'The amount entered is greater than your balance!';
		// 		}
		// 	},
		// 	onOpen: () => {
		// 		const input = document.getElementById('swal2-input');
		// 		input.addEventListener('input', () => {
		// 			const updatedAmount = Number(input.value) - Number(coinbase_fee);
		// 			Swal.update({
		// 				text: `Amount after deducting fee: ${updatedAmount}`
		// 			});
		// 		});
		// 	}
		// });
		await Swal.fire({
			title: "Withdraw",
			confirmButtonText: 'Withdraw',
			html: `
			<h3>Coinbase Payment</h3>
			<h4 style="color:#989A9D; font-size: .9rem; padding-bottom:.5rem">Currency : <span style="color: #FDFDFD; font-size: .8rem">USD</span></h4>
			<input class="swal2-input" placeholder="Enter Amount" type="text" style="border-radius: 5px;" />
			<div style="display: flex; justify-content: space-between; margin-top : 1.4rem ">
				<div style="">
					<div class="modal-bottom-items-title">Total</div>
					<div class="modal-bottom-items-content">£${1.00}</div>
				</div>
				<div style="">
					<div class="modal-bottom-items-title">Fee</div>
					<div class="modal-bottom-items-content">£${0.10}</div>
				</div>
				<div style="">
					<div class="modal-bottom-items-title">You will receive:</div>
					<div class="modal-bottom-items-content">£${0.90}</div>
				</div>
			</div>
			`,
			// html: `Enter the amount to withdraw <br>Current balance: ${balance}<br>
			// 		 Current withdraw fee: ${coinbase_fee}<br>
			// 		 Maximum withdrawal: ${maximumWithdrawal}<br>
			// 		 Withdraw Address: ${withdrawAddress}`,
			closeButtonHtml: `
				<span class="cross-1px"></span>
			`,
			showCancelButton: true,
			inputValidator: (value) => {
				if (!value) {
					return 'You need to enter an amount!';
				}
				if (Number(value) > balance) {
					return 'The amount entered is greater than your balance!';
				}
			},
			onOpen: () => {
				const input = document.getElementById('swal2-input');
				input.addEventListener('input', () => {
					const updatedAmount = Number(input.value) - Number(coinbase_fee);
					Swal.update({
						text: `Amount after deducting fee: ${updatedAmount}`
					});
				});
			},
		});
		if (enteredAmount) {
			setAmount(enteredAmount);

			try {
				const user = firebase.auth().currentUser;
				if (!user) {
					throw new Error('No user is signed in.');
				}

				const idToken = await user.getIdToken();

				const response = await axios.post(backUrl + "ramp_withdraw_request", {enteredAmount}, {
					headers: {
						Authorization: `Bearer ${idToken}`,
					},
				});
				const {data} = response;

				if (data.status === true) {
					withdraw_rampInstant(data.amount);
				} else if (data.error) {
					Swal.fire({
						title: 'Error',
						text: data.error,
						icon: 'error',
					});
				}

			} catch (error) {
				console.error(`Error in withdraw request: ${error}`);
				Swal.fire({
					icon: 'error',
					title: 'Error with withdrawal',
					text: 'Please try again later.',
				});
			}
		}
	};

	return (
		<div className="container-fluid">
			<Tab.Container defaultActiveKey="deposit">
				<Row>
					<Col lg={3}>
						<Nav variant="pills" className='flex-column'>
							<Nav.Item>
								<Nav.Link eventKey="deposit">Deposit</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="withdraw">Withdraw</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="mytransaction">My Transactions</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="referrals">Referrals</Nav.Link>
							</Nav.Item>
						</Nav>
					</Col>
					<Col lg={9} className="mt-5">
						<Tab.Content>
							<Tab.Pane eventKey="deposit">

								<Row>
									<Col md='6'>
										<div className="card">
											<div className="card-body">
												<h4>
													Deposit with Ramp
												</h4>
												<p className="text-muted">
													Allows you to buy BTC and other digital currencies with fiat money like euros, British pounds, American dollars, and so on.
												</p>
												<button className="btn btn-success" onClick={() => {initial_rampInstant()}}>
													Deposit
												</button>
											</div>
										</div>
									</Col>
									<Col md='6'>
										<div className="card">
											<div className="card-body">
												<h4>
													Deposit with Coinbase Payment Gateway
												</h4>
												<p className="text-muted">
													Coinbase offers you the ability to buy, sell, and exchange over 200 tradable cryptocurrencies.
												</p>
												<button className="btn btn-success" onClick={() => {
													Swal.fire({
														html:
															`<ul>
																<h6>Coinbase Payment ( currency : USD )</h6>
																<h6 class="text-center" id="total">Total : $0</h6>
																<h6 class="text-center" id="fee">Fee: $0</h6>
																<h6 class="text-center" id="receive">You will receive $0</h6>
															</ul>`,
														title: `DEPOSIT BY COINBASE`,
														showCancelButton: true,
														confirmButtonColor: "#26de81",
														cancelButtonColor: "#d33",
														confirmButtonText: "Deposit",
														cancelButtonText: "Cancel",
														preConfirm: () => {
															return {
																current_amount: parseFloat(document.getElementById("amount").value),
															}
														},
														input: 'text',
														didOpen: () => {
															const input = Swal.getInput()
															input.className = "swal2-input ml-5 mr-5"
															input.id = "amount"
															input.placeholder = "Enter Amount"
															input.oninput = () => {
																let amount = parseFloat(document.getElementById("amount").value);
																document.getElementById("total").innerHTML = "Total : $" + (amount * 1).toFixed(2).toString();
																document.getElementById("fee").innerHTML = "Fee: $" + (amount * coinbase_fee).toFixed(2).toString();
																document.getElementById("receive").innerHTML = "You will receive $" + (amount * (1 - coinbase_fee)).toFixed(2).toString();
															}
														}
													}).then(async (result) => {
														if (result.isConfirmed) {
															if (result.value.current_amount === undefined) {
																Swal.fire("Input amount as correctly!", "", "warning");
															}
															else if (result.value.current_amount !== "0" && result.value.current_amount !== null && result.value.current_amount !== "" && parseFloat(result.value.current_amount) > 0) {
																await create_charge(result.value.current_amount);
															} else {
																Swal.fire("Input amount as correctly!", "", "warning");
															}
														}
													})
												}}>
													Deposit
												</button>
											</div>
										</div>
									</Col>
								</Row>
								<div className="card card--overflow deposit-history">
									<div className="card-header">
										<h3 className="card-title">Deposit History</h3>
									</div>
									<div className="flex-grow-scroll">
										<div className="card-body card-body--table">
											<div className="table-responsive">
												<table className="table">
													<thead>
														<tr>
															<th>Time</th>
															<th>ID</th>
															<th>Method</th>
															<th>Eth Amount</th>
															<th>USD Amount</th>
															<th>Status</th>
														</tr>
													</thead>
													<tbody>
														{documents.map(doc => {
															let amountPurchased = parseFloat(doc.amountPurchased.replace(/[^0-9.]/g, ''))
															return (
																<tr key={doc.id}>
																	<td>{moment.unix(doc.timestamp).format("DD/MM/YY h:mm:ss A")}</td>
																	<td>{doc.code}</td>
																	<td>{doc.id2}</td>
																	<td>{!isNaN(amountPurchased) ? amountPurchased.toFixed(6) : doc.amountPurchased}</td>
																	<td>${doc.price}</td>
																	<td>{doc.current_status}</td>
																</tr>
															)
														})}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								</div>
							</Tab.Pane>

							<Tab.Pane eventKey="withdraw">
								<div className="card">
									<div className="card-body" style={{paddingTop: '0px', paddingBottom: '0px'}}>
										<Row className='align-items-center'>
											<Col lg="6" md="6" sm="12" xs="12" className="" style={{paddingTop: '1rem', paddingBottom: '1rem'}}>
												<h5>Withdrawal Address</h5>
												<p className="text-muted mb-0">
													{withdrawAddress1}
												</p>
											</Col>
											<Col lg="6" md="6" sm="12" xs="12" className="">
												<div id="ramp-container" className="input-group d-block">
													<Col lg="4" md="6" sm="12" xs="12" className="" style={{float: "right", paddingBottom: '1rem', paddingTop: '1rem'}}>
														<button className="btn btn-info w-100" style={{float: "right", color: 'whitesmoke'}} onClick={() => {
															Swal.fire({
																html:
																	`<ul style="padding-bottom: .5rem">
																			<h6 class="text-center" id="receive">Enter your new Ethereum withdrawal address</h6>
																			</ul>
																			<input class="swal2-input" placeholder="Enter Amount" type="text" style="border-radius: 5px;" />
																			`,
																title: `Withdrawal Address`,
																closeButtonHtml: `
																	<span class="cross-1px"></span>
																`,
																showCancelButton: true,
																confirmButtonColor: "#26de81",
																cancelButtonColor: "#d33",
																confirmButtonText: "Set New Address",
																cancelButtonText: "Cancel",
																preConfirm: () => {
																	return {
																		current_withdrawAddress: (document.getElementById("withdrawAddress").value),
																	}
																},
																didOpen: () => {
																	const input = Swal.getInput()
																	input.className = "swal2-input ml-5 mr-5"
																	input.id = "withdrawAddress"
																	input.placeholder = "Ethereum Address"
																	input.oninput = () => {
																		let current_withdrawAddress = (document.getElementById("withdrawAddress").value);
																	}
																}
															}).then(async (result) => {
																if (result.isConfirmed) {
																	if (result.value.current_withdrawAddress !== "0" && result.value.current_withdrawAddress !== null && result.value.current_withdrawAddress !== "") {
																		console.log("address is ", result.value.current_withdrawAddress)
																		await newWithdrawAddress(result.value.current_withdrawAddress);
																	} else {
																		Swal.fire("withdrawAddress!", "", "warning");
																	}
																}
															})
														}}>Change Address</button>
													</Col>
												</div>
											</Col>
										</Row>
									</div>
								</div>

								<Row>
									<Col md='4'>
										<div className="card">
											<div className="card-body" style={{paddingTop: '0', paddingBottom: '0'}}>
												<Row className='align-items-center'>
													<Col lg="6" md="6" sm="12" xs="12" className="" style={{paddingTop: '1rem', paddingBottom: '1rem'}}>
														<h4 className="mb-0">
															<svg className='me-1 align-middle' width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
																<g clip-path="url(#clip0_397_111936)">
																	<path d="M9.99997 1.66797C10.1371 1.66795 10.2722 1.70178 10.3931 1.76647C10.5141 1.83116 10.6172 1.92471 10.6933 2.0388L15.53 9.29464L11.1741 11.1096L10.1658 3.71214C10.1391 3.52047 9.8608 3.52047 9.83497 3.71214L8.82664 11.1096L4.46997 9.29464L9.30664 2.0388C9.38276 1.92471 9.48587 1.83116 9.60682 1.76647C9.72777 1.70178 9.86281 1.66795 9.99997 1.66797ZM10.3208 13.2705L15.1691 11.2505L10.6941 17.9638C10.6181 18.0781 10.5149 18.1718 10.3939 18.2367C10.2729 18.3015 10.1377 18.3354 10.0004 18.3354C9.86308 18.3354 9.72791 18.3015 9.60687 18.2367C9.48584 18.1718 9.38271 18.0781 9.30664 17.9638L4.83164 11.2505L9.67914 13.2705C9.78079 13.3129 9.88983 13.3347 9.99997 13.3347C10.1101 13.3347 10.2192 13.3129 10.3208 13.2705Z" fill="#FDFDFD" />
																</g>
																<defs>
																	<clipPath id="clip0_397_111936">
																		<rect width="20" height="20" fill="white" />
																	</clipPath>
																</defs>
															</svg>
															Ethereum
														</h4>
													</Col>
													<Col lg="6" md="6" sm="12" xs="12" className="" style={{paddingBottom: "1rem", paddingTop: '1rem'}}>
														<button className="btn btn-info w-100" style={{float: "right", color: 'whitesmoke'}} onClick={EthWithdrawal}>
															Withdraw
														</button>
													</Col>
												</Row>
											</div>
										</div>
									</Col>

									<Col md='4'>
										<div className="card">
											<div className="card-body" style={{paddingTop: '0', paddingBottom: '0'}}>
												<Row className='align-items-center'>
													<Col lg="6" md="6" sm="12" xs="12" className="" style={{paddingTop: '1rem', paddingBottom: '1rem'}}>
														<h4 className="mb-0">
															<svg className='me-1 align-middle' width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
																<path d="M2.75 0.125C1.36929 0.125 0.25 1.24429 0.25 2.625V3.25H17.75V2.625C17.75 1.24429 16.6307 0.125 15.25 0.125H2.75Z" fill="#FDFDFD" />
																<path fill-rule="evenodd" clip-rule="evenodd" d="M17.75 5.125H0.25V11.375C0.25 12.7557 1.36929 13.875 2.75 13.875H15.25C16.6307 13.875 17.75 12.7557 17.75 11.375V5.125ZM2.75 8.25C2.75 7.90482 3.02982 7.625 3.375 7.625H8.375C8.72018 7.625 9 7.90482 9 8.25C9 8.59518 8.72018 8.875 8.375 8.875H3.375C3.02982 8.875 2.75 8.59518 2.75 8.25ZM3.375 10.125C3.02982 10.125 2.75 10.4048 2.75 10.75C2.75 11.0952 3.02982 11.375 3.375 11.375H5.875C6.22018 11.375 6.5 11.0952 6.5 10.75C6.5 10.4048 6.22018 10.125 5.875 10.125H3.375Z" fill="#FDFDFD" />
															</svg>
															Bank
														</h4>
													</Col>
													<Col lg="6" md="6" sm="12" xs="12" className="" style={{paddingTop: '1rem', paddingBottom: '1rem'}}>
														<button className="btn btn-info w-100" style={{float: "right", color: 'whitesmoke'}} onClick={handleWithdraw}>
															Withdraw
														</button>
													</Col>
												</Row>
											</div>
										</div>
									</Col>

									<Col md='4'>
										<div className="card">
											<div className="card-body" style={{paddingTop: 0, paddingBottom: '0'}}>
												<Row className='align-items-center'>
													<Col lg="6" md="6" sm="12" xs="12" className="" style={{paddingTop: '1rem', paddingBottom: '1rem'}}>
														<h4 className="mb-0">
															<i className="ion ion-md-alert text-warning me-1 align-middle"></i>
															KYC
														</h4>
													</Col>
													<Col lg="6" md="6" sm="12" xs="12" className="" style={{paddingTop: '1rem', paddingBottom: '1rem'}}>
														<button className="btn btn-info w-100" style={{float: "right", color: 'whitesmoke'}} onClick={startkyc}>
															Complete
														</button>
													</Col>
												</Row>
											</div>
										</div>
									</Col>
								</Row>
							</Tab.Pane>

							<Tab.Pane eventKey="mytransaction">
								<div className="card card--overflow my-transactions">
									<div className="card-header">
										<Row className="align-items-center">
											<Col lg="6" md="6" sm="12" xs="12" className="">
												<h3 className="card-title">
													My Transactions
												</h3>
											</Col>
											<Col lg="6" md="6" sm="12" xs="12" className="">
												<div className="input-group">
													<span className="input-group-text" id="inputGroup-sizing-sm">
														<i className="icon ion-md-search"></i>
													</span>
													<input
														type="text"
														className="form-control search-my-transactions"
														placeholder="Filter Current Page By Player Name"
														aria-describedby="inputGroup-sizing-sm"
														onChange={(e) => onSearchChange(e)}
														value={searchWord}
														required
													/>
												</div>
											</Col>
										</Row>
									</div>
									<div className="flex-grow-scroll">
										<div className="card-body card-body--table">
											<div className="table-responsive">
												<table className="table">
													{(currentUser?.providerData[0]) ?
														(
															<Fragment>
																<tbody>
																	{
																		width > 768 && <tr>
																			<th>Time</th>
																			<th>Type</th>
																			<th>Type 2</th>
																			<th>Token</th>
																			<th>Price</th>
																			<th>Amount</th>
																			<th>Total</th>
																		</tr>
																	}
																	{transactionData.map((transaction, key) => {
																		if (width > 768) {
																			return (
																				<tr key={key}>
																					<td>{moment.unix(transaction.timestamp).format("DD/MM/YY h:mm:ss A")}</td>
																					<td>{transaction.transaction_type}</td>
																					<td>{transaction.transaction_type2}</td>
																					<td>{transaction.eth_tokenName}</td>
																					{
																						transaction.transaction_type === "Cancel" ? <td>£{"0.00"}</td> : <td>£{parseFloat(transaction.price).toFixed(2)}</td>

																					}
																					{
																						transaction.transaction_type === "Cancel" ? <td className='text-muted'>{"0.00"}</td> : <td className='text-muted'>£{parseFloat(transaction.amount).toFixed(2)}</td>

																					}
																					{
																						transaction.transaction_type === "Cancel" ? <td>{"0.00"}</td> : <td>${transaction.total}</td>
																					}
																				</tr>
																			)
																		} else {
																			return (
																				<div key={key} className="pt-3">
																					<Row className="m-0 d-flex p-1 pl-0 pr-0">
																						<Row className="m-0 p-0 w-60">
																							<div className="text-muted fs-4 my-auto">{"Time:"}</div>
																							<div className="fs-4 d-flex my-auto">{moment.unix(transaction.timestamp).format('h:mm:ss a')} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;&nbsp;{moment.unix(transaction.timestamp).format('M/D/Y')}</span></div>
																						</Row>
																						<Row className="fw-medium text-capitalize m-0 p-0 w-40">
																							<div className="text-muted fs-4 my-auto">{"Type:"}</div>
																							<div className="fs-4 my-auto">{transaction.transaction_type}/{transaction.transaction_type2}</div>
																						</Row>
																					</Row>
																					<Row className="m-0 d-flex p-1 pl-0 pr-0">
																						<Row className="m-0 p-0 w-60">
																							<div className="text-muted fs-4 my-auto">{"Token:"}</div>
																							<div className="fs-4 d-flex my-auto">{transaction.eth_tokenName}</div>
																						</Row>
																						<Row className="fw-medium text-capitalize m-0 p-0 w-40">
																							<div className="text-muted fs-4 my-auto">{"Price:"}</div>
																							<div className="fs-4 d-flex my-auto">£{(parseFloat(transaction.price)).toFixed(2).toString()} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;&nbsp;${(parseFloat(transaction.price) * parseFloat(ethPriceData)).toFixed(2)}</span></div>
																						</Row>
																					</Row>
																					<Row className="m-0 d-flex p-1 pl-0 pr-0">
																						<Row className="m-0 p-0 w-60">
																							<div className="text-muted fs-4 my-auto">{"Amount:"}</div>
																							<div className="fs-4 my-auto">{transaction.transaction_type === 'buy' ? "+" : "-"}{(parseFloat(transaction.amount)).toFixed(2)}</div>
																						</Row>
																						<Row className="fw-medium text-capitalize m-0 p-0 w-40">
																							<div className="text-muted fs-4 my-auto">{"Total:"}</div>
																							<div className="fs-4 d-flex my-auto">£{(parseFloat(transaction.total)).toFixed(2).toString()} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;&nbsp;${(parseFloat(transaction.total) * parseFloat(ethPriceData)).toFixed(2)}</span></div>
																						</Row>
																					</Row>
																					<Row className="m-0 pt-2 pb-1">
																						<hr className="m-0 p-0" />
																					</Row>
																				</div>
																			)
																		}
																	})}
																</tbody>
															</Fragment>
														) : <Spinner type="table" />}
												</table>
											</div>
										</div>
									</div>
								</div>
							</Tab.Pane>

							<Tab.Pane eventKey="referrals">
								<div className="card">
									<div className="card-header">
										<h3 className="card-title">
											Referrals
										</h3>
									</div>
									<div className="card-body">
										<p className='mb-0'>{referrals}</p>
									</div>
								</div>
							</Tab.Pane>
						</Tab.Content>
					</Col>
				</Row>
			</Tab.Container>
		</div>
	);
}

function mapStateToProps(state) {
	return {
		account: accountSelector(state),
	};
}
export default connect(mapStateToProps)(Settings);


