import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Tabs, Tab, Nav, Row, Button, CloseButton} from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import moment from 'moment';
import firebase from "firebase";
import Spinner from './Spinner';
import {
	accountSelector,
	orderCancellingSelector,
} from '../store/selectors';
import {
	orderCancelling,
	updateOrderCancellingFlagFalse
} from '../store/actions';
import {backUrl} from "./constants/routes";
import {ether} from '../helpers';
import {db} from "./firebase/firebase";


class HistoryOrderIPO extends Component {

	constructor(props) {
		super(props);
		this.state = {
			myFilledOrders: [],
			myOpenOrders: [],
		};
		this.unsubscribe_myFilledOrder = null;
		this.unsubscribe_myOpenOrder = null;
	}

	async loadMyOpenOrders(id) {
		try {
			let account = localStorage.getItem("account-address");
			let snapshot_myOpenOrders = await db.collection("OpenOrder").doc(id).collection(account).get();
			if (snapshot_myOpenOrders.docs.length < this.state.myOpenOrders.length) {
				this.setState({myOpenOrders: []});
			}
			if (snapshot_myOpenOrders.docs.length > 0) {
				let temp_myOpenOrders = [];
				snapshot_myOpenOrders.docs.map((doc) => (
					temp_myOpenOrders.push(doc.data())
				));
				for (let i = 0; i < temp_myOpenOrders.length; i++) {
					if (this.state.myOpenOrders.filter((element) => element._priceInWei === temp_myOpenOrders[i]._priceInWei && element.timestamp === temp_myOpenOrders[i].timestamp).length === 0) {
						this.setState({myOpenOrders: [...this.state.myOpenOrders, temp_myOpenOrders[i]]});
					}
				}
			}
		} catch (error) {
		}
	}

	componentDidMount() {
		let uid = localStorage.getItem("account-info");
		let account = localStorage.getItem("account-address");
		let id = this.props.id;
		if (id === null || id === undefined) {
			id = "ceriksen";
		}
		this.unsubscribe_myOpenOrder = db.collection('OpenOrder').doc(id).collection(account || '0x123').onSnapshot((snap) => {
			this.loadMyOpenOrders(id);
		});
		this.unsubscribe_myFilledOrder = db.collection("UserTransaction").doc(uid).collection("userTransaction")
			.orderBy("timestamp", "desc")
			.limit(100)
			.onSnapshot((querySnapshot) => {
				console.log("HistoryOrderIPO querySnapshot myFilledOrders = : ");
				querySnapshot.docChanges().forEach((filledOrdersDoc) => {
					let filledOrder = filledOrdersDoc.doc.data();
					if (this.state.myFilledOrders.filter((element) => element.transaction_hash === filledOrder.transaction_hash).length === 0 && filledOrder.eth_tokenName.toLowerCase() === id) {
						this.setState({myFilledOrders: [...this.state.myFilledOrders, filledOrder]});
					}
				});
			});
	}

	componentWillUnmount() {
		if (this.unsubscribe_myOpenOrder !== null) {
			this.unsubscribe_myOpenOrder();
		}
		if (this.unsubscribe_myFilledOrder !== null) {
			this.unsubscribe_myFilledOrder();
		}
	}

