import { connect } from 'react-redux'
import React, { Component } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
// import configURL from '../config/wallets.json'
import configFullName from '../config/fullnames.json'
import configURL2 from '../config/endpoints.json'
import configURL3 from '../config/player2id.json'
import { db } from './firebase/firebase';
import Swal from 'sweetalert2';
import axios from 'axios';

// const deadwallet = configURL.deadWallet;
const IMGURL = configURL2.imgURL;
// const DATAURL = configURL2.playerdataURL;
const player2id = configURL3.player2id;


class AboutPlayer extends Component {

	constructor(props) {
		super(props);
		this.state = {
			imgurl: "",
			fullname: "",
			token_name: "",
			tokenbal: 0,
			sell_price: 0,
			buy_price: 0,
			token_price: 0,
			totalPayout: 0,
			payoutpershare: 0,
			longposition: "",
			ethPriceData: 2000,
		}
		this.getFullData = this.getFullData.bind(this);
		this.subscription = null;
	}

	getFullData = () => {
		let { imgurl, fullname, tokenbal, token_price, totalPayout, payoutpershare, longposition } = this.state;
		let id = this.props.id;
		if (!id) {
			return;
		}
		imgurl = IMGURL + player2id[id] + '.png';
		fullname = configFullName.fullname[id];
		totalPayout = 0.00;
		payoutpershare = 0.00;
		longposition = "0.00";
		tokenbal = 0;
		token_price = 0;
		db.collection("tokens").where("name", "==", id).get()
			.then((query_token) => {
				if (query_token.docs.length > 0) {
					let token_data = query_token.docs[0].data();
					tokenbal = (parseFloat(token_data.tokenbal)).toFixed(2);
					token_price = (parseFloat(token_data.price)).toFixed(2);
					if (token_data.longposition !== undefined && token_data.longposition !== null) {
						longposition = token_data.longposition.toString();
					}
					if (token_data.totalPayout !== undefined && token_data.totalPayout !== null) {
						totalPayout = (parseFloat(token_data.totalPayout)).toFixed(2);
					}
					if (token_data.payoutpershare !== undefined && token_data.payoutpershare !== null) {
						payoutpershare = (parseFloat(token_data.payoutpershare)).toFixed(2);
					}
				}
				this.setState({ imgurl, fullname, tokenbal, token_price, payoutpershare, totalPayout, longposition });
			}).catch((err) => {
			})
	}

	async componentDidMount() {
		this.subscription = db.collection('stateRealtime').doc('changeState').onSnapshot((snap) => {
			this.getFullData();
		});

		let ethPriceData = await axios.get(`https://data.stocksfc.com/EthPrice.json`);
		if (ethPriceData.data) {
			this.setState({ ethPriceData: ethPriceData.data.USD });
		}
	}


	componentWillUnmount() {
		if (this.subscription) {
			this.subscription();
		}
	}

	render() {
		// let { fullname, imgurl, tokenbal, token_price, totalPayout, payoutpershare, longposition } = this.state;
		return (
			<Link to={"/playerstats/" + this.props.id} className="about-player card">
				<div className="card-header">
					<div className="d-flex align-items-center">
						<img className="about-player__photo" src={this.state.imgurl} alt='' />
						<div>
							<h3 className="card-title">{this.state.fullname}</h3>
							<div>
								<span className="text-muted">
									Position: {' '}
								</span>
								<h5 className="d-inline">
									{this.state.longposition}
								</h5>
							</div>
						</div>
					</div>
				</div>
				<div className="card-body">
					<div className="row g-0">
						<div className="col-6">
							{/* Info */}
							<div className="mb-4">
								<h6 className="text-muted mb-0">
									Token Price: {' '}
								</h6>
								<h4 className="d-inline-block me-1 mt-1">
									£{this.state.token_price}
								</h4>
								<h6 className="fs-7 text-muted d-inline">
									{(parseFloat(this.state.token_price) * (100 / parseFloat(this.state.ethPriceData))).toFixed(2)} ETH
								</h6>
							</div>
						</div>
						<div className="col-6">
							{/* Info */}
							<div>
								<h6 className="text-muted mb-0">
									Total Supply: {' '}
									<OverlayTrigger
										placement="bottom"
										overlay={
											<Tooltip id="tooltip-about-player">
												<ul className="list mb-0">
													<li>
														<h4 className="d-inline">
															Total Supply:
														</h4>
														<p className="d-inline text-muted">
															The total number of tokens currently in circulation on the platform for the player.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Token Price:
														</h4>
														<p className="d-inline text-muted">
															The current average price of the token.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Rewards Paid:
														</h4>
														<p className="d-inline text-muted">
															The total amount of rewards that have been paid out to holders of the player.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Rewards Paid Per Share:
														</h4>
														<p className="d-inline text-muted">
															The total earnings gained for holding one token.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Position:
														</h4>
														<p className="d-inline text-muted">
															The starting position of the player in the last game, a players position can change.
														</p>
													</li>
												</ul>
											</Tooltip>
										}
									>
										{({ ref, ...triggerHandler }) => (
											<div className="tooltip-trigger" ref={ref} {...triggerHandler}>
												<i className="fas fa-info-circle"></i>
											</div>
										)}
									</OverlayTrigger>
								</h6>
								<h4 className="d-inline-block me-1 mt-1">
									{this.state.tokenbal}
								</h4>
							</div>
						</div>
						<div className="col-6">
							{/* Info */}
							<div className="mb-4">
								<h6 className="text-muted mb-0">
									Rewards Paid: {' '}
								</h6>
								<h4 className="d-inline-block me-1 mt-1">
									£{this.state.totalPayout}
								</h4>
								<h6 className="fs-7 text-muted d-inline">
									{(parseFloat(this.state.totalPayout) * (100 / parseFloat(this.state.ethPriceData))).toFixed(2)} ETH
								</h6>
							</div>
						</div>
						<div className="col-6">
							{/* Info */}
							<div>
								<h6 className="text-muted mb-0">
									Rewards paid per share: {' '}
								</h6>
								<h4 className="d-inline-block me-1 mt-1">
									£{this.state.payoutpershare}
								</h4>
								<h6 className="fs-7 text-muted d-inline">
									{(parseFloat(this.state.payoutpershare) * parseFloat(this.state.ethPriceData)).toFixed(2)} ETH
								</h6>
							</div>
						</div>

					</div>
				</div>
			</Link>
		);
	}
}
function mapStateToProps(state) {
	return {
	}
}

export default connect(mapStateToProps)(AboutPlayer)
