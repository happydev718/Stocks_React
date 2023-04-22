import React, { useEffect } from 'react';
import Ipo from './ipo';
import Login from './login';
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import Swal from 'sweetalert2'
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

import axios from 'axios';
import { backUrl } from "../components/constants/routes";

const IpoRouting = (props) => {

    let uid = localStorage.getItem("account-info");
    let { id } = useParams();

    const loadBlockchainData = async () => {
        const { dispatch } = props;
        if (id === null || id === undefined) {
            id = "cronaldo";
        }
        
            firebase.auth().onAuthStateChanged(async(user) => {
            if (user) {
            
            const idToken = await user.getIdToken();


        
        var res = await axios.post(backUrl + "ipo/account/load_balance", { 
        id: id 
        }, {
        headers: {
        Authorization: 'Bearer ' + idToken
         }
         });
        
        if (res.data === null) {
            return;
        }
        else {
            await dispatch(web3AccountLoaded(res.data.address));
            localStorage.setItem("account-address", res.data.address);
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

    useEffect(() => {
        async function fetchData() {
            if (uid) {
                await loadBlockchainData();
            }
        }
        fetchData();
    }, [uid]);

    return (
        <>
            {uid ? (
                <div>
                    {props.contractsLoaded ? (
                        <div>
                            <Ipo id={id} />
                        </div>
                    ) : (
                        <></>
                    )}
                </div>
            ) : (
                <Login />
            )}
        </>
    );
}

function mapStateToProps(state) {
    return {
        contractsLoaded: true,
    };
}

export default connect(mapStateToProps)(IpoRouting);
