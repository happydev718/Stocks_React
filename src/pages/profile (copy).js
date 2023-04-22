import React, { useEffect, useState } from "react";
import { Tab, Row, Col, Nav } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import Swal from "sweetalert2";
import moment from "moment";
import validator from "validator";
import axios from "axios";
import { RampInstantSDK } from "@ramp-network/ramp-instant-sdk";
import { auth_profile } from "../components/firebase/firebase";
import { auth } from "../components/firebase";
import { doGetAnUser, updateUserData } from "../components/firebase/auth";
import Spinner from "../components/Spinner";
import { db } from "../components/firebase/firebase";
import { backUrl } from "../components/constants/routes";
import { coinbase_fee, withdraw_fee } from "../components/constants/const";
import firebase from "firebase";
import {
    accountSelector,
} from '../store/selectors';
import {connect} from 'react-redux';

function Profile() {
 
const [user, setUser] = useState(null);

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
            userAddress: '0x88af7D55745F7b87Fcec6C75bedC96A5cd4344c3',
            hostApiKey: 'kfgpytdr43haoovb59hfeyzwsjcwxeaxrtgc39cr',
            containerNode: document.getElementById("ramp-container"),
        }).show();
    }
    
        const withdraw_rampInstant = () => {
        new RampInstantSDK({
            hostAppName: "Stocksfc.com",
            hostLogoUrl: "https://app.stocksfc.com/img/stocksfc.png",
            swapAsset: "ETH_ETH",
            webhookStatusUrl: `https://loadbalancer.web-services-uk-anubis.com:60435/a4529f49354d0467ea0c2abc67083b3f7c6afjrhc566787a0bc48ef858ghf4?customer_id=${uid}`,
            fiatCurrency: "GBP",
            //url: 'https://app.demo.ramp.network/',
            fiatValue: 250,
            userAddress: '0x88af7D55745F7b87Fcec6C75bedC96A5cd4344c3',
            hostApiKey: 'kfgpytdr43haoovb59hfeyzwsjcwxeaxrtgc39cr',
            containerNode: document.getElementById("ramp-container"),
            enabledFlows: "OFFRAMP",
            defaultFlow: "OFFRAMP", 
        }).show();
    }

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

    

    
    console.log("current", withdrawAddress1 )
    
    
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
              setPasswordData({ currentPassword: "", newPassword: "",
confirmPassword: "" });
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
window.open(response.data.data,"_self");
      });
                       } else {
            console.log("User not logged in")
        }
    }
    
    
    

    
    return (
        <>
            <div className="markets settings ptb15 fullpage mt-3">
                {/* <div className="markets mtb15"> */}
                <div className="container-fluid">
                    <Tab.Container defaultActiveKey="profile">
                        <Row>
                            <Col lg={3}>
                                <Nav variant="pills" className="settings-nav">
                                    <Nav.Item>
                                         <Nav.Link eventKey="deposit">Deposit</Nav.Link>
                                         <Nav.Link eventKey="withdraw">Withdraw</Nav.Link>
                                        <Nav.Link eventKey="profile">Profile</Nav.Link>
                                        <Nav.Link eventKey="mytransaction">My Transactions</Nav.Link>
                                        <Nav.Link eventKey="referrals">Referrals</Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>
                            <Col lg={9}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="deposit">
                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="card-title">Deposit</h5>
                                                <div className="input-group m5" style={{ display: "block" }}>
                                                </div>
                                                <div id="ramp-container" className="input-group m-3" style={{ display: "block" }}>
                                                    <button className="btn btn-primary" onClick={() => { initial_rampInstant() }}>Deposit with Ramp</button>
                                                </div>
                                                <div id="ramp-container" className="input-group m-3 mt-4" style={{ display: "block" }}>
                                                    <button className="btn btn-primary" onClick={() => {
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
                                                    }}>Deposit With Coinbase Payment Gateway</button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                         <div className="card">
                                            <div className="card-body">
                                                <Row className="m-0 w-100">
                                                    <Col lg={3} md={3} sm={3} xs={3}>
                                                        <h5 className="card-title">Deposit History</h5>
                                                    </Col>
                                                </Row>
                                                <div className="table-responsive">
  <table className="table">
    <tbody>
      <tr className="text-center">
        <td>Time</td>
        <td>ID</td>
        <td>Method</td>
        <td>Eth Amount</td>
        <td>USD Amount</td>
        <td>Status</td>
      </tr>
      {documents.map(doc => {
        let amountPurchased = parseFloat(doc.amountPurchased.replace(/[^0-9.]/g, ''))
        return(
          <tr className="text-center" key={doc.id}>
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
                                    </Tab.Pane>
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    <Tab.Pane eventKey="withdraw">
                                    
                                    
                                                                                <div className="card">

                                        
                                        
                                            <div className="card-body">
                                                <h5 className="card-title">Withdraw</h5>
                                                <div className="input-group m5" style={{ display: "block" }}>
                                                </div>

                                                <div id="ramp-container" className="input-group m-3 mt-4" style={{ display: "block" }}>
<button className="btn btn-primary" onClick={() => {
    getWithdrawAddress().then((withdrawAddress) => {
        if (withdrawAddress === null || withdrawAddress === undefined || withdrawAddress === '') {
            Swal.fire("Please set a withdrawal address", "", "warning");
        } else {
            Swal.fire({
                html:
                    `<ul>
                    <h6>Coinbase Payment ( currency : USD )</h6>
                    <h6 class="text-center" id="total">Total : $0</h6>
                    <h6 class="text-center" id="fee">Fee: $0</h6>
                    <h6 class="text-center" id="receive">You will receive $0</h6>
                    </ul>`,
                title: `Withdraw`,
                showCancelButton: true,
                confirmButtonColor: "#26de81",
                cancelButtonColor: "#d33",
                confirmButtonText: "withdraw",
                cancelButtonText: "Cancel",
                preConfirm: () => {
                    return {
                        current_amount1: parseFloat(document.getElementById("amount1").value),
                    }
                },
                input: 'text',
                didOpen: () => {
                    const input = Swal.getInput()
                    input.className = "swal2-input ml-5 mr-5"
                    input.id = "amount1"
                    input.placeholder = "Enter Amount"
                    input.oninput = () => {
                        let amount1 = parseFloat(document.getElementById("amount1").value);
                        document.getElementById("total").innerHTML = "Total : $" + (amount1).toFixed(2).toString();
                        document.getElementById("fee").innerHTML = "Fee: $" + (withdraw_fee).toFixed(2).toString();
                        document.getElementById("receive").innerHTML = "You will receive $" + (amount1 - withdraw_fee).toFixed(2).toString();
                    }
                }
            }).then(async (result, etherBalance) => {
                if (result.isConfirmed) {
                    if (result.value.current_amount1 === undefined) {
                        Swal.fire("Input amount as correctly!", "", "warning");
                    }
                    else if (result.value.current_amount1 !== "0" && result.value.current_amount1 !== null && result.value.current_amount1 !== "" && parseFloat(result.value.current_amount1) > 0) {
                        await create_retirar(result.value.current_amount1);
                    } else {
                        Swal.fire("Input amount as correctly!", "", "warning");
                    }
                }
            });
        }
    });
}}>Withdraw Ethereum</button>

                                                <div id="ramp-container2" className="input-group m-3" style={{ display: "block" }}>
                                                    <button className="btn btn-primary" onClick={() => { withdraw_rampInstant() }}>Withdraw to Bank</button>
                                                </div>

                                                </div>
                                            </div>
                                        </div>
                                        
                                        
<div className="card-group">
    <div className="card">
        <div className="card-body">
            <h5 className="card-title">Ethereum Withdrawal Address</h5>
            <div className="input-group m5" style={{ display: "block" }}>
            </div>
            <div id="ramp-container" className="input-group m-3 mt-4" style={{ display: "block" }}>
                <h4>{withdrawAddress1}</h4>
            </div>
        </div>
    </div>
    <div className="card">
        <div className="card-body">

            <div className="input-group m5" style={{ display: "block" }}>
            </div>
            <div id="ramp-container" className="input-group m-3 mt-4" style={{ display: "block" }}>
                <button className="btn btn-primary" onClick={() => {
                    Swal.fire({
                        html:
                            `<ul>
                            <h6 class="text-center" id="receive">Enter your new Ethereum withdrawal address</h6>
                            </ul>`,
                        title: `Withdraw`,
                        showCancelButton: true,
                        confirmButtonColor: "#26de81",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Set New Address",
                        cancelButtonText: "Cancel",
                        preConfirm: () => {
                            return {
                                current_withdrawAddress:(document.getElementById("withdrawAddress").value),
                            }
                        },
                        input: 'text',
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
                            if (result.value.current_withdrawAddress !== "0" && result.value.current_withdrawAddress !== null && result.value.current_withdrawAddress !== "" ) {
                                console.log("address is ", result.value.current_withdrawAddress )
                                await newWithdrawAddress(result.value.current_withdrawAddress);
                            } else {
                                Swal.fire("withdrawAddress!", "", "warning");
                            }
                        }
                    })
                }}>Change Address</button>
            </div>
        </div>
    </div>
</div>

                                    </Tab.Pane>
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    <Tab.Pane eventKey="profile">
                                        <div className="card settings-nav">
                                            <div className="card-body">
                                                <h5 className="card-title">General Information</h5>
                                                <div className="settings-profile">
                                                    <form>
                                                        <div className="form-row mt-4">
                                                            <div className="col-md-6">
                                                                <label htmlFor="formFirst">Name</label>
                                                                <input
                                                                    id="formFirst"
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="First name"
                                                                    defaultValue={user?.Firstname}
                                                                />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label htmlFor="emailAddress">Email</label>
                                                                <input
                                                                    id="emailAddress"
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Enter your email"
                                                                    defaultValue={user?.email}
                                                                />
                                                            </div>
                                                            <div className="col-md-12">
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
<div className="card settings-nav">
  <div className="card-body">
    <h5 className="card-title">2 Factor Authentication</h5>
    <div className="settings-profile">
      <form>
        <div className="form-row mt-4">
          <div className="col-md-12">
            {is2FAEnabled === null ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border mr-3" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                Loading...
              </div>
            ) : (
              <p>
                2FA is currently{" "}
                <strong>{is2FAEnabled ? "On" : "Off"}</strong>
              </p>
            )}

            {is2FAEnabled === null ? null : !is2FAEnabled ? (
              <button
                className="btn btn-primary"
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
        </div>
      </form>
    </div>
  </div>
</div>



                                        <div className="card settings-nav">
                                            {currentUser?.providerData[0]?.providerId ===
                                                "password" && (
                                                    <div className="card-body">
                                                        <h5 className="card-title">Password Change</h5>
                                                        <div className="settings-profile">
                                                            <form onSubmit={(e) => changePassword(e)}>
                                                                <div className="form-row">
                                                                    <div className="col-md-6">
                                                                        <label htmlFor="currentPass">
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
                                                                    <div className="col-md-6">
                                                                        <label htmlFor="newPass">New password</label>
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
                                                                    <div className="col-md-6">
                                                                        <label htmlFor="newPass">
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
                                                                    <div className="col-md-12">
                                                                        <input type="submit" value="Change Password" />
                                                                    </div>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>
                                                )}
                                            {currentUser?.providerData[0]?.providerId !==
                                                "password" && (
                                                    <div className="card-body">
                                                        <h5 className="card-title">Social Account Linked </h5>
                                                        {user?.authProvider?.toUpperCase()}
                                                    </div>
                                                )}
                                        </div>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="mytransaction">
                                        <div className="card">
                                            <div className="card-body">
                                                <Row className="m-0 w-100">
                                                    <Col lg={3} md={3} sm={3} xs={3}>
                                                        <h5 className="card-title">My Transactions</h5>
                                                    </Col>
                                                    <Col lg={9} md={9} sm={9} xs={9} className="d-flex justify-content-end">
                                                        <div className={"card-title cursor-pointer w-45px text-center"} onClick={() => moveTransactionPage(0)}>

                                                        </div>
                                                        <div className={"card-title cursor-pointer w-45px text-center"} onClick={() => moveTransactionPage(-1)}>
                                                            {transactionPage === 0 ? "" : <i className="fas fa-angle-left"></i>}
                                                        </div>
                                                        <div className={"card-title cursor-pointer w-45px text-center"} onClick={() => moveTransactionPage(1)}>
                                                            {transactionData.length < 20 ? "" : <i className="fas fa-angle-right"></i>}
                                                        </div>
                                                        {/* <div className={"card-title cursor-pointer w-45px text-center"} onClick={() => moveTransactionPage(0)}>
                                                            {transactionPage === 9999 || transactionData.length < 20 ? "" : "Last"}
                                                        </div> */}
                                                    </Col>
                                                </Row>
                                                <div className="input-group m5">
                                                    <div className="input-group-prepend">
                                                        <span className="input-group-text" id="inputGroup-sizing-sm">
                                                            <i className="icon ion-md-search"></i>
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Filter Current Page By Player Name"
                                                        aria-describedby="inputGroup-sizing-sm"
                                                        onChange={(e) => onSearchChange(e)}
                                                        value={searchWord}
                                                        required
                                                    />
                                                </div>
                                                <div className="table-responsive">
                                                    <table className="table">
                                                        {(currentUser?.providerData[0]) ?
                                                            (<tbody >
                                                                <tr className="text-center">
                                                                    <td>Time</td>
                                                                    <td>Type</td>
                                                                    <td>Type 2</td>
                                                                    <td>Token</td>
                                                                    <td>Price</td>
                                                                    <td>Amount</td>
                                                                    <td>Total</td>
                                                                </tr>
                                                                {transactionData.map((transaction, key) => (
                                                                    <tr className="text-center" key={key}>
                                                                        <td>{moment.unix(transaction.timestamp).format("DD/MM/YY h:mm:ss A")}</td>
                                                                        <td>{transaction.transaction_type}</td>
                                                                        <td>{transaction.transaction_type2}</td>
                                                                        <td>{transaction.eth_tokenName}</td>
                                                                        {
                                                                            transaction.transaction_type === "Cancel" ? <td>£{"0.00"}</td> : <td>£{parseFloat(transaction.price).toFixed(2)}</td>

                                                                        }
                                                                        {
                                                                            transaction.transaction_type === "Cancel" ? <td>{"0.00"}</td> : <td>£{parseFloat(transaction.amount).toFixed(2)}</td>

                                                                        }
                                                                        {
                                                                            transaction.transaction_type === "Cancel" ? <td>{"0.00"}</td> : <td>${transaction.total}</td>
                                                                        }
                                                                    </tr>
                                                                ))}
                                                            </tbody>) : <Spinner type="table" />}
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </Tab.Pane>
                                                                        <Tab.Pane eventKey="referrals">
                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="card-title">Referrals</h5>
                                                <div className="input-group m5" style={{display: "block"}}>
                                                    <div className="market-carousel-item">
                                                        <h2>Referrals&nbsp;&nbsp;:&nbsp;&nbsp;{referrals}</h2>
                                                    </div>
                                                </div>
                                                {/* <div className="input-group m5" style={{ display: "block" }}>
                                                    <div className="market-carousel-item">
                                                        <strong>Portfolio Value</strong>
                                                        <h2>£{((parseFloat(totalval)).toFixed(2))}</h2>
                                                    </div>
                                                </div> */}
                                            </div>
                                        </div>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </div>
            </div>
        </>
    );
}

function mapStateToProps(state) {
    return {
        account: accountSelector(state),
    };
}
export default connect(mapStateToProps)(Profile);

           
