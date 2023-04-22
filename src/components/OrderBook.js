import React, {Component} from 'react'
import {connect} from 'react-redux'
import {OverlayTrigger, Tooltip} from 'react-bootstrap'
import Spinner from './Spinner'
import {

} from '../store/selectors'
import {db} from "./firebase/firebase";


class OrderBook extends Component {

	constructor(props) {
		super(props);
		this.state = {
			orderBookSell: props.orderBookSell,
			orderBookBuy: props.orderBookBuy,
			isIPO: props.isIPO
		};
	}

	componentDidUpdate(prevProps) {
		if (prevProps.orderBookBuy !== this.props.orderBookBuy) {
			this.setState({orderBookBuy: this.props.orderBookBuy});
		}
		if (prevProps.orderBookSell !== this.props.orderBookSell) {
			this.setState({orderBookSell: this.props.orderBookSell});
		}
	}

	async fillaction(type, tamount, tprice) {
		var flags = 1;
		let account = localStorage.getItem("account-address");
		await db.collection('fill').get()
			.then(snapshot => {
				snapshot.forEach(doc => {
					flags = doc.data().flag;
				});
			})
		if (flags === 1) {
			flags = 0
			db.collection('fill').doc(account).set({
				ordertype: type,
				price: tprice,
				amount: tamount,
				flag: flags
			})
		} else {
			flags = 1
			db.collection('fill').doc(account).set({
				ordertype: type,
				price: tprice,
				amount: tamount,
				flag: flags
			})
		}
	}

	renderOrder(order, type, keys) {
		let red_id = '';
		let green_id = '';

		if (order.amount >= 1 && order.amount <= 100) {
			red_id = ''
			green_id = ''
		}
		if (order.amount > 100 && order.amount <= 200) {
			red_id = '-5'
			green_id = '-5'
		}
		if (order.amount > 200 && order.amount <= 300) {
			red_id = '-8'
			green_id = '-8'
		}
		if (order.amount > 300 && order.amount <= 400) {
			red_id = '-10'
			green_id = '-10'
		}
		if (order.amount > 400 && order.amount <= 500) {
			red_id = '-20'
			green_id = '-20'
		}
		if (order.amount > 500 && order.amount <= 600) {
			red_id = '-40'
			green_id = '-40'
		}
		if (order.amount > 600 && order.amount <= 700) {
			red_id = '-60'
			green_id = '-60'
		}
		if (order.amount > 700) {
			red_id = '-80'
			green_id = '-80'
		}

		return (
			<OverlayTrigger
				key={keys}
				placement='auto'
				overlay={
					<Tooltip id={keys}>
						{`Click here to ${type}`}
					</Tooltip>
				}
			>
				{
					type === "buy" ?
						<tr
							key={keys}
							onClick={(e) => this.fillaction(type, order.amount, order.tokenPrice)}
							className={`order-book-row text-danger danger-bg${red_id}`}
						>
							<td>£{((parseFloat(order.tokenPrice)).toFixed(2)).toString()}</td>
							<td>{((parseFloat(order.amount)).toFixed(2))}</td>
							<td>£{((parseFloat(order.amount * order.tokenPrice)).toFixed(2)).toString()}</td>
							{/* <td>{order.tokenCount}</td> */}
						</tr>
						:
						<tr
							key={keys}
							onClick={(e) => this.fillaction(type, order.amount, order.tokenPrice)}
							className={`order-book-row text-success success-bg${green_id}`}>
							<td>£{((parseFloat(order.tokenPrice)).toFixed(2)).toString()}</td>
							<td>{(parseFloat(order.amount).toFixed(2))}</td>
							<td>£{((parseFloat(order.amount * order.tokenPrice)).toFixed(2)).toString()}</td>
							{/* <td>{order.tokenCount}</td> */}
						</tr>
				}
			</OverlayTrigger>
		)
	}

	showOrderBook() {
		let sellord = this.state.orderBookSell;
		let buyord = this.state.orderBookBuy;
		sellord.sort(function (x, y) {
			return y.tokenPrice - x.tokenPrice;
		});
		buyord.sort(function (x, y) {
			return y.tokenPrice - x.tokenPrice;
		});
		return (
			<div className="card-body card-body--table">
				<table className="table table--order-book">
					<thead>
						<tr>
							<th>Price</th>
							<th>Amount</th>
							<th>Total</th>
						</tr>
					</thead>
					<tbody>
						{sellord.map((order, key) => this.renderOrder(order, "buy", key))}
						{buyord.map((order, key) => this.renderOrder(order, "sell", key))}
					</tbody>
				</table>
			</div>
		)
	}

	render() {
		return (
			<div className={this.state.isIPO ? "card card--overflow" : "order-book card card--overflow"}>
				<div className="card-header">
					<h3 className="card-title">
						Order Book {' '}
						<OverlayTrigger
							placement="left"
							overlay={
								<Tooltip id="tooltip-order-book">
									<p>
										An orderbook is a list of all buy and sell offers for the token. Buy offers are green and sell offers are red. To buy or sell tokens instantly you will need to match another users offer.
									</p>
									<p className='mb-0'>
										If your order is not matched instantly, it will be added to the orderbook where it will remain until another user fills it or you cancel it.
									</p>
								</Tooltip>
							}
						>
							{({ref, ...triggerHandler}) => (
								<div className="tooltip-trigger" ref={ref} {...triggerHandler}>
									<i className="fas fa-info-circle"></i>
								</div>
							)}
						</OverlayTrigger>
					</h3>
				</div>
				<div className="flex-grow-scroll">
					{
						this.state.orderBookBuy !== undefined && this.state.orderBookBuy !== null ?
							this.showOrderBook()
							:
							<Spinner type="table" />
					}
				</div>
			</div>
		)
	}
}

function mapStateToProps(state) {
	return {
	}
}

export default connect(mapStateToProps)(OrderBook);
