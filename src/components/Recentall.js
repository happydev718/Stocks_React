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
			isLoading: true,
			transactions: [],
		}
		this.unsubscribe_transaction = null;
		// this.showmyRecent = this.showmyRecent.bind(this);
	}

	async componentDidMount() {
		if (this.unsubscribe_transaction === null) {
			this.setState({isLoading: false});
			await this.showmyRecent();
			this.setState({isLoading: true});
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
		// console.log(" Recentall.js =======> transactions.len = : ", (transactions).length, new Date());
		const data = this.state.transactions;
		if (transactions !== data) {
			this.setState({isLoading: false});
			this.setState({transactions: transactions});
			this.setState({isLoading: true});
		}
	}

	render() {
		return (
			<div className="container-fluid">
				<div className="card card--overflow market-activity mb-0">
					<div className="card-header">
						<h3 className="card-title">
							Market Activity
						</h3>
					</div>
					<div className="flex-grow-scroll">
						<div className="card-body card-body--table">
							<div className="table-responsive">
								<table className="table">
									<thead>
										<tr>
											<th>Time</th>
											<th>Type</th>
											<th>Type 2</th>
											<th>Token</th>
											<th>Price</th>
											<th>Amount</th>
											<th>Total</th>
										</tr>
									</thead>
									{
										this.state.isLoading ?
											<tbody>
												{
													this.state.transactions.map((transaction, index) => (
														<tr key={index}>
															<td>
																<div className="fs-6">{moment.unix(transaction.timestamp).format('h:mm:ss a')}</div>
																<span className="fs-7 text-muted">{moment.unix(transaction.timestamp).format('M/D')}</span>
															</td>
															<td>{transaction.transaction_type}</td>
															<td>{transaction.transaction_type2}</td>
															<td>{transaction.eth_tokenName}</td>
															<td>£{(transaction.price)}</td>
															<td>
																<span className="text-muted">
																	{transaction.amount}
																</span>
															</td>
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
					</div>
				</div>
			</div>
		)
	}
}

function mapStateToProps(state) {
	return {}
}

export default connect(mapStateToProps)(Recentall);
