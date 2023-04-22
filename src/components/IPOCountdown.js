import React, {Component} from 'react';
import {setTimerStatus} from '../store/actions';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from "react-redux";
import configURL from '../config/countdown.json'
import configURL2 from '../config/endpoints.json'
import configURL3 from '../config/player2id.json'
import {db} from "./firebase/firebase";
import {accountSelector} from '../store/selectors';
import axios from 'axios';
import moment from 'moment';

const countdownSetting = configURL.countdown;
const IMGURL = configURL2.imgURL;
const DATAURL = configURL2.playerdataURL;
const player2id = configURL3.player2id;

class IPOCountdown extends Component {

	state = {
		remaining: {
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
		},
		tokenbal: 0,
		isExpired: false,
		isSoon: true,
		Date_start: new Date(),
		imgurl: null,
		fullname: null,
		position: null,
		token_ipo_price: 0,
		ethPriceData: "",
	};
	// used to set and clear interval
	timer;
	// used to calculate the distance between "current date and time" and the "target date and time"
	distance;

	constructor(props) {
		super(props);
		this.readAccountDappValue = this.readAccountDappValue.bind(this);
	}

	readAccountDappValue = async (id) => {
		let {tokenbal, token_ipo_price} = this.state;
		let token_query = await db.collection("tokens").where("name", "==", id).get();
		if (token_query.docs.length > 0) {
			let current_token = token_query.docs[0].data();
			if (current_token.soldbal !== undefined && current_token.soldbal !== null) {
				tokenbal = (parseFloat(current_token.soldbal)).toFixed(2);
			}
			if (current_token.IPO_price !== undefined && current_token.IPO_price !== null) {
				token_ipo_price = (parseFloat(current_token.IPO_price)).toFixed(2);
			}
		}
		this.setState({tokenbal, token_ipo_price});
	}

	async componentDidMount() {
		if (this.props.id) {
			this.readAccountDappValue(this.props.id);
		}
		this.setDate(this.props.dispatch);
		this.counter(this.props.dispatch);
		let fulldata = await this.getFullData();
		this.setState({imgurl: this.getImgUrl()});
		if (fulldata) {
			this.setState({
				fullname: fulldata.fullname,
				position: fulldata.position.data.name
			})
		}

		let ethPriceData = await axios.get(`https://data.stocksfc.com/EthPrice.json`);
		if (ethPriceData.data) {
			this.setState({ethPriceData: ethPriceData.data.USD});
		}
	}

	setDate = async (dispatch) => {
		var member = this.props.id;
		var configInfo = countdownSetting[member];
		var startdate = configInfo["startdate"];
		var enddate = configInfo["enddate"];
		var timeInfo_start = startdate.split(',');
		var timeInfo_end = enddate.split(',');
		var now = new Date(), countDownDate_start, countDownDate_end;
		countDownDate_end = new Date(timeInfo_end[0], timeInfo_end[1] - 1, timeInfo_end[2], timeInfo_end[3], timeInfo_end[4]);
		countDownDate_start = new Date(timeInfo_start[0], timeInfo_start[1] - 1, timeInfo_start[2], timeInfo_start[3], timeInfo_start[4]);
		this.setState({Date_start: countDownDate_start});
		// Find the distance between now and the count down date
		var canstart = countDownDate_start.getTime() - now.getTime();
		this.distance = countDownDate_end.getTime() - now.getTime();
		console.log("tokenbal", this.state.tokenbal)
		if (canstart > 0) {
			clearInterval(this.timer);
			this.setState({isSoon: true});
			await dispatch(setTimerStatus("soon"));
			this.timer = setInterval(() => {
				this.setDate(dispatch);
				if (this.props.account) {
					this.readAccountDappValue(this.props.id);
				}
			}, 3000);
		} else {
			this.setState({isSoon: false});
			// target date and time is less than current date and time
			if (this.distance < 0) {
				clearInterval(this.timer);
				this.setState({isExpired: true});
				await dispatch(setTimerStatus("expired"));
			} else {
				this.setState({
					remaining: {
						days: Math.floor(this.distance / (1000 * 60 * 60 * 24)),
						hours: Math.floor(
							(this.distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
						),
						minutes: Math.floor((this.distance % (1000 * 60 * 60)) / (1000 * 60)),
						seconds: Math.floor((this.distance % (1000 * 60)) / 1000)
					},
					isExpired: false
				});
				await dispatch(setTimerStatus("count"));
			}
		}
	}

	counter(dispatch) {
		this.timer = setInterval(() => {
			this.setDate(dispatch);
			if (this.props.account) {
				this.readAccountDappValue(this.props.id);
			}
		}, 3000);
	}

	getImgUrl() {
		let playerName = this.props.id, id;
		id = player2id[playerName];
		return IMGURL + id + '.png';
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

	render() {
		const {remaining, isExpired, isSoon, Date_start} = this.state;
		return (
			<div className={`card ${this.props.platform !== "mobile" && "market-news"}`}>
				<div className="card-header">
					<h3 className="card-title mb-4">
						IPO Info  {' '}
						<OverlayTrigger
							placement="right"
							overlay={
								<Tooltip id="tooltip-about-player">
									<p>
										An IPO (Initial Player Offering) is the first chance you have to purchase a player on the platform. 100,000 tokens are minted and sold via the IPO page for each player.
									</p>
									<p className='mb-0'>
										When the IPO ends all unsold tokens will be destroyed and the only way to acquire tokens is to purchase them from another user on the transfer market.
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

					<div className="d-flex align-items-center">
						<img className="about-player__photo" src={this.state.imgurl} alt='' />
						<div>
							<h3 className="card-title">{this.state.fullname}</h3>
							<div>
								<span className="text-muted">
									Position: {' '}
								</span>
								<h5 className="d-inline">
									{this.state.position}
								</h5>
							</div>
						</div>
					</div>
				</div>
				<div className="card-body">
					{
						isSoon ?
							<p>
								<span className="text-muted">
									Start Date: {' '}
								</span>
								<span className="fs-4 fw-medium">
									{/* {Date_start.toString()} */}
									{moment.unix((Math.floor(Date_start / 1000))).format('DD/MM h:mm A')}
								</span>
							</p>
							:
							""
					}

					{
						(isSoon ? <p className=""></p> :
							(!isExpired) ? (
								<p>
									<span className="text-muted">
										Sale Ends in: {' '}
									</span>
									<span className="fs-4 fw-medium">
										{(remaining.days * 24 + remaining.hours) + 'h ' + remaining.minutes + 'm ' + remaining.seconds + 's '}
									</span>
								</p>
							) : (
								<p>IPO Closed</p>
							)
						)
					}
					<p className="fw-medium">
						{((parseFloat(this.state.tokenbal)).toFixed(0))}/100000 Sold
					</p>
				</div>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		account: accountSelector(state),
	};
}

export default connect(mapStateToProps)(IPOCountdown);
