import React, { useEffect } from 'react';
import Login from './login';
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import Swal from 'sweetalert2';
import PlayerStats from './playerstats';
import firebase from "firebase";

import {
    etherBalanceLoaded,
    tokenBalanceLoaded,
    exchangeEtherBalanceLoaded,
    exchangeTokenBalanceLoaded,
    balancesLoading,
    balancesLoaded,
    web3AccountLoaded,
    setLoginUserName,
    setLoginUserEmail
} from "../store/actions";
import { contractsLoadedSelector } from "../store/selectors";
import axios from 'axios';
import { backUrl } from "../components/constants/routes";

const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}


const PlayerStateRouting = (props) => {
    let uid = localStorage.getItem("account-info");
    let { id } = useParams();

    const loadBlockchainData = async (dispatch) => {

        if (!id) {
            return;
        }

        firebase.auth().onAuthStateChanged(async (user) => {
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
                }
                else {
                    const account = res.data.address;
                    dispatch(web3AccountLoaded(account));
                    localStorage.setItem("account-address", account);
                    if (res.data.token_flag && res.data.exchange_flag) {
                        await dispatch(setLoginUserName(res.data.name));
                        await dispatch(setLoginUserEmail(res.data.email));

                        if (res.data.balance !== null) {
                            dispatch(balancesLoading());
                            await dispatch(etherBalanceLoaded(res.data.balance[0]));
                            await dispatch(tokenBalanceLoaded(res.data.balance[1]));
                            await dispatch(exchangeEtherBalanceLoaded(res.data.balance[2]));
                            await dispatch(exchangeTokenBalanceLoaded(res.data.balance[3]));
                            dispatch(balancesLoaded());
                        }
                    }
                    else {
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

    useEffect((uid, props) => {
        if (uid) {
            loadBlockchainData(props.dispatch);
        }
    }, []);

    return (
        <>
            {uid ? (
                <PlayerStats id={id} />
            ) : (
                <Login />
            )}
        </>
    );
}

function mapStateToProps(state) {
    return {
        contractsLoaded: contractsLoadedSelector(state),
    };
}

export default connect(mapStateToProps)(PlayerStateRouting);
