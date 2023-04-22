import React, { Component } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import Spinner from './Spinner'
import { ether, GREEN, RED } from '../helpers';
import {
	accountSelector,
} from '../store/selectors';
import { connect } from 'react-redux';

class MarketHistory extends Component {

	constructor(props) {
		super(props);
		this.state = {
			filledOrders: [],
		};
		this.unsubscribe_FilledOrder = null;
	}

	componentDidUpdate(prevProps) {
		// console.log(" ---------------------- ", prevProps.filledOrders.length, this.props.filledOrders.length);
		if (prevProps.filledOrders !== this.props.filledOrders) {
			this.setState({ filledOrders: this.props.filledOrders });
		}
	}

	// componentDidMount() {
	//     let id = this.props.id;
	//     if (id === null || id === undefined) {
	//         id = "ceriksen";
	//     }
	//     this.unsubscribe_FilledOrder = db.collection('FilledOrder').doc(id).collection(this.props.account).onSnapshot((snap) => {
	//         this.loadFilledOrders(id);
	//     });
	// }

	componentWillUnmount() {
		if (this.unsubscribe_FilledOrder !== null) {
			this.unsubscribe_FilledOrder();
		}
	}

	showFilledOrders() {

		var orders = this.state.filledOrders;
		orders = orders.sort((a, b) => {
			return parseInt(a.timestamp) - parseInt(b.timestamp);
		});
		return (
			<tbody>
				{orders.reverse().map((order, index) => {
					return (
						// <tr className={`order-${order.timestamp}`} key={index}>
						<tr key={index}>
							<td>
								<div className="fs-6">{moment.unix(parseInt(order.timestamp)).format('h:mm:ss a')}</div>
								<div className="fs-7 text-muted">{moment.unix(parseInt(order.timestamp)).format('M/D')}</div>
							</td>
							<td className={`text-${order.orderType === 'buy' ? GREEN : RED}`}>
								£{(parseFloat(ether(order._priceInWei))).toFixed(2)}
							</td>
							<td className="text-muted">{(parseFloat((order._amountInWei))).toFixed(2)}</td>
						</tr>
					)
				})}
			</tbody>
		)
	}

	render() {

		return (
			<div className="market-history card card--overflow">
				<div className="card-header">
					<h3 className="card-title">
						Recent Trades {' '}
						<OverlayTrigger
							placement="left"
							overlay={
								<Tooltip id="tooltip-order-book">
									<p className='mb-0'>
										The Recent Trades list shows the recent activity for the particular token. Buy orders are green and sell orders are red. Only orders that have been executed are added to the Recent Trades table.
									</p>
								</Tooltip>
							}
						>
							{({ ref, ...triggerHandler }) => (
								<div className="tooltip-trigger" ref={ref} {...triggerHandler}>
									<i className="fas fa-info-circle"></i>
								</div>
							)}
						</OverlayTrigger>
					</h3>
				</div>
				<div className="flex-grow-scroll">
					<div className="card-body card-body--table">
						<table className="table">
							<thead>
								<tr>
									<th className="Time">Time</th>
									<th className="Price">Price</th>
									<th className="Amount">Amount</th>
								</tr>
							</thead>
							{this.state.filledOrders ? this.showFilledOrders() : <Spinner type="table" />}
						</table>
					</div>
				</div>
			</div>
		)
	}
}

function mapStateToProps(state) {
	return {
		account: accountSelector(state),
	};
}
export default connect(mapStateToProps)(MarketHistory);
