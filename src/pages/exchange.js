import React, {Component} from 'react';
import HistoryOrder from '../components/HistoryOrder';
import MarketHistory from '../components/MarketHistory';
import AboutPlayer from '../components/AboutPlayer';
import MarketPairs from '../components/MarketPairs';
import MarketTrade from '../components/MarketTrade';
import OrderBook from '../components/OrderBook';
// import TradingChart from '../components/TradingChart';
// import TradingChartDark from '../components/TradingChartDark';
import PriceChart from '../components/PriceChart';
import {ThemeConsumer} from '../context/ThemeContext';
import {db} from "../components/firebase/firebase";
import {
	accountSelector,
} from '../store/selectors';
import {connect} from 'react-redux';

//for screen width and height
// import { useState, useEffect } from 'react';
class exchange extends Component {
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
			<div className="container-fluid px-1">
				{this.state.width > 768 ? (
					<div className="row sm-gutters">
						<div className="col-sm-12 col-md-3">
							<MarketPairs id={this.props.id} />
						</div>
						<div className="col-sm-12 col-md-6">
							<ThemeConsumer>
								{({data}) => {
									return data.theme === 'light' ? (
										<PriceChart theme={data.theme} filledOrders={this.state.filledOrders} />
									) : (
										<PriceChart theme={data.theme} filledOrders={this.state.filledOrders} />
									);
								}}
							</ThemeConsumer>
							<MarketTrade id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} />
							<HistoryOrder id={this.props.id} />
							{/* { this.props.update_flag ? (<HistoryOrder id={this.props.id} />) : (<></>)} */}
						</div>
						<div className="col-md-3">
							<AboutPlayer id={this.props.id} />
							<OrderBook id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} isIPO={false} />
							<MarketHistory id={this.props.id} filledOrders={this.state.filledOrders} />
						</div>
					</div>
				) : (
					<div className="row sm-gutters">
						<div className="col-sm-12 col-md-3">
							<AboutPlayer id={this.props.id} />
							<MarketPairs id={this.props.id} platform="mobile" />
						</div>
						<div className="col-sm-12 col-md-6">
							<ThemeConsumer>
								{({data}) => {
									return data.theme === 'light' ? (
										<PriceChart theme={data.theme} filledOrders={this.state.filledOrders} />
									) : (
										<PriceChart theme={data.theme} filledOrders={this.state.filledOrders} />
									);
								}}
							</ThemeConsumer>
							<MarketTrade id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} />
							{/* {this.props.update_flag ? <HistoryOrder id={this.props.id} /> : <></>} */}
						</div>
						<div className="col-md-3">
							<OrderBook id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} isIPO={false} />
							<HistoryOrder id={this.props.id} platform="mobile"/>
							<MarketHistory id={this.props.id} filledOrders={this.state.filledOrders} />
						</div>
					</div>
				)}
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		account: accountSelector(state),
	};
}
export default connect(mapStateToProps)(exchange)
