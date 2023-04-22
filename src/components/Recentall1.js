import React, {Component} from "react"
import {connect} from "react-redux"
import {transactionURL} from "./constants/routes";
// import firebase from "firebase";
// import axios from "axios";
import moment from "moment";
import Spinner from "./Spinner";

class Recentall extends Component {

    constructor(props) {
        super(props);
        this.state = {
            transactions: [],
        }
        this.unsubscribe_transaction = null;
        // this.showmyRecent = this.showmyRecent.bind(this);
    }

    async componentDidMount() {
        if (this.unsubscribe_transaction === null) {
            await this.showmyRecent();
            this.unsubscribe_transaction = setInterval(async () => {
                await this.showmyRecent();
            }, 60 * 1000);
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe_transaction !== null) {
            clearInterval(this.unsubscribe_transaction);
        }
    }

    showmyRecent = async () => {
        let transactions = await fetch(transactionURL)
            .then((response) => {return response.text()})
            .catch((error) => {
                console.log(" Recentall.js showmyRecent error = : ", error);
            });
        transactions = JSON.parse(transactions);
        // console.log(" Recentall.js =======> transactions.len = : ", (transactions).length, new Date());
        transactions = transactions.filter((element) => element.transaction_type !== "Cancel");
        transactions.sort(function (x, y) {
            return y.timestamp - x.timestamp;
        });
        transactions = transactions.slice(0, 100);
        console.log(" Recentall.js =======> transactions.len = : ", (transactions).length, new Date());
        const data = this.state.transactions;
        if (transactions !== data) {
            this.setState({
                transactions: transactions,
            });
        }
    }

    render() {
        return (
            <>
                <div className="container-fluid">
                    {/* <div className="input-group m5">
                        <div className="input-group-prepend">
                            <span className="input-group-text" id="inputGroup-sizing-sm">
                                <i className="icon ion-md-search"></i>
                            </span>
                        </div>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search Transaction By Tx Hash"
                            aria-describedby="inputGroup-sizing-sm"
                            // onChange={(e) => onChange(e)}
                            // value={filtername}
                            required
                        />
                    </div> */}
                    <div className="table-responsive">
                        <table className="table mtb15">
                            {
                                this.state.transactions.length > 0 ? <tbody>
                                    <tr>
                                        <td>Time</td>
                                        <td>Type</td>
                                        <td>Type 2</td>
                                        <td>Token</td>
                                        <td>Price</td>
                                        <td>Amount</td>
                                        <td>Total</td>
                                    </tr>
                                    {
                                        this.state.transactions.map((transaction, index) => (
                                            <tr key={index}>
                                                <td>{moment.unix(transaction.timestamp).format('h:mm:ss a M/D')}</td>
                                                <td>{transaction.transaction_type}</td>
                                                <td>{transaction.transaction_type2}</td>
                                                <td>{transaction.eth_tokenName}</td>
                                                <td>£{(transaction.price)}</td>
                                                <td>{transaction.amount}</td>
                                                <td>£{transaction.total}</td>
                                            </tr>
                                        )
                                        )
                                    }
                                </tbody> : <Spinner type="table" />
                            }
                        </table>
                    </div>
                </div>
                {/* </div> */}
            </>
        )
    }
}

function mapStateToProps(state) {
    return {

    }
}

export default connect(mapStateToProps)(Recentall);
