import React, {Component} from 'react';
import {Tabs, Tab, Nav} from 'react-bootstrap';
import {ThemeConsumer} from '../context/ThemeContext';
import {
	exchangeSelector,
	priceChartLoadedSelector,
	priceChartSelector,
} from '../store/selectors';
import {connect} from 'react-redux';
import {db} from "./firebase/firebase";
import configURL from '../config/endpoints.json'
import configURL3 from '../config/player2id.json'
import OrderBook from '../components/OrderBook';
import PriceChart from '../components/PriceChart';


// const IMGURL = configURL.imgURL;
const DATAURL = configURL.playerdataURL;
// const deadwallet = configURL2.deadWallet;
const player2id = configURL3.player2id;
// const player2season = configURL.season_state;


class ProfileSlider extends Component {
	constructor(props) {
		super(props);
		this.state = {
			width: 0,
			height: 0,
			season_state: null,
			filledOrders: [],
			orderBookSell: [],
			orderBookBuy: [],
		}
		this.getFullData = this.getFullData.bind(this);
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

	async getFullData() {
		let playerName = this.props.id, id, url, fulldata;
		id = player2id[playerName];
		url = DATAURL + id;
		await fetch(url, {
			method: 'GET',
			headers: {
				"Content-Type": "text/plain"
			}
		}).then(response => response.json())
			.then(data => {
				fulldata = data;
			}).catch(error => {
				this.setState({error: error});
			});
		return fulldata;
	}

	getseasondata(data, season_id) {
		for (let index = 0; index < data.length; index++) {
			const element = data[index];
			if (element.season_id === season_id) {
				return element;
			}
		}
		return null;
	}

	async componentDidMount() {
		this.updateWindowDimensions(); window.addEventListener('resize', this.updateWindowDimensions);
		this.unsubscribe = db.collection('Orderbook').doc(this.props.id).onSnapshot((querySnapshot) => {
			console.log("Exchange componentDidMount querySnapshot ==== > : ");
			this.loadOpenOrders(this.props.id);
		});
		let fulldata = await this.getFullData();
		if (fulldata) {
			let seasonlist = fulldata.stats.data;
			let current_season_id = fulldata.team.data.current_season_id;
			let seasondata = this.getseasondata(seasonlist, current_season_id)
			this.setState({
				season_state: JSON.stringify(seasondata)
			});
		}
		this.unsubscribe_FilledOrder = db.collection("FilledOrder").doc(this.props.id).collection("filledOrder")
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

	showSeasonData(data) {
		let jsondata = JSON.parse(data);

		return (
			<table className="table">
				<thead>
					<tr>
						<th>Option Name</th>
						<th>Season Status Data</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>minutes</td>
						<td>{jsondata.minutes}</td>
					</tr>
					<tr>
						<td>appearences</td>
						<td>{jsondata.appearences}</td>
					</tr>
					<tr>
						<td>substitute_in</td>
						<td>{jsondata.substitute_in}</td>
					</tr>
					<tr>
						<td>substitute_out</td>
						<td>{jsondata.substitute_out}</td>
					</tr>
					<tr>
						<td>goals</td>
						<td>{jsondata.goals}</td>
					</tr>
					<tr>
						<td>owngoals</td>
						<td>{jsondata.owngoals}</td>
					</tr>
					<tr>
						<td>assists</td>
						<td>{jsondata.assists}</td>
					</tr>
					<tr>
						<td>saves</td>
						<td>{jsondata.saves}</td>
					</tr>
					<tr>
						<td>inside_box_saves</td>
						<td>{jsondata.inside_box_saves}</td>
					</tr>
					<tr>
						<td>dispossesed</td>
						<td>{jsondata.dispossesed}</td>
					</tr>
					<tr>
						<td>interceptions</td>
						<td>{jsondata.interceptions}</td>
					</tr>
					<tr>
						<td>yellowcards</td>
						<td>{jsondata.yellowcards}</td>
					</tr>
					<tr>
						<td>yellowred</td>
						<td>{jsondata.yellowred}</td>
					</tr>
					<tr>
						<td>redcards</td>
						<td>{jsondata.redcards}</td>
					</tr>
					<tr>
						<td>tackles</td>
						<td>{jsondata.tackles}</td>
					</tr>
					<tr>
						<td>blocks</td>
						<td>{jsondata.blocks}</td>
					</tr>
					<tr>
						<td>hit_post</td>
						<td>{jsondata.hit_post}</td>
					</tr>
					<tr>
						<td>cleansheets</td>
						<td>{jsondata.cleansheets}</td>
					</tr>
					<tr>
						<td>fouls.committed</td>
						<td>{jsondata.fouls.committed}</td>
					</tr>
					<tr>
						<td>fouls.drawn</td>
						<td>{jsondata.fouls.drawn}</td>
					</tr>
					<tr>
						<td>crosses.total</td>
						<td>{jsondata.crosses.total}</td>
					</tr>
					<tr>
						<td>crosses.accurate</td>
						<td>{jsondata.crosses.accurate}</td>
					</tr>
					<tr>
						<td>dribbles.attempts</td>
						<td>{jsondata.dribbles.attempts}</td>
					</tr>
					<tr>
						<td>dribbles.success</td>
						<td>{jsondata.dribbles.success}</td>
					</tr>
					<tr>
						<td>dribbles.dribbled_past</td>
						<td>{jsondata.dribbles.dribbled_past}</td>
					</tr>
					<tr>
						<td>shots.shots_total</td>
						<td>{jsondata.shots.shots_total}</td>
					</tr>
					<tr>
						<td>shots.shots_total</td>
						<td>{jsondata.shots.shots_total}</td>
					</tr>
					<tr>
						<td>duels.total</td>
						<td>{jsondata.duels.total}</td>
					</tr>
					<tr>
						<td>duels.won</td>
						<td>{jsondata.duels.won}</td>
					</tr>
					<tr>
						<td>passes.total</td>
						<td>{jsondata.passes.total}</td>
					</tr>
					<tr>
						<td>passes.accuracy</td>
						<td>{jsondata.passes.accuracy}</td>
					</tr>
					<tr>
						<td>passes.key_passes</td>
						<td>{jsondata.passes.key_passes}</td>
					</tr>
					<tr>
						<td>penalties.won</td>
						<td>{jsondata.penalties.won}</td>
					</tr>
					<tr>
						<td>penalties.scores</td>
						<td>{jsondata.penalties.scores}</td>
					</tr>
					<tr>
						<td>penalties.missed</td>
						<td>{jsondata.penalties.missed}</td>
					</tr>
					<tr>
						<td>penalties.committed</td>
						<td>{jsondata.penalties.committed}</td>
					</tr>
					<tr>
						<td>penalties.saves</td>
						<td>{jsondata.penalties.saves}</td>
					</tr>
				</tbody>
			</table>
		);

	}

	render() {
		return (
			<div className="card card--overflow player-stats">
				<Tab.Container defaultActiveKey="chart">
					<div className="card-header">
						<Nav variant="tabs">
							<Nav.Item>
								<Nav.Link eventKey="chart">Chart</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="stats">Stats</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="depth">Market Depth</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="rewards">Rewards</Nav.Link>
							</Nav.Item>
						</Nav>
					</div>
					<div className="flex-grow-scroll">
						<div className="card-body">
							<Tab.Content>
								<Tab.Pane eventKey="chart">
									<ThemeConsumer>
										{({data}) => {
											return data.theme === 'light' ? (
												<PriceChart theme={data.theme} filledOrders={this.state.filledOrders} />
											) : (
												<PriceChart theme={data.theme} filledOrders={this.state.filledOrders} />
											);
										}}
									</ThemeConsumer>
								</Tab.Pane>
								<Tab.Pane eventKey="stats">
									<ul className="d-flex justify-content-between market-order-item">
										{this.state.season_state ?
											this.showSeasonData(this.state.season_state) : "No Season Data"
										}
									</ul>
								</Tab.Pane>
								<Tab.Pane eventKey="depth">
									<OrderBook id={this.props.id} orderBookSell={this.state.orderBookSell} orderBookBuy={this.state.orderBookBuy} isIPO={false} />
								</Tab.Pane>
								<Tab.Pane eventKey="rewards">
									<h5>Rewards</h5>
								</Tab.Pane>
							</Tab.Content>
						</div>
					</div>
				</Tab.Container>
			</div>
		);
	}
}


function mapStateToProps(state) {
	return {
		priceChartLoaded: priceChartLoadedSelector(state),
		priceChart: priceChartSelector(state),
		exchange: exchangeSelector(state),
		// contractsLoaded: contractsLoadedSelector(state),
	}
}

export default connect(mapStateToProps)(ProfileSlider)
