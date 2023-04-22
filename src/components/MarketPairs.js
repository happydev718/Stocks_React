import React, {Component} from 'react'
// import "bootstrap/dist/css/bootstrap.min.css";
import {connect} from 'react-redux'
import axios from 'axios';
import {tokens} from "../config/ExchangeTokens";
// import Web3 from 'web3'
// import Exchanges from "../store/exchanges";
// import { isEmpty } from 'lodash';
import Spinner from './Spinner'
import {
	accountSelector
} from "../store/selectors";
// import {Tabs, Tab} from 'react-bootstrap';
import configURL from '../config/endpoints.json'
import configURL2 from '../config/player2id.json'
import configURL3 from '../config/fullnames.json'
import {db} from "./firebase/firebase";
import {ethPriceURL} from "./constants/routes";

const IMGURL = configURL.imgURL;
var player2id = configURL2.player2id;
var fullname = configURL3.fullname;

class MarketPairs extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tokenbal: [],
			token_percent: [],
			token_price: [],
			sell_price: [],
			buy_price: [],
			tokenName: [],
			loading: false,
			matchflag: [],
			filtername: "",
			emptyFlag: true,
			ethPriceData: 2000,
		}
		this.subscription = null;
		this.readAccountDappValue = this.readAccountDappValue.bind(this);
	}

	readAccountDappValue = async () => {
		let {loading, tokenbal, token_percent, token_price, sell_price, buy_price, matchflag, tokenName} = this.state;
		tokenbal = [];
		token_percent = [];
		token_price = [];
		sell_price = [];
		buy_price = [];
		matchflag = [];
		tokenName = [];
		let token_rows = [];
		const snapshot = await db.collection("tokens").get();
		snapshot.forEach(doc => {
			token_rows.push(doc.data());
		});
		for (let i = 0; i < tokens.length; i++) {
			for (let j = 0; j < token_rows.length; j++) {
				if (token_rows[j].name === tokens[i]) {
					tokenName.push(tokens[i]);
					token_price.push(token_rows[j].price);
					token_percent.push(token_rows[j].percent);
					sell_price.push(token_rows[j].sell);
					buy_price.push(token_rows[j].buy);
					tokenbal.push(token_rows[j].tokenbal);
				}
			}
			matchflag[i] = true;
		}
		loading = true;
		this.setState({loading, tokenName, tokenbal, token_percent, token_price, sell_price, buy_price, matchflag});
		let ethPriceData = await axios.get(ethPriceURL);
		if (ethPriceData.status === 200 && ethPriceData.data !== undefined) {
			this.setState({ethPriceData: parseFloat(ethPriceData.data.USD)});
		}
	}

	// openModal = () => {
	//     this.setState({ isOpen: true }, () => {
	//         this.readAccountDappValue();
	//     });
	// }
	// closeModal = () => this.setState({ isOpen: false });

	componentDidMount() {
		this.subscription = db.collection('stateRealtime').doc('changeState').onSnapshot(async (snap) => {
			await this.readAccountDappValue();
		});
	}

	componentWillUnmount() {
		if (this.subscription) {
			this.subscription();
		}
	}

	// async componentDidUpdate() {
	//     await this.readAccountDappValue();
	// }

	onChange(e) {
		this.setState({filtername: e.target.value})
		if (e.target.value === "") {
			this.setState({emptyFlag: true});
		} else {
			this.setState({emptyFlag: false});
		}

		var flags = [];
		for (let i = 0; i < tokens.length; i++) {
			if (fullname[tokens[i]].toLowerCase().includes(this.state.filtername.toLowerCase())) {
				flags[i] = true;
			}
			else {
				flags[i] = false;
			}
		}
		if (e.target.value === '') {
			for (let i = 0; i < tokens.length; i++) {
				flags[i] = true;
			}
		}
		this.setState({matchflag: flags});
	}

	render() {
		let {tokenName, tokenbal, token_percent, token_price, emptyFlag, matchflag} = this.state;
		return (
			<>
				{true ? <main className={`card card--overflow ${this.props.platform !== "mobile" ? "market-pairs" : "market-pairs-mobile"}`}>
					<div className="card-header">
						<h3 className="card-title mb-3">Players</h3>
						<div className="input-group">
							<span className="input-group-text" id="inputGroup-sizing-sm">
								<i className="icon ion-md-search input-fix-height"></i>
							</span>
							<input
								type="text"
								className="form-control"
								placeholder="Search Player"
								aria-describedby="inputGroup-sizing-sm"
								onChange={(e) => this.onChange(e)}
								value={this.filtername}
								required
							/>
						</div>
					</div>
					<div className="flex-grow-scroll">
						<div className="card-body card-body--table">
							<table className="table">
								<tbody>
									<tr>
										<th>Photo</th>
										<th>Name</th>
										<th>Price</th>
										<th>24 Hour</th>
									</tr>
									{
										tokenName.map((obj, key) => (
											matchflag[key] && tokenbal[key] ?
												<tr key={key} className="player-row">
													<td style={{width: '54px'}}><img className="player-row__photo" src={`${IMGURL + player2id[obj]}.png`} alt="" /></td>
													<td><a href={`/players/${obj}`} className="player-row__name">{fullname[obj]}</a></td>
													{token_price[key] ? <td>
														<p className="m-0 p-0">£{(parseFloat(token_price[key])).toFixed(2)}</p>
														<p className="m-0 p-0 fs-7">{(parseFloat(token_price[key]) * this.state.ethPriceData).toFixed(2)}ETH</p>
													</td> : <td className="d-block">
														<p className="m-0 p-0">£0.00</p>
														<p className="m-0 p-0 fs-7">0.00ETH</p>
													</td>}
													{token_percent[key] !== 0 && token_percent[key] ?
														(token_percent[key] >= 0 ?
															// Up
															<td>
																<snap className="arrow-up"></snap>
																<span className="text-success">
																	{(parseFloat(token_percent[key])).toFixed(0)}
																	%
																</span>
															</td>
															:
															// Down
															<td>
																<snap className="arrow-down"></snap>
																<span className="text-danger">
																	{(parseFloat(token_percent[key])).toFixed(0)}
																	%
																</span>
															</td>
														)
														: <td>
															<span className="text-success">0%</span>
														</td>
													}
												</tr> : <></>
										))}
								</tbody>
							</table>
						</div>
					</div>
				</main> :
					<table className="table">
						<Spinner type='table' />
					</table>
				}
			</>
		)

	}
}

function mapStateToProps(state) {
	return {
		account: accountSelector(state),
	}
}

export default connect(mapStateToProps)(MarketPairs)
