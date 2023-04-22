import React, {Component} from 'react';
// import "bootstrap/dist/css/bootstrap.min.css";
import {Row, Col, Button, OverlayTrigger, Tooltip} from "react-bootstrap";
import {connect} from 'react-redux'
import Swal from 'sweetalert2';
import {tokens} from "../config/ExchangeTokens.js";
import {db} from "./firebase/firebase";
import axios from 'axios';
import firebase from "firebase";
import {backUrl} from './constants/routes';
import {
	accountSelector,
} from "../store/selectors";

class PortfolioStats extends Component {
	constructor(props) {
		super(props);
		this.state = {
			tokenbal: [],
			exchangeses: [],
			token_price: [],
			tokenName: [],
			exchangeName: [],
			totalval: 0,
			reward: 0,
			ethprice: 0,
			isOpen: false
		}

		this.readAccountDappValue = this.readAccountDappValue.bind(this);
	}

	readAccountDappValue = async () => {

		let {tokenName, exchangeName, tokenbal, exchangeses, token_price, totalval, reward, ethprice} = this.state;
		tokenbal = [];
		exchangeses = [];
		token_price = [];
		tokenName = [];
		exchangeName = [];
		totalval = 0;
		reward = 0;
		ethprice = 0;
		let token_rows = [];
		const snapshot = await db.collection("tokens").get();
		snapshot.forEach(doc => {
			token_rows.push(doc.data());
		});
		for (var i = 0; i < tokens.length; i++) {
			for (let j = 0; j < token_rows.length; j++) {
				if (token_rows[j].name === tokens[i]) {
					tokenName.push(tokens[i]);
					tokenbal.push(token_rows[j].tokenbal);
					token_price.push(token_rows[j].price);
				}
			}
		}

		let query_token = await db.collection("users_tokenbal").doc(localStorage.getItem("account-info")).get();

		if (query_token.data() !== undefined && query_token.data() !== null && query_token.data() !== []) {
			let current_user = query_token.data();
			if (current_user.total_reward !== undefined && current_user.total_reward !== null) {
				reward = (parseFloat(current_user.total_reward));
			}
			for (let i = 0; i < tokenName.length; i++) {
				totalval = totalval + ((parseFloat(current_user[tokenName[i]]) * token_price[i]));
			}
		}
		let ethPrice = await axios.get(`https://data.stocksfc.com/EthPrice.json`);
		if (ethPrice.data) {
			ethprice = ethPrice.data.USD;
		}
		this.setState({tokenName, exchangeName, tokenbal, exchangeses, token_price, totalval, reward, ethprice});
	}

	openModal = () => {
		this.setState({isOpen: true}, () => {
			this.readAccountDappValue();
		});
	}
	closeModal = () => this.setState({isOpen: false});



	componentDidMount() {
		this.readAccountDappValue();
		firebase.auth().onAuthStateChanged(async (user) => {
			if (user) {
				const idToken = await user.getIdToken();
				console.log(idToken);
				var res = await axios.post(backUrl + "account/get_eth_balance", {}, {
					headers: {
						Authorization: 'Bearer ' + idToken
					}
				});

				if (res.data.status) {
					this.setState({balance: res.data.balance});
					console.log("User's Ethereum balance:", res.data.balance);
				}
			} else {
				console.log("User not logged in");
			}
		});
	}


	render() {
		let {totalval, reward, ethprice} = this.state;

		return (
			<Row>
				<Col md='4'>
					<div className="card">
						<div className="card-body p-0 py-5 body-height">
							<Row className="align-items-center m-0 d-flex">
								<Col md="6" sm="6" xs="5" className="" style={{paddingRight: 0}}>
									<p className="card-title text-muted portfolio-title">
										Portfolio Value{' '}
										<OverlayTrigger
											placement="bottom"
											overlay={
												<Tooltip>
													<p className='mb-0'>
														Portfolio value is the total value of all tokens held in your portfolio.
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
									</p>
								</Col>
								<Col md="6" sm="6" xs="7" className="" style={{textAlign : 'right'}}>
									<h4 className="mb-0 d-inline portfolio-title">
										£
										{totalval && !isNaN(totalval) ? (parseFloat(totalval)).toFixed(2) : "0.00"}
									</h4>
									{' '}
									<span className="text-muted portfolio-title1">
										({ethprice && !isNaN(ethprice) ? (parseFloat(ethprice) * parseFloat(totalval)).toFixed(2) : "0.00"} ETH)
									</span>
								</Col>
							</Row>
						</div>
					</div>
				</Col>

				<Col md='4'>
					<div className="card">
						<div className="card-body p-0 py-5 body-height">
							<Row className="align-items-center m-0 d-flex">
								<Col md="6" sm="7" xs="7" className="" style={{paddingRight : '0px !import'}}>
									<p className="card-title text-muted portfolio-title">
										Total Rewards Earned{' '}
										<OverlayTrigger
											placement="bottom"
											overlay={
												<Tooltip>
													<p className='mb-0'>
														The Total amount of rewards that you have earned on StocksFC.
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
									</p>
								</Col>
								<Col md="6" sm="5" xs="5" className="" style={{textAlign : 'right', paddingLeft:0}}>
									<h4 className="mb-0 d-inline portfolio-title">
										£{reward ? (reward.toFixed(2)).toString() : "0.00"}
									</h4>
									{' '}
									<span className="text-muted portfolio-title1">
										({ethprice && !isNaN(ethprice) ? (parseFloat(ethprice) * reward).toFixed(2) : "0.00"} ETH)
									</span>
								</Col>
							</Row>
						</div>
					</div>
				</Col>

				<Col md='4'>
					<div className="card">
						<div className="card-body p-0 py-5 body-height">
							<Row className="align-items-center m-0 d-flex">
								<Col lg="4" md="4" sm="4" xs="5">
									<p className="card-title portfolio-title text-muted">
										Cash Balance{' '}
										<OverlayTrigger
											placement="bottom"
											overlay={
												<Tooltip>
													<p className='mb-0'>
														Cash Balance is the total amount of cash that you have, this figure also includes buy orders that have not been filled on the transfer market.
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
									</p>
								</Col>
								<Col lg="4" md="8" sm="8" xs="7" className="mid-item" style={{textAlign : 'right'}}>
									<h4 className="mb-0 d-inline  portfolio-title">
										£{this.state.balance ? (parseFloat(this.state.balance)).toFixed(2) : "0.00"}
									</h4>
									{' '}
									<span className="text-muted  portfolio-title1">
										({  ethprice && !isNaN(ethprice) ? (parseFloat(ethprice) * parseFloat(this.state.balance)).toFixed(2) : "0.00" } ETH)
									</span>
								</Col>
								{/* <Col lg="0" md="5" sm="12" xs="12" className="p-0"></Col> */}
								<Col lg="4" md="6" sm="10" xs="12" className="m-auto fund-btn">
									<Button variant='outline-success' size='sm' href='#0' className='w-100 fundsBtn'>
										Add funds
									</Button>
								</Col>
							</Row>
						</div>
					</div>
				</Col>
			</Row>
		);
	}
}
function mapStateToProps(state) {
	return {
		account: accountSelector(state),
	}
}

export default connect(mapStateToProps)(PortfolioStats)
