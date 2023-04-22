import React, { Component } from 'react'
import { connect } from 'react-redux'
import { CloseButton } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import firebase from "firebase";
import Spinner from './Spinner'
import moment from "moment";

import {
	accountSelector,
	orderCancellingSelector,
} from '../store/selectors';
import {
	orderCancelling,
	updateOrderCancellingFlagFalse
} from '../store/actions';
import { tokens } from "../config/ExchangeTokens";
import { backUrl } from "../components/constants/routes";
import { ether } from '../helpers';
import { db } from "./firebase/firebase";

class AllOpenOrders extends Component {

	constructor(props) {
		super(props);
		this.state = {
			openOrders: [],
			width : window.innerWidth
		}
		// this.unsubscribe_openOrder = null;
		this.handleWindowResize = this.handleWindowResize.bind(this);
	}

	componentDidMount(){
		this.setState({width : window.innerWidth});
		window.addEventListener("resize", this.handleWindowResize);
	}

	handleWindowResize(){
		// setWidth(window.innerWidth);
		this.setState({width : window.innerWidth});
	}

	async loadOpenOrders() {
		try {
			this.setState({ openOrders: [] });
			let account = localStorage.getItem("account-address");
			for (let i = 0; i < tokens.length; i++) {
				let snapshot_openOrders = await db.collection("OpenOrder").doc(tokens[i]).collection(account).get();
				if (snapshot_openOrders.docs.length > 0) {
					let temp_openOrders = [];
					snapshot_openOrders.docs.map((doc) => (
						temp_openOrders.push(doc.data())
					));
					for (let i = 0; i < temp_openOrders.length; i++) {
						if (this.state.openOrders.filter((element) => element._priceInWei === temp_openOrders[i]._priceInWei && element.timestamp === temp_openOrders[i].timestamp).length === 0) {
							this.setState({ openOrders: [...this.state.openOrders, temp_openOrders[i]] });
							console.log("AllOpenOrders loadOpenOrders this.state.openOrders = : ", this.state.openOrders);
						}
					}
				}
			}
		} catch (error) {
			console.log("---------- loadMyOpenOrders error : ", error);
		}
	}

	componentDidMount() {
		this.unsubscribe_openOrder = db.collection('stateRealtime').doc("changeTransaction").onSnapshot((snap) => {
			this.loadOpenOrders();
		});
	}

	componentWillUnmount() {
		if (this.unsubscribe_openOrder !== null) {
			this.unsubscribe_openOrder();
		}
	}

