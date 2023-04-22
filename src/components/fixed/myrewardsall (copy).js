import React, { useEffect, useState } from "react";
import { auth_profile } from "../components/firebase/firebase";
// import { auth } from "../components/firebase";
import { doGetAnUser } from "../components/firebase/auth";
import { useHistory } from "react-router-dom";
import Spinner from "../components/Spinner";
import { db } from "../components/firebase/firebase";
import moment from "moment";
export default function Myrewards() {

    // const [user, setUser] = useState(null);
    // const [fullTransactionData, setFullTransactionData] = useState([]);
    // const account = localStorage.getItem("account-info");
    const [transactionData, setTransactionData] = useState([]);
    const history = useHistory();
    const currentUser = auth_profile.currentUser;

    useEffect(() => {
        let account = localStorage.getItem("account-info");
        if (!account) {
            localStorage.clear();
            history.push("/login");
        }
        db.collection('stateRealtime').doc('changeTransaction').onSnapshot(async (snap) => {
            await updateTransactionData(account)
        });
        doGetAnUser(account).then((query) => {
            if (query.docs.length !== 0) {
                query.docs[0].data();
                // setUser(res);
            }
        });
    }, [history]);


    const updateTransactionData = async () => {
        var mytransaction_ref = await db.collection("myRewards").doc(localStorage.getItem("account-info")).get();
        if (mytransaction_ref.data() !== undefined && mytransaction_ref.data() !== null && mytransaction_ref.data() !== []) {
            let transactions = mytransaction_ref.data();
            let myTransactions = [];
            for (let i = 0; i < Object.keys(transactions).length; i++) {
                if (Object.keys(transactions)[i] !== "uid") {
                    let tokenId = transactions[Object.keys(transactions)[i]];
                    for (let j = 0; j < tokenId.length; j++) {
                        myTransactions.push({
                            timestamp: moment.unix(tokenId[j].timestamp).format('DD/MM/YY'),
                            reward: tokenId[j].reward,
                            player: tokenId[j].player,
                            tokensHeld: tokenId[j].tokensHeld,
                            totalHeld: tokenId[j].totalHeld,
                            payoutPerToken: tokenId[j].payoutPerToken,
                            payout: tokenId[j].payout,
                            real_timestamp: tokenId[j].timestamp
                        });
                    }
                }
            }
            myTransactions = myTransactions.slice(0, 100);
            myTransactions.sort(function (x, y) {
                return y.real_timestamp - x.real_timestamp;
            });
            // setFullTransactionData(myTransactions);
            setTransactionData(myTransactions);
        }
    }


    return (
        <>
            <div className="markets settings ptb15 fullpage">
                {/* <div className="markets mtb15"> */}
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">My Rewards</h5>
                            <div className="table-responsive">
                                <table className="table">
                                    {(currentUser?.providerData[0]) ?
                                        (<tbody >
                                            <tr className="text-center">
                                                <td><b>Date</b></td>
                                                <td><b>Reward</b></td>
                                                <td><b>Player</b></td>
                                                <td><b>Tokens Held</b></td>
                                                <td><b>Total % Held</b></td>
                                                <td><b>Payout Per Token</b></td>
                                                <td><b>Payout</b></td>
                                            </tr>
                                            {transactionData.map((transaction, key) => (
                                                <tr className="text-center">
                                                    <td>{transaction.timestamp}</td>
                                                    <td>{transaction.reward}</td>
                                                    <td>{transaction.player}</td>
                                                    <td>{transaction.tokensHeld}</td>
                                                    <td>{transaction.totalHeld}</td>
                                                    <td>£{transaction.payoutPerToken}</td>
                                                    <td>£{transaction.payout}</td>
                                                </tr>
                                            ))}
                                        </tbody>) : <Spinner />}
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
