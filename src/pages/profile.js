import React, { useEffect, useState, Fragment } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import Swal from "sweetalert2";
import validator from "validator";
import axios from "axios";
import { RampInstantSDK } from "@ramp-network/ramp-instant-sdk";
import { auth_profile } from "../components/firebase/firebase";
import { auth } from "../components/firebase";
import { doGetAnUser, updateUserData } from "../components/firebase/auth";
import { db } from "../components/firebase/firebase";
import { backUrl } from "../components/constants/routes";
import { coinbase_fee, withdraw_fee } from "../components/constants/const";
import firebase from "firebase";

import {
  accountSelector,
} from '../store/selectors';
import { connect } from 'react-redux';

function Profile() {

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);


  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      console.error("User not logged in");
      return;
    }
    console.log("running fetch2fa");
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




  console.log("current", withdrawAddress1)


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
                    var newUser = { ...user };
                    newUser["passwordOne"] = passwordData.newPassword;
                    Swal.fire({
                      icon: "success",
                      title: "Password Changed",
                      text: "Password successfully changed",
                    });
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
              var newUser = { ...user };
              newUser["passwordOne"] = passwordData.newPassword;
              Swal.fire({
                icon: "success",
                title: "Password Change",
                text: "Password successfully changed",
              });
              setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        });
      console.log("incorrect 2fa5")
    }
    console.log("incorrect 2fa3")
  };



  const check_2fa_code = async (email, code) => {
    try {
      const response = await axios.post(backUrl + "check_2fa_code", { email, code });
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

  const get_2fa_code = async (email) => {
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
        const { value: code } = await Swal.fire({
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
        { option: "empty" },
        { headers }
      );
      const { newsetting } = response.data;
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
        { option },
        { headers }
      );
      const { newsetting } = response.data;
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
        { headers }
      );
      return changePassword.data;
    } catch (error) {
      console.error("Error sending axios request:", error);
    }
  };


  const startkyc = async () => {
    try {
      const { value: formValues } = await Swal.fire({
        title: 'Generate Token',
        html: `
        <input id="swal-input1" class="swal2-input" type="text" placeholder="First Name" pattern="[A-Za-z]{1,20}" maxlength="20">
        <input id="swal-input2" class="swal2-input" type="text" placeholder="Last Name" pattern="[A-Za-z]{1,20}" maxlength="20">
        <input id="swal-input3" class="swal2-input" type="text" placeholder="Date of Birth (DD-MM-YYYY)" pattern="\d{2}-\d{2}-\d{4}" maxlength="10">
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
      const { value: enteredAmount } = await Swal.fire({
        title: "Withdraw Ethereum",
        html: `Enter the amount to withdraw <br>Current balance: ${balance}<br>
             Current withdraw fee: ${coinbase_fee}<br>
             Maximum withdrawal: ${maximumWithdrawal}<br>
             Withdraw Address: ${withdrawAddress}`,
        input: 'text',
        inputValue: amount,
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
        }
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
    const { value: enteredAmount } = await Swal.fire({
      title: "Withdraw to Bank",
      html: `Enter the amount to withdraw <br>Current balance: ${balance}<br>
           Current withdraw fee: ${coinbase_fee}<br>
           Maximum withdrawal: ${maximumWithdrawal}`,
      input: 'text',
      inputValue: amount,
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
      }
    });

    if (enteredAmount) {
      setAmount(enteredAmount);

      try {
        const user = firebase.auth().currentUser;
        if (!user) {
          throw new Error('No user is signed in.');
        }

        const idToken = await user.getIdToken();

        const response = await axios.post(backUrl + "ramp_withdraw_request", { enteredAmount }, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        const { data } = response;

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
      <Row>
        <Col lg='4' md='6'>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                General Information
              </h3>
            </div>
            <div className="card-body">
              <form>
                <div className="mb-5">
                  <div className="mb-4">
                    <label htmlFor="formFirst" className='mb-2'>Name</label>
                    <input
                      id="formFirst"
                      type="text"
                      className="form-control"
                      placeholder="First name"
                      defaultValue={user?.Firstname}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="emailAddress" className='mb-2'>Email</label>
                    <input
                      id="emailAddress"
                      type="text"
                      className="form-control"
                      placeholder="Enter your email"
                      defaultValue={user?.email}
                    />
                  </div>
                </div>
                <Button
                  type='submit'
                  variant='info'
                >
                  Change info
                </Button>
              </form>

            </div>
          </div>
        </Col>

        <Col lg='4' md='6'>
          <div className="card">
            {currentUser?.providerData[0]?.providerId === "password" &&
              <Fragment>
                <div className="card-header">
                  <h3 className="card-title">
                    Password Change
                  </h3>
                </div>
                <div className="card-body">
                  <form onSubmit={(e) => changePassword(e)}>
                    <div className="mb-5">

                      <Row>
                        <Col md='6'>
                          <div className="mb-4">
                            <label htmlFor="currentPass" className='mb-2'>
                              Current password
                            </label>
                            <input
                              id="currentPass"
                              type="password"
                              className="form-control"
                              placeholder="Enter your password"
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  currentPassword: e.target.value,
                                })
                              }
                              value={passwordData.currentPassword}
                            />
                            {passwordError.currentPasswordError && (
                              <p className="alert alert-danger">
                                {passwordError.currentPasswordError}
                              </p>
                            )}
                          </div>
                        </Col>
                        <Col md='6'>
                          <div className="mb-4">
                            <label htmlFor="newPass" className='mb-2'>
                              New password
                            </label>
                            <input
                              id="newPass"
                              type="password"
                              className="form-control"
                              placeholder="Enter new password"
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  newPassword: e.target.value,
                                })
                              }
                              value={passwordData.newPassword}
                            />
                          </div>
                        </Col>
                      </Row>

                      <div className="mb-4">
                        <label htmlFor="newPass" className='mb-2'>
                          Confirm password
                        </label>
                        <input
                          id="repPass"
                          type="password"
                          className="form-control"
                          placeholder="Enter confirm password"
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          value={passwordData.confirmPassword}
                        />
                        {passwordError.confirmPasswordError && (
                          <p className="alert alert-danger">
                            {passwordError.confirmPasswordError}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type='submit'
                      variant='info'
                    >
                      Change Password
                    </Button>
                  </form>
                </div>
              </Fragment>
            }

            {currentUser?.providerData[0]?.providerId !==
              "password" && (
                <Fragment>
                  <div className="card-header">
                    <h3 className="card-title">Social Account Linked </h3>
                  </div>
                  <div className="card-body">
                    {user?.authProvider?.toUpperCase()}
                  </div>
                </Fragment>
              )}
          </div>
        </Col>

        <Col lg='4' md='6'>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">2 Factor Authentication</h3>
            </div>
            <div className="card-body">
              <p>
                To further enhance the security of your account, StocksFC introduces the Authenticator for generating 2-step verification codes when you need to verify your requests or make transactions.
              </p>
              <form>
                <Row className='align-items-center'>
                  <Col xs='6'>
                    {is2FAEnabled === null ? (
                      <div className="d-flex align-items-center">
                        <div className="spinner-border mr-3" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                        Loading...
                      </div>
                    ) : (
                      <p className='mb-0'>
                        <span className="text-muted">
                          2FA is currently{" "}
                        </span>
                        <strong>{is2FAEnabled ? "On" : "Off"}</strong>
                      </p>
                    )}
                  </Col>
                  <Col xs='6'>
                    <div className="text-end">
                      {is2FAEnabled === null ? null : !is2FAEnabled ? (
                        <button
                          className="btn btn-success"
                          onClick={(e) => {
                            e.preventDefault();
                            toggle2FA("on");
                          }}
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger"
                          onClick={(e) => {
                            e.preventDefault();
                            toggle2FA("off");
                          }}
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </Col>
                </Row>
              </form>
            </div>
          </div>
        </Col>

      </Row>
    </div>
  );
}

function mapStateToProps(state) {
  return {
    account: accountSelector(state),
  };
}
export default connect(mapStateToProps)(Profile);


