import React, {Component} from 'react';
import {connect} from 'react-redux';

import IPOTrade from '../components/IPOTrade';
import IPOCountdown from '../components/IPOCountdown';
import HistoryOrderIPO from '../components/HistoryOrderIPO';
import MarketHistory from '../components/MarketHistory';
import OrderBook from '../components/OrderBook';
import {db} from "../components/firebase/firebase";
import {timerSelector} from '../store/selectors';

//for screen width and height

class Ipo extends Component {
	constructor(props) {
		super(props);
		this.state = {
			width: 0,
			height: 0,
			updateOrderFlag: true,
			myFilledOrders: [],
			filledOrders: [],
			myOpenOrders: [],
			orderBookSell: [],
			orderBookBuy: [],
		};
		this.unsubscribe = null;
		this.unsubscribe_FilledOrder = null;
		this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
	}

	updateWindowDimensions() {
		this.setState({width: window.innerWidth, height: window.innerHeight});
	}

	async loadOpenOrders(id) {
		try {
			this.setState({orderBookSell: [], orderBookBuy: []});
			let query_orderBook = await db.collection("Orderbook").doc(id).get();
			let buy_prices = query_orderBook.data().Buy.prices;
			let buy_amounts = query_orderBook.data().Buy.amounts;
			let sell_prices = query_orderBook.data().Sell.prices;
			let sell_amounts = query_orderBook.data().Sell.amounts;
			this.setState({
				orderBookSell: sell_prices.map((price, i) => ({tokenPrice: price, amount: parseInt(sell_amounts[i]), orderType: 'sell'})),
				orderBookBuy: buy_prices.map((price, i) => ({tokenPrice: price, amount: parseInt(buy_amounts[i]), orderType: 'buy'}))
			});
		} catch (error) {
			console.log(error);
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.timerStatus !== this.props.timerStatus) {
			this.setState({timerStatus: this.props.timerStatus});
		}
	}

	componentDidMount() {
		let id = this.props.id;
		if (id === null || id === undefined) {
			id = "ceriksen";
		}
		this.updateWindowDimensions(); window.addEventListener('resize', this.updateWindowDimensions);
		this.unsubscribe = db.collection('Orderbook').doc(id).onSnapshot((querySnapshot) => {
			console.log("Exchange componentDidMount querySnapshot ==== > : ");
			this.loadOpenOrders(id);
		});
		// this.loadFilledOrders(id);
		this.unsubscribe_FilledOrder = db.collection("FilledOrder").doc(id).collection("filledOrder")
			.orderBy("timestamp", "desc")
			.limit(100)
			.onSnapshot((querySnapshot) => {
				querySnapshot.docChanges().forEach((filledOrdersDoc) => {
					let filledOrder = filledOrdersDoc.doc.data();
					// this.setState({filledOrders: [...this.state.filledOrders, filledOrder]});
					if (this.state.filledOrders.length === 100) {
						this.setState({filledOrders: this.state.filledOrders.slice(0, -1)})
						this.setState({filledOrders: [filledOrder, ...this.state.filledOrders]});
					} else {
						this.setState({filledOrders: [...this.state.filledOrders, filledOrder]});
					}
				});
			});
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateWindowDimensions);
		if (this.unsubscribe !== null) {
			this.unsubscribe();
		}
		if (this.unsubscribe_FilledOrder !== null) {
			this.unsubscribe_FilledOrder();
		}
	}

	render() {
		return (
			<div className="container-fluid">
				{this.state.width > 768 ? <div className="row">
					<div className="col-md-3">
						<IPOCountdown id={this.props.id} address={this.props.address} />
					</div>
					<div className="col-md-6">
						{this.props.timerStatus === "count" ?
							<IPOTrade id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} />
							:
							this.props.timerStatus === "expired" ?
								<div className="card">
									<div className="card-body">
										<h3 className="card-title">
											Sale Has Finished
										</h3>
									</div>
								</div>
								:
								this.props.timerStatus === "soon" ?
									<div className="card">
										<div className="card-body">
											<h3 className="card-title">
												Starting Soon
											</h3>
										</div>
									</div>
									:
									null
						}
						<HistoryOrderIPO id={this.props.id} />
					</div>
					<div className="col-md-3">
						<OrderBook id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} isIPO={true} />
						<MarketHistory id={this.props.id} filledOrders={this.state.filledOrders} />
					</div>
				</div> :
					<div className="row">
						<div className="col-md-3">
							<IPOCountdown id={this.props.id} address={this.props.address} platform="mobile"/>
						</div>
						<div className="col-md-6">
							{this.props.timerStatus === "count" ?
								<IPOTrade id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} />
								:
								this.props.timerStatus === "expired" ?
									<div className="card">
										<div className="card-body">
											<h3 className="card-title">
												Sale Has Finished
											</h3>
										</div>
									</div>
									:
									this.props.timerStatus === "soon" ?
										<div className="card">
											<div className="card-body">
												<h3 className="card-title">
													Starting Soon
												</h3>
											</div>
										</div>
										:
										null
							}
							<HistoryOrderIPO id={this.props.id} platform="mobile"/>
						</div>
						<div className="col-md-3">
							<OrderBook id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} isIPO={true} />
							<MarketHistory id={this.props.id} filledOrders={this.state.filledOrders} />
						</div>
					</div>
				}
			</div>
		);
	}
}
function mapStateToProps(state) {
	const timerStatus = timerSelector(state);
	return {
		timerStatus: timerStatus,
	}
}

export default connect(mapStateToProps)(Ipo)
