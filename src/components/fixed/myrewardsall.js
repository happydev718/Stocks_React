import React, { useEffect, useState } from "react";
import { auth_profile } from "../components/firebase/firebase";
// import { auth } from "../components/firebase";
import { doGetAnUser } from "../components/firebase/auth";
import { useHistory } from "react-router-dom";
import Spinner from "../components/Spinner";
import { db } from "../components/firebase/firebase";
import moment from "moment";
export default function Myrewards() {

const [transactionData, setTransactionData] = useState([]);
const [loading, setLoading] = useState(true);


useEffect(() => {
  const getData = async () => {
    const userId = localStorage.getItem("account-info");
    const userRef = db.collection("users_tokenbal").doc(userId);
    const userData = await userRef.get();
    if (userData.exists) {
      const data = userData.data();
      const players = Object.keys(data).filter(key => key.endsWith("_Purchases"));
      const transactions = [];
      players.forEach(player => {
        const purchaseData = data[player];
        purchaseData.forEach(purchase => {
          const today = moment();
          const date = moment(purchase.date, "DD/MM/YYYY");
          const datePlus30Days = moment(purchase.date, "DD/MM/YYYY").add(30, "days");
          const timeLeft = datePlus30Days.diff(today, "days");
          console.log("Today: ", today.format("DD/MM/YYYY"));
          console.log("Date: ", date.format("DD/MM/YYYY"));
          console.log("Date Plus 30 Days: ", datePlus30Days.format("DD/MM/YYYY"));
          console.log("Time left: ", timeLeft);
          if (timeLeft >= 0) {
            transactions.push({
              player: player.split("_Purchases")[0],
              owned: purchase.number,
              date: purchase.date,
              timeleft: timeLeft
            });
          }
        });
      });
      setTransactionData(transactions);
      setLoading(false);
    }
  };
  getData();
}, []);



console.log("Today's date: ", moment().format("MM/DD/YYYY"));


if (loading) {
  return <Spinner />;
}

return (
  <>
    <div className="markets settings ptb15 fullpage">
      <div className="container-fluid">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Inplay reward elegibility</h5>
            {transactionData.length === 0 && (
              <p>No Elegible Stocks</p>
            )}
            <div className="table-responsive">
              <table className="table">
                <tbody>
                  <tr className="text-center">
                    <td><b>Player</b></td>
                    <td><b>Owned</b></td>
                    <td><b>Purchase Date</b></td>
                    <td><b>Time left</b></td>
                  </tr>
                  {transactionData.map((transaction, key) => (
                    <tr className="text-center">
                      <td>{transaction.player}</td>
                      <td>{transaction.owned}</td>
                      <td>{transaction.date}</td>
                      <td>{transaction.timeleft}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);


}

