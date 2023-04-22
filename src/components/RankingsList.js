import React, { Component } from "react";
import { Container, Tab, Nav, Row, Col, Button, Image } from "react-bootstrap";
import { connect } from "react-redux";
// import FlipMove from "react-flip-move";
// import { Flipper, Flipped } from "react-flip-toolkit";
import Swal from 'sweetalert2';
import Spinner from './Spinner'
import { db } from "./firebase/firebase";
import configURL from "../config/endpoints.json";

const rankdataurl = configURL.ratingURL;

class PlayerData extends Component {
	constructor(props) {
		super(props);
		this.showDlg = this.showDlg.bind(this);
	}

	showDlg() {
		var splitdata = this.props.data;
		Swal.fire({
			// className: "",
			position: "top-right",
			title: "Full Score",
			showCloseButton: true,
			html: `<div class="row d-flex m-0 mb-4"><img class="w-25 rounded p-0" src="${splitdata[0]}" alt=""><div class="w-75 my-auto"><p class="mb-1">${splitdata[2]}</p><p class="mb-1">Score : ${splitdata[29]}</p></div></div>
				<div class="swal-ranking-fullScore">
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Position: </p><p class="w-50 mb-0 p-0">GameID: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[3]}</p><p class="w-50 mb-0 p-0">${splitdata[4]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Goals: </p><p class="w-50 mb-0 p-0">Assists: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[5]}</p><p class="w-50 mb-0 p-0">${splitdata[6]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Shots: </p><p class="w-50 mb-0 p-0">Shots On Target: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[8]}</p><p class="w-50 mb-0 p-0">${splitdata[9]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Key Passes: </p><p class="w-50 mb-0 p-0">Interceptions: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[10]}</p><p class="w-50 mb-0 p-0">${splitdata[11]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Hit Woodwork: </p><p class="w-50 mb-0 p-0">Pen Won: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[12]}</p><p class="w-50 mb-0 p-0">${splitdata[13]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Tackles: </p><p class="w-50 mb-0 p-0">Blocks: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[14]}</p><p class="w-50 mb-0 p-0">${splitdata[15]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Successful Dribble: </p><p class="w-50 mb-0 p-0">Saves: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[16]}</p><p class="w-50 mb-0 p-0">${splitdata[17]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Pen Saved: </p><p class="w-50 mb-0 p-0">Conceded: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[18]}</p><p class="w-50 mb-0 p-0">${splitdata[19]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Owngoals: </p><p class="w-50 mb-0 p-0">Yellow Cards: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[20]}</p><p class="w-50 mb-0 p-0">${splitdata[21]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Red Cards: </p><p class="w-50 mb-0 p-0">Yellow + Red Card: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[22]}</p><p class="w-50 mb-0 p-0">${splitdata[23]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Pen Missed: </p><p class="w-50 mb-0 p-0">Pen Committed: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[24]}</p><p class="w-50 mb-0 p-0">${splitdata[25]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Pen Missed: </p><p class="w-50 mb-0 p-0">Pen Committed: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[24]}</p><p class="w-50 mb-0 p-0">${splitdata[25]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Dispossesed: </p><p class="w-50 mb-0 p-0">Clean Sheet: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[26]}</p><p class="w-50 mb-0 p-0">${splitdata[27]}</p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">Winning Team: </p><p class="w-50 mb-0 p-0">Shots On Target: </p></div>
					<div class="row d-flex m-0 mb-2"><p class="w-50 mb-0 p-0">${splitdata[28]}</p><p class="w-50 mb-0 p-0">${splitdata[29]}</p></div>
				</div>
			`
		});
	}
	// status = (type) => {
	// 	if (type) {
	// 		if (type === 'L') {
	// 			return (<img className="live" src="/img/live.gif" alt="" />)
	// 		} else if (type === 'C') {
	// 			return (<img className="live" src="/img/play.png" alt="" />)
	// 		} else {
	// 			return (
	// 				<>
	// 					<img className="live" src="/img/live.png" alt="StocksFC Live" />
	// 					<img className="play" src="/img/play.png" alt="StocksFC Live" />
	// 				</>
	// 			)
	// 		}
	// 	}
	// }

	render() {
		var splitdata = this.props.data;
		console.log("RankingList = : ", this.props.platform);
		if (this.props.platform === "mobile") {
			return (
				<Row className="m-0 d-flex p-2 pt-4 pb-1">
					<Row className="m-0 p-0 w-25 card-player-image">
						<Image className="table-player-photo p-0" src={splitdata[0]} alt=""></Image>
					</Row>
					<Row className="m-0 p-0 w-75">
						<div className="fs-4 my-auto d-flex" style={{ alignItems: 'end' }}>
							{splitdata[2]}
							<span style={{ background: "#3DBA4F", width: 5, marginBottom: '.5rem', height: 5, display: 'flex', marginLeft: 10, borderRadius: '50%' }}></span>
							<span style={{ fontSize: '.9rem', marginLeft: 5, color: '#858789' }}>Live</span>
						</div>
						<div className="text-muted fs-5 my-auto">
							{"Score: "}
							<span className="text-muted fs-7 my-auto">{splitdata[7]}</span></div>
					</Row>
					<Row className="m-0 pt-3 p-0">
						<Button variant="info" onClick={this.showDlg}>Full Score</Button>
					</Row>
					<hr className="m-0 p-0 mt-4" />
				</Row>
			)
		} else {
			return (
				<tr>
					<td>
						<img className="table-player-photo" src={splitdata[0]} alt="" />
					</td>
					<td>
						<h5 className="mb-0">
							{splitdata[2]}
						</h5>
						{/* {this.status(splitdata[30])} */}
					</td>
					<td>{splitdata[3]}</td>
					<td>{splitdata[4]}</td>
					<td>{splitdata[5]}</td>
					<td>{splitdata[7]}</td>
					<td>
						<Button
							variant='info'
							onClick={this.showDlg}
						>
							Full Score
						</Button>
					</td>
				</tr>
			);
		}
	}
}