	showMyFilledOrders() {
		return (
			<table className="table">
				{
					this.props.platform === "mobile" ? <tbody>
						{this.state.myFilledOrders.map((order, index) => (
							<div key={index} className="pt-3">
								<Row className="m-0 d-flex p-1">
									<Row className="m-0 p-0 w-60">
										<div className="text-muted fs-4 my-auto">{"Time:"}</div>
										<div className="fs-4 d-flex my-auto">{moment.unix(order.timestamp).format('h:mm:ss a')} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;&nbsp;{moment.unix(order.timestamp).format('M/D/Y')}</span></div>
									</Row>
									<Row className="fw-medium text-capitalize m-0 p-0 w-40">
										<div className="text-muted fs-4 my-auto">{"Buy / Sell:"}</div>
										<div className="fs-4 my-auto">{order.transaction_type}</div>
									</Row>
								</Row>
								<Row className="m-0 d-flex p-1">
									<Row className="m-0 p-0 w-60">
										<div className="text-muted fs-4 my-auto">{"Price:"}</div>
										<div className="fs-4 d-flex my-auto">£{(parseFloat(order.price)).toFixed(2).toString()} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;&nbsp;${(parseFloat(order.price) * parseFloat(this.state.ethPriceData)).toFixed(2)}</span></div>
									</Row>
									<Row className="fw-medium text-capitalize m-0 p-0 w-40">
										<div className="text-muted fs-4 my-auto">{"Amount:"}</div>
										<div className="fs-4 my-auto">{order.transaction_type === 'buy' ? "+" : "-"}{(parseFloat(order.amount)).toFixed(2)}</div>
									</Row>
								</Row>
								<Row className="m-0 pt-2 pb-1" style={{paddingLeft: "1rem", paddingRight: "1rem"}}>
									<hr className="m-0 p-0" />
								</Row>
							</div>
						))}
					</tbody> : <tbody>
						<tr>
							<th>Time</th>
							<th>Buy/Sell</th>
							<th>Price</th>
							<th>Amount</th>
						</tr>
						{this.state.myFilledOrders.map((order, index) => (
							<tr key={index}>
								<td>
									<div className="fs-6">
										{moment.unix(order.timestamp).format('h:mm:ss a')}
									</div>
									<div className="text-muted fs-7">
										{moment.unix(order.timestamp).format('M/D/Y')}
									</div>
								</td>
								<td>
									<span className="fw-medium text-capitalize">
										{order.transaction_type}
									</span>
								</td>
								<td>
									£{(parseFloat(order.price)).toFixed(2)}
								</td>
								<td>
									<span className="text-muted">
										{order.transaction_type === "Buy" ? "+" : "-"}{(parseFloat(order.amount)).toFixed(2)}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				}
			</table>
		)
	}

	showMyOpenOrders(props) {
		const cancel_update = async (order) => {
			const {dispatch, account} = props;
			const {_amountInWei, _priceInWei, _symbolName} = order;
			Swal.fire({
				html:
					"<ul>" +
					`<li> Order Type: Cancel</li>` +
					`<li> Token: ${_symbolName}</li>` +
					`<li> Price: £${(parseFloat(ether(_priceInWei))).toFixed(2)}</li>` +
					`<li> Amount: ${(parseFloat(ether(_amountInWei))).toFixed(2)}</li>` +
					`<li><b>Total: £${((Math.round(parseFloat(ether(_priceInWei)) * parseFloat(ether(_amountInWei)) * 1000)) / 1000).toFixed(2)}</li>` +
					"</ul>",
				title: "Are you sure?",
				showCancelButton: true,
				confirmButtonColor: "#26de81",
				cancelButtonColor: "#d33",
				confirmButtonText: "Confirm",
			}).then(async (result) => {
				if (result.isConfirmed) {
					const user = firebase.auth().currentUser
					const idToken = await user.getIdToken()
					await dispatch(orderCancelling());
					try {
						let cancelOrder_result = await axios.post(backUrl + "ipo/order/cancel_order",
							{
								order: order,
								id: props.id
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

		return (
			<table className="table">
				{
					this.props.platform === "mobile" ? <tbody>
						{this.state.myOpenOrders.map((order, index) => (
							<div key={index} className="pt-3">
								<Row className="m-0 d-flex p-1">
									<Row className="m-0 p-0 w-60">
										<div className="text-muted fs-4 my-auto">{"Time:"}</div>
										<div className="fs-4 d-flex my-auto">{moment.unix(order.timestamp).format('h:mm:ss a')} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;&nbsp;{moment.unix(order.timestamp).format('M/D/Y')}</span></div>
									</Row>
									<Row className="fw-medium text-capitalize m-0 p-0 w-40">
										<div className="text-muted fs-4 my-auto">{"Buy / Sell:"}</div>
										<div className="fs-4 my-auto">{order.orderType}</div>
									</Row>
								</Row>
								<Row className="m-0 d-flex p-1">
									<Row className="m-0 p-0 w-60">
										<div className="text-muted fs-4 my-auto">{"Price:"}</div>
										<div className="fs-4 d-flex my-auto">£{(parseFloat(ether(order._priceInWei))).toFixed(2).toString()} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;&nbsp;${(parseFloat(ether(order._priceInWei)) * parseFloat(this.state.ethPriceData)).toFixed(2)}</span></div>
									</Row>
									<Row className="fw-medium text-capitalize m-0 p-0 w-40">
										<div className="text-muted fs-4 my-auto">{"Amount:"}</div>
										<div className="fs-4 my-auto">{order.orderType === 'buy' ? "+" : "-"}{(parseFloat(ether(order._amountInWei))).toFixed(2)}</div>
									</Row>
								</Row>
								<Row className="m-0 pt-2 pb-1" style={{paddingLeft: "1rem", paddingRight: "1rem"}}>
									<Button variant="outline-danger" onClick={(e) => {cancel_update(order);}}>Cancel</Button>
									<hr className="m-0 p-0 mt-2" />
								</Row>
							</div>
						))}
					</tbody> : <tbody>
						<tr>
							<th>Time</th>
							<th>Buy/Sell</th>
							<th>Price</th>
							<th>Amount</th>
							<th className="text-center">Cancel</th>
						</tr>
						{this.state.myOpenOrders.map((order, index) => (
							<tr key={index}>
								<td>
									<div className="fs-6">
										{moment.unix(order.timestamp).format('h:mm:ss a')}
									</div>
									<div className="text-muted fs-7">
										{moment.unix(order.timestamp).format('M/D/Y')}
									</div>
								</td>
								<td>
									<span className="fw-medium text-capitalize">
										{order.orderType}
									</span>
								</td>
								<td>
									£{(parseFloat(ether(order._priceInWei))).toFixed(2).toString()}
								</td>
								<td>
									<span className="text-muted">
										{order.orderType === 'buy' ? "+" : "-"}{(parseFloat(ether(order._amountInWei))).toFixed(2)}
									</span>
								</td>
								<td className="text-center">
									<CloseButton
										key={index.toString() + "button"}
										onClick={(e) => {
											cancel_update(order);
										}}
										variant='white'
									/>
								</td>
							</tr>
						))}
					</tbody>
				}
			</table>
		)
	}

	render() {
		return (
			<div className="market-history card">
				<Tab.Container defaultActiveKey="open-orders">
					<div className="card-header">
						<Nav variant="tabs">
							<Nav.Item>
								<Nav.Link eventKey="open-orders">Open Orders</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="order-history">Order History</Nav.Link>
							</Nav.Item>
						</Nav>
					</div>

					<Tab.Content className='flex-grow-scroll'>
						<Tab.Pane eventKey='open-orders'>
							<div className="card-body card-body--table">
								{(this.state.myFilledOrders !== undefined && this.state.myFilledOrders !== null && !this.props.orderCancelling) ?
									this.showMyOpenOrders(this.props) :
									<Spinner type='table' />
								}
							</div>
						</Tab.Pane>
						<Tab.Pane eventKey='order-history'>
							<div className="card-body card-body--table">
								{(this.state.myFilledOrders !== undefined && this.state.myFilledOrders !== null && !this.props.orderCancelling) ?
									this.showMyFilledOrders()
									:
									<Spinner type='table' />
								}
							</div>
						</Tab.Pane>
					</Tab.Content>
				</Tab.Container>
			</div>
		)
	}

}

function mapStateToProps(state) {
	return {
		orderCancelling: orderCancellingSelector(state),
		account: accountSelector(state),
	};
}

export default connect(mapStateToProps)(HistoryOrderIPO);
