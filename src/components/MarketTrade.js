import React, {Component} from 'react';
import {connect} from 'react-redux'
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
import {Tab, Nav, Button, Row, Col} from 'react-bootstrap';
import Swal from 'sweetalert2';
import config from "../config/wallets.json";


import axios from 'axios';
import {backUrl} from './constants/routes';
import {ether} from '../helpers';

import firebase from "firebase";


class MarketTrade extends Component {

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
		console.log("MarketTrade componentDidUpdate ===> : ", this.props.orderBookBuy.length, this.props.orderBookSell.length);
		if (prevProps.orderBookBuy !== this.props.orderBookBuy) {
			this.setState({orderBookBuy: this.props.orderBookBuy});
			if (this.props.orderBookBuy.length > 0) {
				this.setState({showMarketSellButtonFlag: true});
			}
			else {
				this.setState({showMarketSellButtonFlag: false});
			}
		}
		if (prevProps.orderBookSell !== this.props.orderBookSell) {
			this.setState({orderBookSell: this.props.orderBookSell});
			if (this.props.orderBookSell.length > 0) {
				this.setState({showMarketBuyButtonFlag: true});
			}
			else {
				this.setState({showMarketBuyButtonFlag: false});
			}
		}
	}

	async componentDidMount() {
		// await this.updatebalance(this.props.dispatch, this.props.account);
		let id = this.props.id;
		if (id === null || id === undefined) {
			id = "ceriksen";
		}
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
		this.unsubscribe = db.collection('Orderbook').doc(id).onSnapshot(async (snap) => {
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

	onbuyChangeEthAmount(e) {
		let realvalue = e.target.value;
		if (realvalue) {
			realvalue = parseInt(realvalue);
			if (realvalue < 0)
				realvalue = 0;
			else if (realvalue > 999999)
				realvalue = 999999;
		}
		this.setState({ethAmount: realvalue});
	}

	onbuyChangeEthPrice(e) {
		let realvalue = e.target.value;
		if (realvalue) {
			if (realvalue.includes('.')) {
				if (realvalue.split('.')[1].length > 2) {
					realvalue = realvalue.deleteCharAt(realvalue.length() - 1);
				}
			}
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
		this.setState({ethPrice: realvalue});
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

	onsellChangeEthPrice(e) {
		let realvalue = e.target.value;
		if (realvalue) {
			if (realvalue.includes('.')) {
				if (realvalue.split('.')[1].length > 2) {
					realvalue = realvalue.deleteCharAt(realvalue.length() - 1);
				}
			}
			realvalue = (parseFloat(realvalue));
			if (realvalue < 0) {
				realvalue = 0.01;
			}
			else if (realvalue > 9999.99) {
				realvalue = 9999.99;
			}
		}
		this.setState({sellethPrice: realvalue});
	}

	onbuyChangeEthAmountMarket(e) {
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




	onsellChangeEthAmountMarket(e) {
		this.setState({msellethAmount: parseFloat(e.target.value)});
		var maxprice = 0.01;
		if (this.props.orderBookBuy.length > 0) {
			maxprice = parseFloat(ether(parseFloat(this.props.orderBookBuy[0].tokenPrice) * 1e18));
		} else {
			Swal.fire({
				icon: 'error',
				title: 'Error',
				text: "Price must be higher than 0!",
			})
			return;
		}
		for (var i = 0; i < this.props.orderBookBuy.length; i++) {
			if (maxprice < parseFloat(ether(parseFloat(this.props.orderBookBuy[i].tokenPrice) * 1e18))) {
				maxprice = parseFloat(ether(parseFloat(this.props.orderBookBuy[i].tokenPrice) * 1e18));
			}
		}
		this.setState({msellethPrice: maxprice});
	}

	async updatebalance() {
		let id = this.props.id;
		if (id === null || id === undefined) {
			id = "cronaldo";
		}
		const user = firebase.auth().currentUser
		if (user) {
			// user logged in
			const idToken = await user.getIdToken()
			console.log(idToken)
			var res = await axios.post(backUrl + "account/user_load_balance", {
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
			// this.setState({ethAmount: ""});
			// this.setState({sellethAmount: ""});
			// this.setState({ethPrice: ""});
			// this.setState({sellethPrice: ""});
			this.setState({methAmount: ""});
			this.setState({methPrice: ""});
			this.setState({msellethAmount: ""});
			this.setState({msellethPrice: ""});
		} else {
			console.log("User not logged in")
		}
	}

	async orderResProcess(res) {
		console.log("boom")
		this.props.dispatch(balancesLoading());
		if (res === null) {
			Swal.fire({
				icon: 'error',
				title: 'Error...',
				text: "Error 404 - connection error!",
			});
		}
		else {
			if (res.status) {
				await this.updatebalance();
				let result_text = "Your order has been added to the orderbook as there is currently no matching offer for your bid. You can wait for another user to fill your order or you can cancel it.";
				if (res.result === "FullFill") {
					result_text = "Your order was filled and executed and the tokens or cash have been added to your portfolio.";
				}
				else if (res.result === "PartFill") {
					result_text = "Part of your order was filled instantly and the remainder was added to the orderbook as an offer. You can wait for another user to fill the order or you can cancel it.";
				}
				Swal.fire({
					title: `<i class="ion ion-md-checkmark-circle-outline text-success me-3"></i>Order Success`,
					html: `
						<p class="text-muted fs-4 mb-0">
							${result_text}
						</p>
					`,
					showCloseButton: true,
					closeButtonHtml: `<button class="btn-close btn-close-white"></button>`,
				});
			}
			else if (res.status === 422) {
				let errorMessage = "";
				res.errors.forEach(error => {
					if (error.param === "order.price") {
						errorMessage = "Invalid value for order price";
					}
					else if (error.param === "order.amount") {
						errorMessage = "Invalid value for order amount";
					}
				});
				Swal.fire({
					icon: 'error',
					title: 'Error',
					text: errorMessage,
				});
			}
			else {
				if (res.error === "amount") {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "The balance is not enough to execute this order!",
					});
				}
				else if (res.error === "interaction") {
					Swal.fire({
						icon: 'error',
						title: 'Error...',
						text: "The server is busy, please try again!",
					});
				}
				else if (res.error === "price") {
					Swal.fire({
						icon: 'Price Error',
						title: 'Error',
						text: "Error!",
					});
				}
				else {
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
				title: `<i class="ion ion-md-close-circle-outline text-danger me-3"></i>Error`,
				html: `
					<p class="text-muted fs-4 mb-0">
						The Cash balance is not enough to execute this order!
					</p>
				`,
				showCloseButton: true,
				closeButtonHtml: `<button class="btn-close btn-close-white"></button>`,
			});
			this.reset_values();
			return;
		}
		const user = firebase.auth().currentUser

		if (user) {
			// user logged in
			const idToken = await user.getIdToken()
			console.log(idToken)
			this.props.dispatch(orderCancelling());
			this.setState({showbuttonFlag: false});
			try {
				var makeBuyOrder_res = await axios.post(backUrl + "order/buy_order", {
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
			console.log("User not logged in")
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
			console.log(idToken)
			this.props.dispatch(orderCancelling());
			this.setState({showbuttonFlag: false});
			try {
				var makeSellOrder_res = await axios.post(backUrl + "order/sell_order", {
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
			} catch (error) {
				if (error.response && error.response.status === 422) {
					if (error.response.data.errors) {
						const errorData = error.response.data.errors;
						let errorText = "";
						errorData.forEach(error => {
							if (error.param === "order.amount") {
								errorText = "Invalid value for order amount";
							}
							else if (error.param === "order.price") {
								errorText = "Invalid value for order price";
							}
						});
						Swal.fire({
							icon: 'error',
							title: 'Error',
							text: errorText,
						});
					}
				}
				else {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: "Error interaction - please contact to admin!",
					});
				}
				this.props.dispatch(updateOrderCancellingFlagFalse());
				this.setState({showbuttonFlag: true});
				return;
			}
			await this.orderResProcess(makeSellOrder_res.data);
			this.props.dispatch(updateOrderCancellingFlagFalse());
			this.setState({showbuttonFlag: true});
		}
		else {
			console.log("User not logged in")
		}
	}

	renderShowForm() {
		const {id, account, tokenBalance, etherBalance} = this.props;
		return (
			<>
				{this.state.showbuttonFlag ?
					<Tab.Container defaultActiveKey="market">
						<div className="card-header">
							<Row className='align-items-center m-0 d-flex'>
								<Col md="6" sm="6" xs="6"  className='mt-2 pt-2'>
									<Nav variant="tabs">
										<Nav.Item>
											<Nav.Link eventKey="limit">Limit</Nav.Link>
										</Nav.Item>
										<Nav.Item>
											<Nav.Link eventKey="market">Market</Nav.Link>
										</Nav.Item>
									</Nav>
								</Col>
								<Col md='6' sm="6" xs="6" className="align-items-rightd d-flex">
									<Button variant='outline-success' size='sm' href='#0' className="" style={{width: "80px", marginLeft: "auto"}}>Deposit</Button>
								</Col>
							</Row>
						</div>
						<Tab.Content className='flex-grow-scroll'>
							<Tab.Pane eventKey='limit'>
								<div className="card-body">
									<Row className='lg-gutters'>
											<Col md="6" className='mt-2 pt-2'>

											<form action="#" onSubmit={(event) => {
												event.preventDefault(id);
												Swal.fire({
													html:
														'<ul>' +
														`<li> Order Type: Buy</li>` +
														`<li> Token:  ${id}</li>` +
														`<li> Price: £${(parseFloat(this.state.ethPrice)).toFixed(2)}  (${(parseFloat(this.state.ethPrice) * parseFloat(this.state.ethPriceData)).toFixed(2)})</li>` +
														`<li> Amount: ${(parseFloat(this.state.ethAmount)).toFixed(2)}</li>` +
														`<li><b>Total: £${((Math.round(parseFloat(this.state.ethPrice) * parseFloat(this.state.ethAmount) * 1000)) / 1000).toFixed(2)}  (${((Math.round(parseFloat(this.state.ethPrice) * parseFloat(this.state.ethAmount) * 1000)) / 1000 * parseFloat(this.state.ethPriceData)).toFixed(2)})</li>` +
														'</ul>',
													title: 'Are you sure?',
													showCancelButton: true,
													confirmButtonColor: '#26de81',
													cancelButtonColor: '#d33',
													confirmButtonText: 'Confirm--'
												}).then((result) => {
													if (result.isConfirmed) {
														this.send_makeBuyOrder({price: this.state.ethPrice, amount: this.state.ethAmount}, account, tokenBalance, etherBalance, id);
													}
												})
											}}>
												<div className='mb-1'>
													<p className="text-muted mb-2">
														Cash Balance: {' '}
														<span className="fw-semibold text-body">
															£{etherBalance ? (parseFloat(etherBalance)).toFixed(2) : ""}
															{' '}
														</span>
														<span className="fs-7">
															{(parseFloat(etherBalance) * (100 / parseFloat(this.state.ethPriceData))).toFixed(2)} ETH
														</span>
													</p>

													<div className="input-group mb-2">
														<div className='num-count-content'>
															<button type="button" className='count-num-up' onClick={() => {
																console.log(this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1)
																this.setState({
																	ethPrice: (Number.parseFloat(this.state.ethPrice) + 1) < 0 || this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1
															})}}>
																<i className='fas fa-angle-up'></i>
															</button>
															<button type="button" onClick={() => {
																this.setState({
																	ethPrice: this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) - 1
																});
															}} className='count-num-down'>
																<i className='fas fa-angle-down'></i>
															</button>
														</div>
														<span className="input-group-text" style={{paddingLeft: 0}}>
															Price
														</span>
														<input
															type="number"
															className="form-control"
															onChange={(e) => this.onbuyChangeEthPrice(e)}
															value={this.state.ethPrice}
															// defaultValue={ethPrice}
															placeholder="0.00"
															style={{textAlign: 'end'}}
															max="9999.99"
															min="0.01"
															required
															strict="true"
															step="0.01"
														/>
													</div>

													<div className="input-group mb-2">
														<div className='num-count-content'>
															<button type="button" className='count-num-up' onClick={() => {
																console.log(this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1)
																this.setState({
																	ethPrice: (Number.parseFloat(this.state.ethPrice) + 1) < 0 || this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1
															})}}>
																<i className='fas fa-angle-up'></i>
															</button>
															<button type="button" onClick={() => {
																this.setState({
																	ethPrice: this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) - 1
																});
															}} className='count-num-down'>
																<i className='fas fa-angle-down'></i>
															</button>
														</div>
														<span className="input-group-text" style={{paddingLeft: 0}}>
															Amount
														</span>
														<input
															type="number"
															className="form-control"
															placeholder="0.00"
															style={{textAlign: 'end'}}
															onChange={(e) => this.onbuyChangeEthAmount(e)}
															value={this.state.ethAmount}
															// defaultValue={ethAmount}
															min="0"
															max="100000"
															mask="999999"
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
															<div className="form-control total-text">
																{(this.state.ethPrice * this.state.ethAmount).toFixed(2)}
															</div>
														</div>
													</div>

													<p className='mb-2 fs-6'>
														<span className="text-muted">
															Shareburn: {' '}
														</span>
														<span className="fw-semibold">
															{config.shareburnFee}%
														</span>
													</p>
													{
														this.state.ethAmount &&
														<p className='mb-2 fs-6'>
															<span className="text-muted">
																You will receive: {' '}
															</span>
															<span className="fw-semibold">
																{(parseFloat(this.state.ethAmount * (1 - 0.01 * parseInt(config.shareburnFee)))).toFixed(2)} {' '}
															</span>
															Tokens
														</p>
													}
												</div>

												<Button
													type='submit'
													variant='success'
													id='btn-buy'
													className='w-100 blink-success'
												>
													Buy
												</Button>
											</form>
										</Col>

										<Col md='6' className='mt-2 pt-2'>
											<form action="#" onSubmit={(event) => {
												event.preventDefault();
												Swal.fire({
													html:
														'<ul>' +
														`<li> Order Type: Sell</li>` +
														`<li> Token:  ${id}</li>` +
														`<li> Price: £${(parseFloat(this.state.sellethPrice)).toFixed(2)} (${(parseFloat(this.state.sellethPrice) * parseFloat(this.state.ethPriceData)).toFixed(2)})</li>` +
														`<li> Amount: ${(parseFloat(this.state.sellethAmount)).toFixed(2)}</li>` +
														`<li><b>Total: £${((Math.round(parseFloat(this.state.sellethPrice) * parseFloat(this.state.sellethAmount) * 1000)) / 1000).toFixed(2)} (${((Math.round(parseFloat(this.state.sellethPrice) * parseFloat(this.state.sellethAmount) * 1000)) / 1000 * parseFloat(this.state.ethPriceData)).toFixed(2)})</li>` +
														'</ul>',
													title: 'Are you sure? --22',
													showCancelButton: true,
													confirmButtonColor: '#26de81',
													cancelButtonColor: '#d33',
													confirmButtonText: 'Confirm'
												}).then((result) => {
													if (result.isConfirmed) {
														this.send_makeSellOrder({price: this.state.sellethPrice, amount: this.state.sellethAmount}, account, tokenBalance, etherBalance, id);
													}
												})
											}
											}>
												<div className='mb-1'>
													<p className="text-muted mb-2">
														Available Tokens: {' '}
														<span className="fw-semibold text-body">
															{tokenBalance ? (parseFloat(tokenBalance)).toFixed(2) : ""}
														</span>
													</p>

													<div className="input-group mb-2">
														<div className='num-count-content'>
															<button type="button" className='count-num-up' onClick={() => {
																console.log(this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1)
																this.setState({
																	ethPrice: (Number.parseFloat(this.state.ethPrice) + 1) < 0 || this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1
															})}}>
																<i className='fas fa-angle-up'></i>
															</button>
															<button type="button" onClick={() => {
																this.setState({
																	ethPrice: this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) - 1
																});
															}} className='count-num-down'>
																<i className='fas fa-angle-down'></i>
															</button>
														</div>
														<span className="input-group-text" style={{paddingLeft: 0}}>Price</span>
														<input
															type="number"
															className="form-control"
															placeholder="0.00"
															style={{textAlign: 'end'}}
															value={this.state.sellethPrice}
															// defaultValue={sellethPrice}
															onChange={(e) => this.onsellChangeEthPrice(e)}
															max="9999.99"
															min="0.01"
															required
															strict="true"
															step="0.01"
														/>
													</div>

													<div className="input-group mb-2">
														<div className='num-count-content'>
															<button type="button" className='count-num-up' onClick={() => {
																console.log(this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1)
																this.setState({
																	ethPrice: (Number.parseFloat(this.state.ethPrice) + 1) < 0 || this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1
															})}}>
																<i className='fas fa-angle-up'></i>
															</button>
															<button type="button" onClick={() => {
																this.setState({
																	ethPrice: this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) - 1
																});
															}} className='count-num-down'>
																<i className='fas fa-angle-down'></i>
															</button>
														</div>
														<span className="input-group-text" style={{paddingLeft: 0}}>Amount</span>
														<input
															type="number"
															className="form-control"
															placeholder="0.00"
															style={{textAlign: 'end'}}
															value={this.state.sellethAmount}
															// defaultValue={sellethAmount}
															onChange={(e) => this.onsellChangeEthAmount(e)}
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
															<div className="form-control total-text">
																{(this.state.sellethAmount * this.state.sellethPrice).toFixed(2)}
															</div>
														</div>
													</div>

													<p className='mb-2 fs-6'>
														<span className="text-muted">
															Shareburn: {' '}
														</span>
														<span className="fw-semibold">
															{config.shareburnFee}%
														</span>
													</p>
													{
														this.state.sellethAmount &&
														<p className='mb-2 fs-6'>
															<span className="text-muted">
																You will receive: {' '}
															</span>
															<span className="fw-semibold">
																£{(parseFloat(this.state.sellethAmount * this.state.sellethPrice * (1 - 0.01 * parseInt(config.feesFee)))).toFixed(2)}
															</span>
														</p>
													}
												</div>
												<Button
													type='submit'
													variant='danger'
													id='btn-sell'
													className='w-100 blink-danger'
												>
													Sell
												</Button>
											</form>
										</Col>
									</Row>
								</div>
							</Tab.Pane>

							<Tab.Pane eventKey="market">
								<div className="card-body">
									<Row className='lg-gutters'>
										<Col md='6' className='mt-2 pt-2'>
											<form action="#" onSubmit={(event) => {
												event.preventDefault();
												Swal.fire({
													html:
														`
															<div class="row">
																<div class="col-6">
																	<div class='mb-3'>
																		<span class="fs-6 text-muted">
																			Order Type:
																		</span>
																		<h5>
																			Buy
																		</h5>
																	</div>
																</div>
																<div class="col-6">
																	<div class='mb-3'>
																		<span class="fs-6 text-muted">
																			Token:
																		</span>
																		<h5>
																			${id}
																		</h5>
																	</div>
																</div>
																<div class="col-6">
																	<div class='mb-3'>
																		<span class="fs-6 text-muted">
																			Price:
																		</span>
																		<h5>
																			£${(parseFloat(this.state.methPrice)).toFixed(2)}
																			<span class="text-muted">(${(parseFloat(this.state.methPrice) * parseFloat(this.state.ethPriceData)).toFixed(2)})</span>
																		</h5>
																	</div>
																</div>
																<div class="col-6">
																	<div class='mb-3'>
																		<span class="fs-6 text-muted">
																			Amount:
																		</span>
																		<h5>
																			£${(parseFloat(this.state.methAmount)).toFixed(2)}
																		</h5>
																	</div>
																</div>
															</div>

															<hr />
															<div class='mb-3'>
																<span class="fs-6 text-muted">
																	Total:
																</span>
																<h5>
																	£${((Math.round(parseFloat(this.state.methPrice) * parseFloat(this.state.methAmount) * 1000)) / 1000).toFixed(2)}
																	<span class="text-muted">
																		(${((Math.round(parseFloat(this.state.methPrice) * parseFloat(this.state.methAmount) * 1000)) / 1000 * parseFloat(this.state.ethPriceData)).toFixed(2)})
																	</span>
																</h5>
															</div>
														`,
													title: `<i class="ion ion-md-alert text-warning me-3"></i>Are you sure?`,
													showCancelButton: true,
													showCloseButton: true,
													closeButtonHtml: `<button class="btn-close btn-close-white"></button>`,
													confirmButtonText: 'Confirm',
												}).then((result) => {
													if (result.isConfirmed) {
														this.send_makeBuyOrder({price: this.state.methPrice, amount: this.state.methAmount}, account, tokenBalance, etherBalance, id);
													}
												})
											}}>
												<div className="mb-1">
													<p className="text-muted mb-2">
														Cash Balance: {' '}
														<span className="fw-semibold text-body">
															£{etherBalance ? (parseFloat(etherBalance)).toFixed(2) : ""}
															{' '}
														</span>
														<span className="fs-7">
															{((parseFloat(etherBalance) * (100 / parseFloat(this.state.ethPriceData)))).toFixed(2)} ETH
														</span>
													</p>

													<div className="input-group mb-2">
														<div className='num-count-content'>
															<button type="button" className='count-num-up' onClick={() => {
																console.log(this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1)
																this.setState({
																	ethPrice: (Number.parseFloat(this.state.ethPrice) + 1) < 0 || this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1
															})}}>
																<i className='fas fa-angle-up'></i>
															</button>
															<button type="button" onClick={() => {
																this.setState({
																	ethPrice: this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) - 1
																});
															}} className='count-num-down'>
																<i className='fas fa-angle-down'></i>
															</button>
														</div>
														<span className="input-group-text" style={{paddingLeft:0}}>Amount</span>
														<input
															type="number"
															className="form-control"
															placeholder="0.00"
															style={{textAlign: 'end'}}
															value={this.state.methAmount}
															// defaultValue={sellethAmount}
															onChange={(e) => this.onbuyChangeEthAmountMarket(e)}
															min="0"
															max="100000"
															required
															strict="true"
															disabled={!this.state.showMarketBuyButtonFlag}
														/>
													</div>

													<div className="row g-2 mb-2">
														<div className="col-auto">
															<span className="input-group-text h-100">
																Total
															</span>
														</div>
														<div className="col">
															<div className="form-control total-text">
																{((Math.round(parseFloat(this.state.methPrice * this.state.methAmount) * 1000)) / 1000).toFixed(2)}
															</div>
														</div>
													</div>

													<p className='mb-2 fs-6'>
														<span className="text-muted">
															Shareburn: {' '}
														</span>
														<span className="fw-semibold">
															{config.shareburnFee}%
														</span>
													</p>

													{
														this.state.methAmount &&
														<p className='mb-2 fs-6'>
															<span className="text-muted">
																You will receive: {' '}
															</span>
															<span className="fw-semibold">
																{(parseFloat(this.state.methAmount * (1 - 0.01 * parseInt(config.shareburnFee)))).toFixed(2)}
															</span>
															Tokens
														</p>
													}
												</div>

												<Button
													variant='success'
													type="submit"
													className={`w-100 ${this.state.showMarketBuyButtonFlag && 'blink-success'}`}
													disabled={!this.state.showMarketBuyButtonFlag}
												>
													{this.state.showMarketBuyButtonFlag ? 'Buy' : 'Unavailable'}
												</Button>

											</form>
										</Col>
										<Col md='6' className='mt-2 pt-2'>
											<form action="#" onSubmit={(event) => {
												event.preventDefault();
												Swal.fire({
													html:
														'<ul>' +
														`<li> Order Type: Sell</li>` +
														`<li> Token:  ${id}</li>` +
														`<li> Price: £${(parseFloat(this.state.msellethPrice)).toFixed(2)} (${(parseFloat(this.state.msellethPrice) * parseFloat(this.state.ethPriceData)).toFixed(2)})</li>` +
														`<li> Amount: ${(parseFloat(this.state.msellethAmount)).toFixed(2)}</li>` +
														`<li><b>Total: £${((Math.round(parseFloat(this.state.msellethPrice) * parseFloat(this.state.msellethAmount) * 1000)) / 1000).toFixed(2)} (${((Math.round(parseFloat(this.state.msellethPrice) * parseFloat(this.state.msellethAmount) * 1000)) / 1000 * parseFloat(this.state.ethPriceData)).toFixed(2)})</li>` +
														'</ul>',
													title: 'Are you sure?',
													showCancelButton: true,
													confirmButtonColor: '#26de81',
													cancelButtonColor: '#d33',
													confirmButtonText: 'Confirm'
												}).then((result) => {
													if (result.isConfirmed) {
														this.send_makeSellOrder({price: this.state.msellethPrice, amount: this.state.msellethAmount}, account, tokenBalance, etherBalance, id);
													}
												})
											}}>
												<div className="mb-1">
													<p className="text-muted mb-2">
														Available Tokens: {' '}
														<span className="fw-semibold text-body">
															{tokenBalance ? (parseFloat(tokenBalance)).toFixed(2) : ""}
														</span>
													</p>

													<div className="input-group mb-2">
														<div className='num-count-content'>
															<button type="button" className='count-num-up' onClick={() => {
																console.log(this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1)
																this.setState({
																	ethPrice: (Number.parseFloat(this.state.ethPrice) + 1) < 0 || this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) + 1
															})}}>
																<i className='fas fa-angle-up'></i>
															</button>
															<button type="button" onClick={() => {
																this.setState({
																	ethPrice: this.state.ethPrice == NaN ? 0.00 : Number.parseFloat(this.state.ethPrice) - 1
																});
															}} className='count-num-down'>
																<i className='fas fa-angle-down'></i>
															</button>
														</div>
														<span className="input-group-text" style={{paddingLeft:0}}>
															Amount
														</span>
														<input
															type="number"
															className="form-control"
															placeholder="0.00"
															style={{textAlign: 'end'}}
															value={this.state.msellethAmount}
															// defaultValue={sellethAmount}
															onChange={(e) => this.onsellChangeEthAmountMarket(e)}
															min="0"
															max="100000"
															required
															strict="true"
															disabled={!this.state.showMarketSellButtonFlag}
														/>
													</div>

													<div className="row g-2 mb-2">
														<div className="col-auto">
															<span className="input-group-text h-100">
																Total
															</span>
														</div>
														<div className="col">
															<div className="form-control total-text">
																{((Math.round(parseFloat(this.state.msellethAmount * this.state.msellethPrice) * 1000)) / 1000).toFixed(2)}
															</div>
														</div>
													</div>

													<p className='mb-2 fs-6'>
														<span className="text-muted">
															Shareburn: {' '}
														</span>
														<span className="fw-semibold">
															{config.shareburnFee}%
														</span>
													</p>
													{
														this.state.msellethAmount &&
														<p className='mb-2 fs-6'>
															<span className="text-muted">
																You will receive: {' '}
															</span>
															<span className="fw-semibold">
																£{(parseFloat(this.state.msellethAmount * this.state.msellethPrice * (1 - 0.01 * parseInt(config.feesFee)))).toFixed(2)}
															</span>
														</p>
													}
												</div>
												<Button
													variant="danger"
													type="submit"
													className={`w-100 ${this.state.showMarketSellButtonFlag && 'blink-danger'}`}
													disabled={!this.state.showMarketSellButtonFlag}
												>
													{this.state.showMarketSellButtonFlag ? 'Sell' : 'Unavailable'}
												</Button>
											</form>
										</Col>
									</Row>
								</div>
							</Tab.Pane>
						</Tab.Content>
					</Tab.Container>
					:
					<div className='market-trade-buy market-trade__wait-panel'>
						<div>
							<p className="market_trade_wait_text markets" style={{fontSize: "25px", marginTop: "0px"}}>Please wait - executing order&nbsp; </p>
							<Spinner />
						</div>
					</div>}
			</>
		)
	}

	render() {
		return (
			<div className="market-trade card">
				{this.renderShowForm()}
			</div>
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

export default connect(mapStateToProps)(MarketTrade)
