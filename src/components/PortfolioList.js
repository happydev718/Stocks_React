import React, {Component} from 'react';
// import "bootstrap/dist/css/bootstrap.min.css";
import {Row, Col, OverlayTrigger, Tooltip, Image} from "react-bootstrap";
import {connect} from 'react-redux'
import axios from 'axios';
import {tokens} from "../config/ExchangeTokens.js";
import Spinner from './Spinner'
// import Swal from 'sweetalert2';
import {
	accountSelector,
} from "../store/selectors";
import {db} from "./firebase/firebase";

import configURL from '../config/endpoints.json'
import configURL2 from '../config/player2id.json'
import configURL3 from '../config/fullnames.json'
import {ethPriceURL} from "./constants/routes";

const IMGURL = configURL.imgURL;
var player2id = configURL2.player2id;
const fullname = configURL3.fullname;


class PortfolioList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			width: 0,
			height: 0,
			loading: false,
			isOpen: false,
			token_data: [],
			filtername: "",
			ethPriceData: 2000,
			width : window.innerWidth
		}
		this.readAccountDappValue = this.readAccountDappValue.bind(this);
		this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
		this.updateDimensions = this.updateDimensions.bind(this);
	}

	componentDidMount() {
		db.collection('stateRealtime').doc('changeTransaction').onSnapshot(async (snap) => {
			this.readAccountDappValue();
		});
		window.addEventListener("resize", this.updateDimensions);
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.updateDimensions);
	}

	updateDimensions() {
		this.setState({
			width: window.innerWidth
		});
	}

	updateWindowDimensions() {
		this.setState({width: window.innerWidth});
	}

	readAccountDappValue = async () => {
		let {loading, token_data} = this.state;
		token_data = [];
		let token_rows = [];
		let each_tokenbal = null;
		let tokenbal_data = await db.collection("users_tokenbal").doc(localStorage.getItem("account-info")).get();
		if (tokenbal_data.data() !== undefined && tokenbal_data.data() !== null && tokenbal_data.data() !== []) {
			each_tokenbal = tokenbal_data.data();
		}
		const snapshot = await db.collection("tokens").get();
		snapshot.forEach(doc => {
			token_rows.push(doc.data());
		});
		for (var i = 0; i < tokens.length; i++) {
			let tokenbal = 0;
			let each_reward = 0;
			let token_price = 0;
			let token_cost = 0;
			let tokenName = "";
			for (let j = 0; j < token_rows.length; j++) {
				if (token_rows[j].name === tokens[i]) {
					token_price = token_rows[j].price;
					tokenName = token_rows[j].name;
				}
			}
			try {
				if (each_tokenbal !== null && each_tokenbal !== undefined) {
					tokenbal = each_tokenbal[tokens[i]];
					let token_cost_price = each_tokenbal[tokens[i] + "_cost"];
					// causes wrong values with ipo tokens let token_cost_amount = each_tokenbal[tokens[i] + "_amount"];
					let token_cost_amount = each_tokenbal[tokens[i]];
					if (!isNaN(parseFloat(token_cost_price)) && token_cost_price !== undefined && !isNaN(parseFloat(token_cost_amount)) && token_cost_amount !== undefined) {
						token_cost = (parseFloat(token_cost_price * token_cost_amount));
					}
					if (each_tokenbal[tokens[i] + "_reward"] !== undefined && each_tokenbal[tokens[i] + "_reward"] !== null) {
						each_reward = (parseFloat(each_tokenbal[tokens[i] + "_reward"]));
					}
				}
			} catch (error) {
			}
			let token_totalVal = parseFloat(token_price * tokenbal);
			let token_profit = (token_totalVal) + each_reward - token_cost;
			token_data.push({showFlag: true, name: tokenName, tokenbal: tokenbal, price: token_price, cost: token_cost, token_reward: each_reward, totalVal: token_totalVal, profit: token_profit});
		}
		loading = true;
		this.setState({loading, token_data});
		let ethPriceData = await axios.get(ethPriceURL);
		if (ethPriceData.status === 200 && ethPriceData.data !== undefined) {
			this.setState({ethPriceData: parseFloat(ethPriceData.data.USD)});
		}
	};

	openModal = () => {
		this.setState({isOpen: true}, () => {
			this.readAccountDappValue();
		});
	}
	closeModal = () => this.setState({isOpen: false});

	onChange = (e) => {
		this.setState({filtername: e.target.value});
		let token_rows = this.state.token_data;
		if (e.target.value === '') {
			for (var i = 0; i < token_rows.length; i++) {
				token_rows[i].showFlag = true;
			}
		} else {
			for (let i = 0; i < token_rows.length; i++) {
				if (fullname[token_rows[i].name].toLowerCase().includes(this.state.filtername.toLowerCase())) {
					token_rows[i].showFlag = true;
				}
				else {
					token_rows[i].showFlag = false;
				}
			}
		}
		this.setState({token_data: token_rows});
	}

	sort_tokens(keyWord) {
		if (this.state.token_data.length > 1) {
			let token_rows = this.state.token_data;
			if (parseFloat(token_rows[0][`${keyWord}`]) >= parseFloat(token_rows[1][`${keyWord}`])) {
		
				token_rows.sort(function (x, y) {
					return parseFloat(x[`${keyWord}`]) - parseFloat(y[`${keyWord}`]);
				});
			} else {
				token_rows.sort(function (x, y) {
					return parseFloat(y[`${keyWord}`]) - parseFloat(x[`${keyWord}`]);
				});
			}
			this.setState({token_data: token_rows});
		}
	}

	render() {
		let {loading, token_data,width} = this.state;
		return (
			width > 870 ? 
			<div className="container-fluid">
				<div className="card card--overflow portfolio-players">
					<div className="card-header">
						<Row className='align-items-center'>
							<Col md className='search-title'>
								<h3 className="card-title">
									Portfolio <span>{' '}</span>
									<OverlayTrigger
										placement="bottom"
										overlay={
											<Tooltip id="tooltip-all-players">
												<ul className="list mb-0">
													<li>
														<h4 className="d-inline">
															Owned: {' '}
														</h4>
														<p className="d-inline text-muted">
															The number of tokens you hold in your portfolio.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Cost: {' '}
														</h4>
														<p className="d-inline text-muted">
															The total cost that you have paid for the tokens.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Rewards Earned: {' '}
														</h4>
														<p className="d-inline text-muted">
															The rewards you have earned while holding the tokens.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Current Price: {' '}
														</h4>
														<p className="d-inline text-muted">
															The current price for one token.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Total Value: {' '}
														</h4>
														<p className="d-inline text-muted">
															The total value of the tokens that you hold in your portfolio.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Profit: {' '}
														</h4>
														<p className="d-inline text-muted">
															The profit you have made on the tokens. (Total Value - Cost + Rewards earned)
														</p>
													</li>
												</ul>
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
							</Col>
							<Col md='4'>
								<div className="input-group">
									<span className="input-group-text">
										<i className="icon ion-md-search input-fix-height"></i>
									</span>
									<input
										type="text"
										className="form-control"
										placeholder="Search Player"
										onChange={(e) => this.onChange(e)}
										value={this.state.filtername}
										required
									/>
								</div>
							</Col>
						</Row>
					</div>
					<div className="flex-grow-scroll updateScrollBar">
						<div className="card-body card-body--table">
							<div className="table-responsive">
								<table className="table">
									{
										this.state.width > 870 ? <tbody>
											<tr>
												<th>Photo</th>
												<th>Player</th>
												<th>OWNED&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("tokenbal")}}></i></th>
												<th>cost&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("cost")}}></i></th>
												<th>REWARDS EARNED&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("token_reward")}}></i></th>
												<th>CURRRENT PRICE&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("price")}}></i></th>
												<th>TOTAL VALUE&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("totalVal")}}></i></th>
												<th>PROFIT&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("profit")}}></i></th>
											</tr>
											{
											token_data.map((obj, key) => (
												<>
													{
														obj.showFlag &&
														<tr key={key} className='player-row' data-href="exchange-light.html">
															<td>
																<Image className="table-player-photo p-0" src={`${IMGURL + player2id[obj.name]}.png`} alt="" style={{width: "40%"}}></Image>
															</td>
															<td><a className='player-row__name' href={`/players/${obj.name}`}>{fullname[obj.name]}</a></td>
															<td>
																<p><span>{((parseFloat(obj.tokenbal)).toFixed(2))}</span></p>
															</td>
															<td>
																<p className="fs-5 d-flex my-auto">
																	£{(parseFloat(obj.cost)).toFixed(2)} 
																</p>
																<p className="text-muted fs-7 my-auto" style={{marginLeft : '-6px'}}>
																	&nbsp;&nbsp;{(parseFloat(obj.cost) * this.state.ethPriceData).toFixed(2)}ETH
																</p>
															</td>
															<td>
																<p className="fs-5 my-auto">
																	£{(parseFloat(obj.token_reward)).toFixed(2)}
																</p> 
																<p className="text-muted fs-7 my-auto" style={{marginLeft : '-6px'}}>
																	&nbsp;&nbsp;{(parseFloat(obj.token_reward) * this.state.ethPriceData).toFixed(2)}ETH
																</p>
															</td>
															<td>
																{obj.price ? <><p className="fs-5 my-auto">£{(parseFloat(obj.price)).toFixed(2)}</p> <p className="text-muted fs-7 my-auto" style={{marginLeft : '-6px'}}>&nbsp;&nbsp;{(parseFloat(obj.price) * this.state.ethPriceData).toFixed(2)}ETH</p></> :<> <p className='import-mb-0'>
																	£0.00</p><p className="text-muted fs-7 my-auto" style={{marginLeft : '-6px'}}>&nbsp;&nbsp;0.00ETH</p>
																</>}
															</td>
															<td>
																{obj.totalVal ? <><p className="fs-5 my-auto">£{(parseFloat(obj.totalVal)).toFixed(2)}</p> <p className="text-muted fs-7 my-auto" style={{marginLeft : '-6px'}}>&nbsp;&nbsp;{(parseFloat(obj.totalVal) * this.state.ethPriceData).toFixed(2)}ETH</p></> : <><p className='import-mb-0'>
																	£0.00</p><p className="text-muted fs-7 my-auto" style={{marginLeft : '-6px'}}>&nbsp;&nbsp;0.00ETH</p>
																	</>
																}
															</td>
															<td>
																{obj.totalVal + obj.token_reward - obj.cost ? ((obj.totalVal + obj.token_reward - obj.cost) >= 0 ?
																	(<div className="fs-5 my-auto text-success">£{(parseFloat(obj.totalVal + obj.token_reward - obj.cost)).toFixed(2)} </div>) : // <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;{(parseFloat(obj.totalVal + obj.token_reward - obj.cost) * this.state.ethPriceData).toFixed(2)}ETH</span>
																	(<div className="fs-5 my-auto text-danger">£{(parseFloat(obj.totalVal + obj.token_reward - obj.cost)).toFixed(2)} </div>)) : (<div className="text-success">
																		£0.00
																		{/* <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;0.00ETH</span> */}
																	</div>)
																}
															</td>
														</tr>
													}
												</>
			
											))}
										</tbody> : <tbody>
											<tr>
												<th>Photo</th>
												<th>Player</th>
												<th>Owned&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("tokenbal")}}></i></th>
												<th>Cost&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("cost")}}></i></th>
												<th>Rewards Earned&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("token_reward")}}></i></th>
												<th>Current Price&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("price")}}></i></th>
												<th>Total Value&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("totalVal")}}></i></th>
												<th>Profit&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("profit")}}></i></th>
											</tr>
											{
												token_data.map((obj, key) => (<>
													{
														obj.showFlag && obj.tokenbal > 0 ?
															<tr className='player-row' data-href="exchange-light.html" key={key.toString() + "tr"}>
																<td><img className="table-player-photo" src={`${IMGURL + player2id[obj.name]}.png`} alt="" /></td>
																<td><a className='player-row__name' href={`/players/${obj.name}`}>{fullname[obj.name]}</a></td>
																<td>{((parseFloat(obj.tokenbal)).toFixed(2))}</td>
																<td>
																	<p className="m-0 p-0">£{(parseFloat(obj.cost)).toFixed(2)}</p>
																	<p className="m-0 p-0 fs-7">{(parseFloat(obj.cost) * this.state.ethPriceData).toFixed(2)}ETH</p>
																</td>
																<td>
																	<p className="m-0 p-0">£{(parseFloat(obj.token_reward)).toFixed(2)}</p>
																	<p className="m-0 p-0 fs-7">{(parseFloat(obj.token_reward) * this.state.ethPriceData).toFixed(2)}ETH</p>
																</td>
																{obj.price ? <td>
																	<p className="m-0 p-0">£{(parseFloat(obj.price)).toFixed(2)}</p>
																	<p className="m-0 p-0 fs-7">{(parseFloat(obj.price) * this.state.ethPriceData).toFixed(2)}ETH</p>
																</td> : <td>
																	<p className="m-0 p-0">£0.00</p>
																	<p className="m-0 p-0 fs-7">0.00ETH</p>
																</td>}
																{obj.totalVal ? <td>
																	<p className="m-0 p-0">£{(parseFloat(obj.totalVal)).toFixed(2)}</p>
																	<p className="m-0 p-0 fs-7">{(parseFloat(obj.totalVal) * this.state.ethPriceData).toFixed(2)}ETH</p>
																</td> : <td>
																	<p className="m-0 p-0">£0.00</p>
																	<p className="m-0 p-0 fs-7">0.00ETH</p>
																</td>}
																{obj.totalVal + obj.token_reward - obj.cost ? ((obj.totalVal + obj.token_reward - obj.cost) >= 0 ?
																	(<td className="text-success">£{(parseFloat(obj.totalVal + obj.token_reward - obj.cost)).toFixed(2)}</td>) :
																	(<td className="text-danger">£{(parseFloat(obj.totalVal + obj.token_reward - obj.cost)).toFixed(2)}</td>)
																) : (<td className="text-success">£0.00</td>)}
															</tr> : <></>
													}
												</>
												))
											}
										</tbody>
									}
									{!loading && <Spinner type='table' />}
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
			:
			<div className="container-fluid">
				<div className="card card--overflow portfolio-players">
					<div className="card-header">
						<Row className='align-items-center'>
							<Col md className='search-title'>
								<h3 className="card-title">
									Portfolio {' '}
									<OverlayTrigger
										placement="bottom"
										overlay={
											<Tooltip id="tooltip-all-players">
												<ul className="list mb-0">
													<li>
														<h4 className="d-inline">
															Owned: {' '}
														</h4>
														<p className="d-inline text-muted">
															The number of tokens you hold in your portfolio.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Cost: {' '}
														</h4>
														<p className="d-inline text-muted">
															The total cost that you have paid for the tokens.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Rewards Earned: {' '}
														</h4>
														<p className="d-inline text-muted">
															The rewards you have earned while holding the tokens.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Current Price: {' '}
														</h4>
														<p className="d-inline text-muted">
															The current price for one token.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Total Value: {' '}
														</h4>
														<p className="d-inline text-muted">
															The total value of the tokens that you hold in your portfolio.
														</p>
													</li>
													<li>
														<h4 className="d-inline">
															Profit: {' '}
														</h4>
														<p className="d-inline text-muted">
															The profit you have made on the tokens. (Total Value - Cost + Rewards earned)
														</p>
													</li>
												</ul>
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
							</Col>
							<Col md='4'>
								<div className="input-group">
									<span className="input-group-text">
										<i className="icon ion-md-search input-fix-height"></i>
									</span>
									<input
										type="text"
										className="form-control"
										placeholder="Search Player"
										onChange={(e) => this.onChange(e)}
										value={this.state.filtername}
										required
									/>
								</div>
							</Col>
						</Row>
					</div>
					<div className="flex-grow-scroll updateScrollBar">
						<div className="card-body card-body--table">
							<div className="table-responsive">
								<table className="table">
									{
										this.state.width <= 870 ? <tbody>
											
											{token_data.map((obj, key) => (
												<div key={key} className="pt-3">
													<Row className="m-0 d-flex p-2">
														<Row className="m-0 p-0 w-25">
															<Image className="table-player-photo p-0" src={`${IMGURL + player2id[obj.name]}.png`} alt=""></Image>
														</Row>
														<Row className="m-0 p-0 w-75">
															<a className='player-row__name' href={`/players/${obj.name}`}>{fullname[obj.name]}</a>
															<p>{"Owned:  "}<span>{((parseFloat(obj.tokenbal)).toFixed(2))}</span></p>
														</Row>
													</Row>
													<Row className="m-0 pt-2 pb-1" style={{paddingLeft: "0.5rem", paddingRight: "0.5rem"}}>
														<hr className="m-0 p-0" />
													</Row>
													<Row className="m-0 d-flex p-1">
														<Row className="m-0 p-0 w-50">
															<div className="text-muted fs-5 my-auto">{"Cost:"}</div>
															<div className="fs-5 d-flex my-auto">£{(parseFloat(obj.cost)).toFixed(2)} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;{(parseFloat(obj.cost) * this.state.ethPriceData).toFixed(2)}ETH</span></div>
														</Row>
														<Row className="fw-medium text-capitalize m-0 p-0 w-50">
															<div className="text-muted fs-5 my-auto">{"Rewards Earned:"}</div>
															<div className="fs-5 my-auto">£{(parseFloat(obj.token_reward)).toFixed(2)} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;{(parseFloat(obj.token_reward) * this.state.ethPriceData).toFixed(2)}ETH</span></div>
														</Row>
													</Row>
													<Row className="m-0 d-flex p-1">
														<Row className="m-0 p-0 w-50">
															<div className="text-muted fs-4 my-auto">{"Current Price:"}</div>
															{obj.price ? <div className="fs-5 my-auto">£{(parseFloat(obj.price)).toFixed(2)} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;{(parseFloat(obj.price) * this.state.ethPriceData).toFixed(2)}ETH</span></div> : <div>
																£0.00<span className="text-muted fs-7 my-auto">&nbsp;&nbsp;0.00ETH</span>
															</div>}
														</Row>
														<Row className="fw-medium text-capitalize m-0 p-0 w-50">
															<div className="text-muted fs-4 my-auto">{"Total Value:"}</div>
															{obj.totalVal ? <div className="fs-5 my-auto">£{(parseFloat(obj.totalVal)).toFixed(2)} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;{(parseFloat(obj.totalVal) * this.state.ethPriceData).toFixed(2)}ETH</span></div> : <div>
																£0.00<span className="text-muted fs-7 my-auto">&nbsp;&nbsp;0.00ETH</span>
															</div>
															}
														</Row>
													</Row>
													<Row className="m-0 d-flex p-1">
														<Row className="m-0 p-0 w-50">
															<div className="text-muted fs-4 my-auto">{"Profit:"}</div>
															{obj.totalVal + obj.token_reward - obj.cost ? ((obj.totalVal + obj.token_reward - obj.cost) >= 0 ?
																(<div className="fs-5 my-auto text-success">£{(parseFloat(obj.totalVal + obj.token_reward - obj.cost)).toFixed(2)} </div>) : // <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;{(parseFloat(obj.totalVal + obj.token_reward - obj.cost) * this.state.ethPriceData).toFixed(2)}ETH</span>
																(<div className="fs-5 my-auto text-danger">£{(parseFloat(obj.totalVal + obj.token_reward - obj.cost)).toFixed(2)} </div>)) : (<div className="text-success">
																	£0.00
																	{/* <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;0.00ETH</span> */}
																</div>)
															}
														</Row>
													</Row>
													<Row className="m-0 pt-2 pb-1">
														<hr className="m-0 p-0" />
													</Row>
												</div>
											))}
										</tbody> : <tbody>
											<tr>
												<th>Photo</th>
												<th>Player</th>
												<th>Owned&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("tokenbal")}}></i></th>
												<th>Cost&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("cost")}}></i></th>
												<th>Rewards Earned&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("token_reward")}}></i></th>
												<th>Current Price&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("price")}}></i></th>
												<th>Total Value&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("totalVal")}}></i></th>
												<th>Profit&nbsp;<i className="fa fa-sort" role='button' onClick={(e) => {this.sort_tokens("profit")}}></i></th>
											</tr>
											{
												token_data.map((obj, key) => (<>
													{
														obj.showFlag && obj.tokenbal > 0 ?
															<tr className='player-row' data-href="exchange-light.html" key={key.toString() + "tr"}>
																<td><img className="table-player-photo" src={`${IMGURL + player2id[obj.name]}.png`} alt="" /></td>
																<td><a className='player-row__name' href={`/players/${obj.name}`}>{fullname[obj.name]}</a></td>
																<td>{((parseFloat(obj.tokenbal)).toFixed(2))}</td>
																<td>
																	<p className="m-0 p-0">£{(parseFloat(obj.cost)).toFixed(2)}</p>
																	<p className="m-0 p-0 fs-7">{(parseFloat(obj.cost) * this.state.ethPriceData).toFixed(2)}ETH</p>
																</td>
																<td>
																	<p className="m-0 p-0">£{(parseFloat(obj.token_reward)).toFixed(2)}</p>
																	<p className="m-0 p-0 fs-7">{(parseFloat(obj.token_reward) * this.state.ethPriceData).toFixed(2)}ETH</p>
																</td>
																{obj.price ? <td>
																	<p className="m-0 p-0">£{(parseFloat(obj.price)).toFixed(2)}</p>
																	<p className="m-0 p-0 fs-7">{(parseFloat(obj.price) * this.state.ethPriceData).toFixed(2)}ETH</p>
																</td> : <td>
																	<p className="m-0 p-0">£0.00</p>
																	<p className="m-0 p-0 fs-7">0.00ETH</p>
																</td>}
																{obj.totalVal ? <td>
																	<p className="m-0 p-0">£{(parseFloat(obj.totalVal)).toFixed(2)}</p>
																	<p className="m-0 p-0 fs-7">{(parseFloat(obj.totalVal) * this.state.ethPriceData).toFixed(2)}ETH</p>
																</td> : <td>
																	<p className="m-0 p-0">£0.00</p>
																	<p className="m-0 p-0 fs-7">0.00ETH</p>
																</td>}
																{obj.totalVal + obj.token_reward - obj.cost ? ((obj.totalVal + obj.token_reward - obj.cost) >= 0 ?
																	(<td className="text-success">£{(parseFloat(obj.totalVal + obj.token_reward - obj.cost)).toFixed(2)}</td>) :
																	(<td className="text-danger">£{(parseFloat(obj.totalVal + obj.token_reward - obj.cost)).toFixed(2)}</td>)
																) : (<td className="text-success">£0.00</td>)}
															</tr> : <></>
													}
												</>
												))
											}
										</tbody>
									}
									{!loading && <Spinner type='table' />}
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		account: accountSelector(state),
		// etherBalance: etherBalanceSelector(state),
	}
}

export default connect(mapStateToProps)(PortfolioList)
