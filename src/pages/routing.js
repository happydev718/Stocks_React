import React, {useEffect} from "react";
import Exchange from "./exchange";
import Login from "./login";
import {connect} from "react-redux";
import {useParams} from "react-router-dom";
import Swal from "sweetalert2";
import {contractsLoadedSelector} from "../store/selectors";
import firebase from "firebase";

import {
    etherBalanceLoaded,
    tokenBalanceLoaded,
    exchangeEtherBalanceLoaded,
    exchangeTokenBalanceLoaded,
    web3AccountLoaded,
    setLoginUserName,
    setLoginUserEmail
} from "../store/actions";

import axios from 'axios';
import {backUrl} from "../components/constants/routes";


const Routing = (props) => {

    let uid = localStorage.getItem("account-info");
    let {id} = useParams();

    const loadBlockchainData = async () => {
        const {dispatch} = props;
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
                    document.location.href = "/logout"
                    return;
                }
                else {
                    dispatch(web3AccountLoaded(res.data.address));
                    if (res.data.token_flag && res.data.exchange_flag) {
                        await dispatch(setLoginUserName(res.data.name));
                        await dispatch(setLoginUserEmail(res.data.email));
                        if (res.data.balance !== null) {
                            try {
                                localStorage.setItem("account-address", res.data.address);
                            } catch (err) {
                                console.log("Error setting item in localStorage: ", err);
                            }
                            await dispatch(etherBalanceLoaded((res.data.balance[0])));
                            await dispatch(tokenBalanceLoaded(res.data.balance[1]));
                            await dispatch(exchangeEtherBalanceLoaded(res.data.balance[2]));
                            await dispatch(exchangeTokenBalanceLoaded(res.data.balance[3]));
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
        if (uid) {
            async function fetchData() {
                await loadBlockchainData();
            }
            fetchData();
        }
    }, [uid]);

    return (
        <>
            {uid ? (
                <div>
                    {
                        props.contractsLoaded ? <Exchange id={id} /> : <></>
                    }
                </div>
            ) : (
                <Login />
            )}
        </>
    );
};

function mapStateToProps(state) {
    return {
        contractsLoaded: contractsLoadedSelector(state),
    };
}

export default connect(mapStateToProps)(Routing);
