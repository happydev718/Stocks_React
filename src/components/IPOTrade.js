import React, {Component, Fragment} from 'react';
import {connect} from 'react-redux'
import {Row, Col, Button} from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';

import Spinner from './Spinner'
import {
	tokenBalanceSelector,
	accountSelector,
	etherBalanceSelector,
} from '../store/selectors';
import {
	balancesLoading,
	balancesLoaded,
	etherBalanceLoaded,
	tokenBalanceLoaded,
	orderCancelling,
	updateOrderCancellingFlagFalse,
} from '../store/actions'
import {db} from "./firebase/firebase";
import {backUrl} from './constants/routes';
import {ether} from '../helpers';
import firebase from "firebase";

class IPOTrade extends Component {

	constructor(props) {
		super(props);
		this.state = {
			orderBookBuy: props.orderBookBuy,
			orderBookSell: props.orderBookSell,
			showMarketSellButtonFlag: false,
			showMarketBuyButtonFlag: false,
			showbuttonFlag: true,
			ethAmount: "",
			ethPrice: "",
			sellethAmount: "",
			sellethPrice: "",
			methAmount: "",
			methPrice: "",
			msellethAmount: "",
			msellethPrice: "",
			ethPriceData: "",
		};
		this.unsubscribe = null;
		this.unsubscribe_fill = null;
	}

	componentDidUpdate(prevProps) {
		if (prevProps.orderBookBuy !== this.props.orderBookBuy) {
			this.setState({orderBookBuy: this.props.orderBookBuy});
			if (Object.keys(this.props.orderBookBuy).includes("buy")) {
				if (this.props.orderBookBuy.length > 0) {
					this.setState({showMarketSellButtonFlag: true});
				}
				else {
					this.setState({showMarketSellButtonFlag: false});
				}
			}
		}
		if (prevProps.orderBookSell !== this.props.orderBookSell) {
			this.setState({orderBookSell: this.props.orderBookSell});
			if (Object.keys(this.props.orderBookSell).includes("sell")) {
				if (this.props.orderBookSell.length > 0) {
					this.setState({showMarketBuyButtonFlag: true});
				}
				else {
					this.setState({showMarketBuyButtonFlag: false});
				}
			}
		}
	}

	async componentDidMount() {
		await this.updatebalance(this.props.dispatch, this.props.account);
		this.unsubscribe_fill = db.collection('fill').doc(this.props.account).onSnapshot((snap) => {
			if (snap.data()) {
				let {price, amount, ordertype} = snap.data();
				const {account} = this.props;
				if (ordertype === "buy") {
					if (this.state.ethPrice !== price) {
						this.setState({ethPrice: price});
						db.collection('fill').doc(account).set({
							ordertype: 0,
							price: 0,
							amount: 0,
							flag: 0
						})
					}
					if (this.state.ethAmount !== amount) {
						this.setState({ethAmount: amount});
						db.collection('fill').doc(account).set({
							ordertype: 0,
							price: 0,
							amount: 0,
							flag: 0
						})
					}
				}
				if (ordertype === "sell") {
					if (this.state.sellethAmount !== price) {
						this.setState({sellethPrice: price});
						db.collection('fill').doc(account).set({
							ordertype: 0,
							price: 0,
							amount: 0,
							flag: 0
						})
					}
					if (this.state.sellethPrice !== amount) {
						this.setState({sellethAmount: amount});
						db.collection('fill').doc(account).set({
							ordertype: 0,
							price: 0,
							amount: 0,
							flag: 0
						})
					}
				}
			}
		});
		this.unsubscribe = db.collection('stateRealtime').doc('changeState').onSnapshot(async (snap) => {
			await this.updatebalance();
		});

		let ethPriceData = await axios.get(`https://data.stocksfc.com/EthPrice.json`);
		if (ethPriceData.data) {
			this.setState({ethPriceData: ethPriceData.data.USD});
		}
	}

	componentWillUnmount() {
		if (this.unsubscribe !== null) {
			this.unsubscribe();
		}
		if (this.unsubscribe_fill !== null) {
			this.unsubscribe_fill();
		}
	}