class RankingsList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			width: 0,
			height: 0,
			rankdata: null,
			isloading: false,
			rankingdate: "22/11/2021",
		};
		this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
	}

	updateWindowDimensions() {
		this.setState({ width: window.innerWidth, height: window.innerHeight });
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
		let query_rankingdate = await db.collection("rankingsdate").doc("rankings").get();
		if (query_rankingdate.data() !== undefined && query_rankingdate.data() !== null && query_rankingdate.data() !== []) {
			let rankingdate = query_rankingdate.data().date;
			this.setState({ rankingdate: rankingdate });
		}
	}

	async componentDidMount() {
		this.updateWindowDimensions(); window.addEventListener('resize', this.updateWindowDimensions);
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
		}, 60000);
		// store intervalId in the state so it can be accessed later:
		this.setState({ intervalId: intervalId });
		await this.getRankingDate()
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateWindowDimensions);
		clearInterval(this.state.intervalId);
	}

	render() {
		console.log("RankingList = : ", this.state.width);
		if (this.state.rankdata) {
			let playerdatalist = this.state.rankdata.split("\n");
			return (
				<Container fluid>
					<div className="card card--overflow live-rankings">
						<Tab.Container id="rankings" defaultActiveKey="players">
							<div className="card-header">
								<Row className='align-items-center'>
									<Col md>
										<Nav variant="tabs">
											<Nav.Item>
												<Nav.Link eventKey="players">Players</Nav.Link>
											</Nav.Item>
											<Nav.Item>
												<Nav.Link eventKey="scoring-matrix">Scoring Matrix</Nav.Link>
											</Nav.Item>
										</Nav>
									</Col>
									<Col md='auto'>
										<h5 className="mb-0">
											Scores Refreshed On {this.state.rankingdate}
										</h5>
									</Col>
								</Row>
							</div>

							<Tab.Content className="flex-grow-scroll updateScrollBar">
								<Tab.Pane eventKey="players">
									<div className="card-body card-body--table">
										<div className="table-responsive">
											<table className="table fw-medium">
												<tbody>
													{
														this.state.width > 768 && <tr>
															<th>Photo</th>
															<th>Player</th>
															<th>Position</th>
															<th>Game ID</th>
															<th>Goals</th>
															<th>Score</th>
															<th>View All</th>
														</tr>
													}
													{!this.state.isloading ? playerdatalist.map((obj, key) => {
														let splitdata = obj.split(" ");
														if (!splitdata[0]) return <></>;
														else
															return (
																<PlayerData data={splitdata} platform={this.state.width > 768 ? "desktop" : "mobile"} />
															);
													}) : <Spinner type="table" />}
												</tbody>
											</table>
										</div>
									</div>
								</Tab.Pane>

								<Tab.Pane eventKey="scoring-matrix">
									<div className="card-body">
										<Row className='justify-content-between'>
											<Col md={6} lg={5}>
												<ul className='list-circle fw-medium fs-4'>
													<li>
														<div className="d-flex justify-content-between">
															Shot
															<span className="text-success">1 Point</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Shot On Target
															<span className="text-success">4 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Goal
															<span className="text-success">20 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Assist
															<span className="text-success">12 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Key Pass
															<span className="text-success">5 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Interception
															<span className="text-success">2 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Hit Woodwork
															<span className="text-success">4 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Pen Won
															<span className="text-success">10 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Tackle
															<span className="text-success">3 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Block
															<span className="text-success">2 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Successful Dribble
															<span className="text-success">3 Points</span>
														</div>
													</li>
												</ul>
											</Col>
											<Col md={6} lg={5}>
												<ul className='list-circle fw-medium fs-4'>
													<li>
														<div className="d-flex justify-content-between">
															Pen Saved
															<span className="text-success">20 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Goal Conceded
															<span className="text-danger">-4 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Own Goals
															<span className="text-danger">-20 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Yellow Card
															<span className="text-danger">-4 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Red Cards
															<span className="text-danger">-20 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Pen Missed
															<span className="text-danger">-7 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Penalty Conceded
															<span className="text-danger">-10 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Dispossesed
															<span className="text-danger">-1 Point</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															Winning Team
															<span className="text-success">20 Points</span>
														</div>
													</li>
													<li>
														<div className="d-flex justify-content-between">
															CleanSheet
															<span className="text-success">20 Points</span>
														</div>
													</li>
												</ul>
											</Col>
										</Row>
									</div>
								</Tab.Pane>
							</Tab.Content>
						</Tab.Container>
					</div>
				</Container>
			);
		} else {
			// TODO: Change to Loader
			return <h5>Loading...</h5>;
		}
	}
}

function mapStateToProps(state) {
	return {};
}

export default connect(mapStateToProps)(RankingsList);
