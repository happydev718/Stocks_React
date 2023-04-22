import React, { Component } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
// import FlipMove from "react-flip-move";
import Spinner from './Spinner'
import configURL from "../config/endpoints.json";
import { db } from "./firebase/firebase";
const rankdataurl = configURL.inplay;

class InPlay extends Component {

	render() {
		var splitdata = this.props.data;
		return (
			<tr>
				<td>
					<div className="d-flex align-items-center">
						<img className="player-row__photo me-2" src={splitdata[0]} alt="" />
						<h5 className='mb-0'>{splitdata[2]}</h5>
					</div>
				</td>
				<td>{splitdata[3]}</td>
				<td>{(parseFloat(splitdata[4])).toFixed(2)}</td>
				<td>£{(parseFloat(splitdata[5])).toFixed(2)}</td>
				<td>£{(parseFloat(splitdata[6])).toFixed(2)}</td>
				<td>{splitdata[7]}</td>
				<td>
					<Button variant="success" size='sm' href={splitdata[8]}>Buy Now</Button>
				</td>
			</tr>
		);
	}
}

class InPlayList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			rankdata: null,
			isloading: false,
			rankingdate: "Fetching Data",
		};
	}

	async getPlayerData() {
		let rankdata;
		rankdata = await fetch(rankdataurl)
			.then((response) => response.text())
			.catch((error) => {
			});
		return rankdata;
	}

	async getRankingDate() {
		let query_rankingdate = await db.collection("rankingsdate").doc("teamoftheweek").get();
		if (query_rankingdate.data() !== undefined && query_rankingdate.data() !== null && query_rankingdate.data() !== []) {
			let rankingdate = query_rankingdate.data().date;
			this.setState({ rankingdate: rankingdate });
		}
	}

	async componentDidMount() {
		let rankdata = await this.getPlayerData();
		this.setState({
			rankdata: rankdata,
		});

		var intervalId = setInterval(async () => {
			this.setState({ isloading: true });
			let rankdata = await this.getPlayerData();
			const data = this.state.rankdata;
			if (rankdata !== data) {
				this.setState({
					rankdata: rankdata,
				});
			}
			this.setState({ isloading: false });
		}, 50000000);
		// store intervalId in the state so it can be accessed later:
		this.setState({ intervalId: intervalId });
		await this.getRankingDate()
	}

	componentWillUnmount() {
		clearInterval(this.state.intervalId);
	}

	render() {
		if (this.state.rankdata) {
			let playerdatalist = this.state.rankdata.split("\n");
			return (
				<div className="container-fluid">
					<div className="card card--overflow markets">
						<div className="card-header">
							<h3 className="card-title">
								Inplay Rewards
							</h3>
						</div>
						<div className="flex-grow-scroll updateScrollBar">
							<div className="card-body card-body--table">
								<div className="table-responsive">
									<table className="table">
										<thead>
											<tr>
												<th>Player</th>
												<th>Assists</th>
												<th>Key Passes</th>
												<th>Token Supply</th>
												<th>Payout</th>
												<th>Payout Per Share</th>
												<th>Buy Now</th>
											</tr>
										</thead>
										<tbody>
											{!this.state.isloading ? playerdatalist.map((obj, key) => {
												let splitdata = obj.split(" ");
												if (!splitdata[0]) return <></>;
												else
													return (
														<InPlay data={splitdata} />
													);
											}) : <Spinner type="table" />}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		} else {
			return <Spinner type="table" />;
		}
	}
}

function mapStateToProps(state) {
	return {};
}

export default connect(mapStateToProps)(InPlayList);