	onbuyChangeEthAmountMarket(e) {
		if (e.target.value > 200) {
			Swal.fire({
				icon: 'error',
				html:
					'<ul>' +
					`<li>You can purchase a maximum of 200 IPO tokens per transaction</li>` +
					'</ul>',
				title: 'IPO Buy Amount Too High',
				confirmButtonColor: '#26de81',
				confirmButtonText: 'OK'
			})
		} else {
			this.setState({methAmount: parseFloat(e.target.value)});
			var minprice = 0.01;
			if (this.props.orderBookSell.length > 0) {
				minprice = parseFloat(ether(parseFloat(this.props.orderBookSell[0].tokenPrice) * 1e18));
			} else {
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: "Price must be higher than 0!",
				});
				return;
			}
			for (var i = 0; i < this.props.orderBookSell.length; i++) {
				if (minprice > parseFloat(ether(parseFloat(this.props.orderBookSell[i].tokenPrice) * 1e18))) {
					minprice = parseFloat(ether(parseFloat(this.props.orderBookSell[i].tokenPrice) * 1e18));
				}
			}
			this.setState({methPrice: minprice});
		}
	}

	onsellChangeEthPrice(e) {
		let realvalue = e.target.value;
		if (realvalue) {
			realvalue = (parseFloat(realvalue));
			// if (realvalue < 0.01) {
			//     realvalue = 0.01;
			// }
			if (realvalue < 0) {
				realvalue = 0.01;
			}
			else if (realvalue > 9999.99) {
				realvalue = 9999.99;
			}
		}
		this.setState({sellethPrice: realvalue});
	}

	onsellChangeEthAmount(e) {
		let realvalue = e.target.value;
		if (realvalue) {
			realvalue = parseInt(realvalue);
			if (realvalue < 0)
				realvalue = 0;
			else if (realvalue > 999999)
				realvalue = 999999;
		}
		this.setState({sellethAmount: realvalue});
	}

	async updatebalance() {
		let id = this.props.id;
		if (!id) {
			return;
		}
		const user = firebase.auth().currentUser
		if (user) {
			const idToken = await user.getIdToken()
			var res = await axios.post(backUrl + "ipo/account/user_load_balance", {
				id: id
			},
				{
					headers: {
						Authorization: 'Bearer ' + idToken
					}
				});
			if (res.data !== null && res.data.status && res.data.balance !== null && res.data.balance !== []) {
				this.props.dispatch(etherBalanceLoaded(res.data.balance[0]));
				this.props.dispatch(tokenBalanceLoaded(res.data.balance[1]));
			}
			this.setState({
				showbuttonFlag: true
			});

			this.setState({methAmount: ""});
			this.setState({methPrice: ""});
			this.setState({sellethAmount: ""});
			this.setState({sellethPrice: ""});


		} else {
		}
	}

	async orderResProcess(res) {
		this.props.dispatch(balancesLoading());
		console.log(res.status)
		if (res === null) {
			Swal.fire({
				icon: 'error',
				title: 'Error...',
				text: "Error 404 - connection error!",
			});
		} else if (res === "Forbidden") {
			Swal.fire({
				icon: 'error',
				title: 'Error...',
				text: "Too many orders in quick succession - try again in 2 minutes",
			});
		} else {
			if (res.status) {
				await this.updatebalance();
				Swal.fire({
					icon: 'success',
					title: 'Order Success',
					text: 'The tokens will appear in your portfolio when the IPO ends',
				});
			} else if (res.status === 422) {
				let errorMessage = "";
				res.errors.forEach(error => {
					if (error.param === "order.price") {
						errorMessage = "Invalid value for order price";
					} else if (error.param === "order.amount") {
						errorMessage = "Invalid value for order amount";
					}
				});
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: errorMessage,
				});
			} else {
				if (res.error === "amountenough") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "The balance is not enough to execute this order!",
					});
				} else if (res.error === "amountless") {
					Swal.fire({
						icon: 'error',
						title: 'Error...',
						text: "You should purchase over 0 each time!",
					});
				} else if (res.error === "amountover") {
					Swal.fire({
						icon: 'error',
						title: 'Error...',
						text: "You can only purchase 500 each time!",
					});
				} else if (res.error === "account") {
					Swal.fire({
						icon: 'error',
						title: 'Error...',
						text: "You cant make sell order in this account!",
					});
				} else {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Error interaction - please contact to admin!",
					});
				}
			}
		}
		this.props.dispatch(balancesLoaded());
	}

	async send_makeBuyOrder(buyOrder, account, tokenBalance, etherBalance, id) {
		if (buyOrder.amount * buyOrder.price > etherBalance) {
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: "The Cash balance is not enough to execute this order!",
			});
			this.reset_values();
			return;
		}
		const user = firebase.auth().currentUser
		if (user) {
			// user logged in
			const idToken = await user.getIdToken()
			this.props.dispatch(orderCancelling());
			this.setState({showbuttonFlag: false});
			try {
				var makeBuyOrder_res = await axios.post(backUrl + "ipo/order/buy_order", {
					order: buyOrder,
					tokenbal: tokenBalance,
					etherbal: etherBalance,
					id: id
				},
					{
						headers: {
							Authorization: 'Bearer ' + idToken
						}
					});
				await this.orderResProcess(makeBuyOrder_res.data);
			} catch (error) {
				if (error.response.data.errors) {
					let errorMessage = error.response.data.errors[0].msg;
					let errorParam = error.response.data.errors[0].param;
					if (errorParam === "order.amount") {
						Swal.fire({
							icon: 'error',
							title: 'Error',
							text: "Invalid order amount",
						});
					} else if (errorParam === "order.price") {
						Swal.fire({
							icon: 'error',
							title: 'Error',
							text: "Invalid order price",
						});
					}
				} else {
					this.orderResProcess(error.response.data);
				}
			}
			this.props.dispatch(updateOrderCancellingFlagFalse());
			this.setState({showbuttonFlag: true});
		}
		else {
		}
	}


	async send_makeSellOrder(sellOrder, account, tokenBalance, etherBalance, id) {
		if (sellOrder.amount > tokenBalance) {
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: "The token balance is not enough to execute this order!",
			});
			this.reset_values();
			return;
		}
		const user = firebase.auth().currentUser
		if (user) {
			// user logged in
			const idToken = await user.getIdToken()
			this.props.dispatch(orderCancelling());
			this.setState({showbuttonFlag: false});
			var makeSellOrder_res = await axios.post(backUrl + "ipo/order/sell_order", {
				order: sellOrder,
				tokenbal: tokenBalance,
				etherbal: etherBalance,
				id: id
			},
				{
					headers: {
						Authorization: 'Bearer ' + idToken
					}
				});
			await this.orderResProcess(makeSellOrder_res.data);
			this.props.dispatch(updateOrderCancellingFlagFalse());
			this.setState({showbuttonFlag: true});
		}

		else {
		}
	}



	renderShowForm() {
		const {id, account, tokenBalance, etherBalance} = this.props;
		return (
			<Fragment>
				{this.state.showbuttonFlag ?
					<div className="card market-trade">
						<form action="#" onSubmit={(event) => {
							event.preventDefault();
							Swal.fire({
								html:
									'<ul>' +
									`<li> Order Type: Buy</li>` +
									`<li> Token:  ${id}</li>` +
									`<li> Price: £${(parseFloat(this.state.methPrice)).toFixed(2)} (${(parseFloat(this.state.methPrice) * parseFloat(this.state.ethPriceData)).toFixed(2)})</li>` +
									`<li> Amount: ${(parseFloat(this.state.methAmount)).toFixed(2)}</li>` +
									`<li><b>Total: £${((Math.round(parseFloat(this.state.methPrice) * parseFloat(this.state.methAmount) * 1000)) / 1000).toFixed(2)}  (${((Math.round(parseFloat(this.state.methPrice) * parseFloat(this.state.methAmount) * 1000)) / 1000 * parseFloat(this.state.ethPriceData)).toFixed(2)})</li>` +
									'</ul>',
								title: 'Are you sure?',
								showCancelButton: true,
								confirmButtonColor: '#26de81',
								cancelButtonColor: '#d33',
								confirmButtonText: 'Confirm'
							}).then((result) => {
								if (result.isConfirmed) {
									this.send_makeBuyOrder({price: this.state.methPrice, amount: this.state.methAmount}, account, tokenBalance, etherBalance, id);
								}
							})
						}}>
							<div className="card-header">
								<Row className='align-items-center'>
									<Col md="6" sm="6" xs="6" className="">
										<h3 className="card-title">
											Market
										</h3>
									</Col>
									<Col md='6' sm="6" xs="6" className="align-items-rightd d-flex">
										<Button variant='outline-success' size='sm' href='#0' className="" style={{width: "80px", marginLeft: "auto"}}>Deposit</Button>
									</Col>
								</Row>
							</div>
							<div className="card-body">
								<div className="mb-5">
									<p>
										<span className="text-muted">
											Cash balance: {' '}
										</span>
										<span className="fw-semibold">
											£{etherBalance ? (parseFloat(etherBalance)).toFixed(2) : ""} {' '}
											<span className="fs-7 text-muted">
												(${(parseFloat(etherBalance) * parseFloat(this.state.ethPriceData)).toFixed(2)})
											</span>
										</span>
									</p>

									<div className="input-group mb-2">
										<span className="input-group-text">
											Amount
										</span>
										<input
											type="number"
											className="form-control"
											placeholder="Amount"
											value={this.state.methAmount}
											// defaultValue={sellethAmount}
											onChange={(e) => this.onbuyChangeEthAmountMarket(e)}
											min="0"
											max="100000"
											required
											strict="true"
										/>
									</div>

									<div className="row g-2 mb-2">
										<div className="col-auto">
											<span className="input-group-text h-100">
												Total
											</span>
										</div>
										<div className="col">
											<div className="form-control">
												{((Math.round(parseFloat(this.state.methPrice * this.state.methAmount) * 1000)) / 1000).toFixed(2)}
											</div>
										</div>
									</div>
								</div>

								<Button
									type='submit'
									variant='success'
									className='w-100'
								>
									Buy
								</Button>
							</div>
						</form>
					</div>
					:
					<div>
						<p>Please wait - executing order&nbsp; </p>
						<Spinner />
					</div>
				}
			</Fragment>
		)
	}

	render() {
		return (
			<Fragment>
				{this.renderShowForm()}
			</Fragment>
		);
	}
}

function mapStateToProps(state) {
	return {
		tokenBalance: tokenBalanceSelector(state),
		account: accountSelector(state),
		etherBalance: etherBalanceSelector(state),
	}
}

export default connect(mapStateToProps)(IPOTrade)