	showOpenOrders(props) {

		const cancel_update = async (order) => {
			const { dispatch } = props;
			const { _amountInWei, _priceInWei, _symbolName } = order;
			Swal.fire({
				html: `
				<div class="row">
					<div class="col-6">
						<div class='mb-3'>
							<span class="fs-6 text-muted">
								Order Type:
							</span>
							<h5>
								Cancel
							</h5>
						</div>
					</div>
					<div class="col-6">
						<div class='mb-3'>
							<span class="fs-6 text-muted">
								Token:
							</span>
							<h5>
								${_symbolName}
							</h5>
						</div>
					</div>
					<div class="col-6">
						<div class='mb-3'>
							<span class="fs-6 text-muted">
								Price:
							</span>
							<h5>
								£${(parseFloat(ether(_priceInWei))).toFixed(2)}
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
								${(parseFloat(ether(_amountInWei))).toFixed(2)}
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
						£${((Math.round(parseFloat(ether(_priceInWei)) * parseFloat(ether(_amountInWei)) * 1000)) / 1000).toFixed(2)}
					</h5>
				</div>
				`,
				title: "Are you sure?",
				showCancelButton: true,
				confirmButtonColor: "#26de81",
				cancelButtonColor: "#d33",
				confirmButtonText: "Confirm",
			}).then(async (result) => {
				if (result.isConfirmed) {
					const user = firebase.auth().currentUser
					const idToken = await user.getIdToken()
					// console.log(idToken, order);
					await dispatch(orderCancelling());
					try {
						let cancelOrder_result = await axios.post(backUrl + "order/cancel_order",
							{
								order: order,
							},
							{
								headers: {
									Authorization: 'Bearer ' + idToken
								}
							});
						if (cancelOrder_result.data != null) {
							if (cancelOrder_result.data.status) {
								Swal.fire({
									icon: 'success',
									title: 'Order Success',
									text: 'Order is cancelled as successfully.',
								});
							} else {
								Swal.fire({
									icon: "error",
									title: "Error...",
									text: "The server is busy please try again!",
								});
							}
						} else {
							Swal.fire({
								icon: "error",
								title: "Error...",
								text: "Error 404 - connection error!",
							});
						}
						this.loadOpenOrders();
					} catch (error) {
						Swal.fire({
							icon: "error",
							title: "Error...",
							text: "Server Connection Error - 404!",
						});
					}
					await dispatch(updateOrderCancellingFlagFalse());
				}
			});
		};
		console.log(this.state.openOrders);
		const { width } = this.state;
		return (
			<>
				{this.state.openOrders.map((order, index) => {
					console.log(order)
					return (
						width > 780 ? <tr data-href="exchange-light.html" key={index}>
							<td>
								<div className="fs-6">{moment.unix(order.timestamp).format('h:mm:ss a')}</div>
								<span style={{color: '#858789', fontSize: '.65rem'}} className=' ws-1'>{moment.unix(order.timestamp).format(' M / D / Y')}</span>
							</td>
							<td><a className='link-underline' href={`/players/${order._symbolName}`}>{order._symbolName}</a></td>
							<td>
								<span className="text-capitalize">{order.orderType}</span>
							</td>
							<td>£{(parseFloat(ether(order._priceInWei))).toFixed(2).toString()}</td>
							<td>
								<span className="text-muted">{order.orderType === 'buy' ? "+" : "-"}{(parseFloat(ether(order._amountInWei))).toFixed(2)}</span>
							</td>
							<td>
								<CloseButton
									key={index.toString() + "button"}
									onClick={(e) => {
										cancel_update(order);
									}}
									variant='white'
								/>
							</td>
						</tr> : <div style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', borderBottom: 'var(--bs-card-border-width) solid var(--bs-card-border-color)'}} className='myorders-content'>
							<div style={{width: '50%'}}>
								<div className='card-label'>Time:</div>
								<label className="fs-6">{moment.unix(order.timestamp).format('h:mm:ss a ')}
								<span style={{color: '#858789', fontSize: '.65rem'}} className=' ws-1'>{moment.unix(order.timestamp).format(' M / D / Y')}</span>
								</label>
							</div>
							<div style={{width: '50%'}}>
								<div className='card-label'>Token:</div>
								<label className="fs-6">{order._symbolName}</label>
							</div>
							<div style={{width: '50%'}}>
								<div className='card-label'>Buy / Sell:</div>
								<label className="fs-6">{order.orderType}</label>
							</div>
							<div style={{width: '50%'}}>
								<div className='card-label'>Price:</div>
								<label className="fs-6">£{(parseFloat(ether(order._priceInWei))).toFixed(2).toString()} <span style={{color: '#858789', fontSize: '.65rem'}}> {(parseFloat(ether(order._priceInWei))).toFixed(2).toString()} ETH</span></label>
							</div>
							<div style={{width: '50%'}}>
								<div className='card-label'>Amount:</div>
								<label className="fs-6">{order.orderType === 'buy' ? "+" : "-"}{(parseFloat(ether(order._amountInWei))).toFixed(2)}</label>
							</div>
							<div style={{width: '50%'}}>
								<div className='card-label'>Total Value:</div>
								<label className="fs-6">
									£{((Math.round(parseFloat(ether(order._priceInWei)) * parseFloat(ether(order._amountInWei)) * 1000)) / 1000).toFixed(2)}
									<span style={{color: '#858789', fontSize: '.65rem'}}> {((Math.round(parseFloat(ether(order._priceInWei)) * parseFloat(ether(order._amountInWei)) * 1000)) / 1000).toFixed(2)} ETH</span>
								</label>
							</div>
							<div style={{width: '100%', fontSize: '1.5rem'}}>
								<button className='btn btn-outline-danger'
									onClick={(e) => {
										cancel_update(order);
									}} style={{width: '100%'}}>Cancel</button>
							</div>
						</div>
					)
				})}
			</>
		)
	}

	render() {
		const { width } = this.state;
		return (
			<div className="container-fluid">
				<div className="card card--overflow markets">
					<div className="card-header">
						<h3 className="card-title">
							My Open Orders
						</h3>
					</div>
					<div className="flex-grow-scroll">
						<div className="table-responsive">
							<table className='table'>
								{
									width > 768 ? <thead>
										<tr>
											<th>Time</th>
											<th>Token Name</th>
											<th>Buy/Sell</th>
											<th>Price</th>
											<th>Amount</th>
											<th>Cancel</th>
										</tr>
									</thead> : <></>
								}
								<tbody>
									{
										(this.state.openOrders !== undefined && this.state.openOrders !== null && !this.props.orderCancelling) ?
											this.showOpenOrders(this.props)
											:
											<Spinner type='table' />
									}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

function mapStateToProps(state) {
	return {
		orderCancelling: orderCancellingSelector(state),
		account: accountSelector(state),
	}
}

export default connect(mapStateToProps)(AllOpenOrders);
