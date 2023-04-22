import React, { useEffect } from "react";
import Login from "./login";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Portfolio from './portfolio';
import firebase from "firebase";

// import TokenABI from '../abis/TokenABI.json';
// import ExchangeABI from '../abis/TokenABI.json';
import {
    etherBalanceLoaded,
    tokenBalanceLoaded,
    exchangeEtherBalanceLoaded,
    exchangeTokenBalanceLoaded,
    // balancesLoading,
    // balancesLoaded,
    // web3Loaded,
    web3AccountLoaded,
    setLoginUserName,
    setLoginUserEmail
} from "../store/actions";
import { contractsLoadedSelector } from "../store/selectors";
// import { loadToken, loadExchange } from '../store/interaction';
// import Web3 from 'web3';
import axios from 'axios';
import { backUrl } from "../components/constants/routes";

const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}


const RoutingForPortfolio = (props) => {

    let uid = localStorage.getItem("account-info");
    let { id } = useParams();

    const loadBlockchainData = async(dispatch) => {

    if (!id) {
        return;
    }

        // const user = firebase.auth().currentUser


        firebase.auth().onAuthStateChanged(async(user) => {
            if (user) {
                const idToken = await user.getIdToken();


                var res = await axios.post(backUrl + "account/load_balance", {
                    id: id
                }, {
                    headers: {
                        Authorization: 'Bearer ' + idToken
                    }
                });

                if (res.data === null) {
                    await wait(2);
                    document.location.href = "/logout"
                    return;
                } else {
                    // const web3 = new Web3(new Web3.providers.HttpProvider('https://data.stocksfc.com:3200'));
                    // dispatch(web3Loaded(web3));
                    const account = res.data.address;
                    dispatch(web3AccountLoaded(account));
                    localStorage.setItem("account-address", account);
                    if (res.data.token_flag && res.data.exchange_flag) {
                        await dispatch(setLoginUserName(res.data.name));
                        await dispatch(setLoginUserEmail(res.data.email));
                        if (res.data.balance !== null) {
                            await dispatch(etherBalanceLoaded(res.data.balance[0]));
                            await dispatch(tokenBalanceLoaded(res.data.balance[1]));
                            await dispatch(exchangeEtherBalanceLoaded(res.data.balance[2]));
                            await dispatch(exchangeTokenBalanceLoaded(res.data.balance[3]));
                        }
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Error...",
                            text: "Error 485 - Please report to admin",
                        });
                        return;
                    }
                }
            } else {
                // User is signed out
                // ...
            }
        });
    };

    useEffect(() => {
        if (uid) {
            loadBlockchainData(props.dispatch);
        }
    }, [props.dispatch, uid]);

    return ( <
        >
        {
            uid ? ( <
                div >
                <
                Portfolio id = { id }
                /> < /
                div >
            ) : ( <
                Login / >
            )
        } <
        />
    );
};

function mapStateToProps(state) {
    return {
        contractsLoaded: contractsLoadedSelector(state),
    };
}

export default connect(mapStateToProps)(RoutingForPortfolio);
