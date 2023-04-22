import React, {useEffect, useState} from "react";
import {auth_profile} from "../components/firebase/firebase";
import {Row} from 'react-bootstrap';
import {doGetAnUser} from "../components/firebase/auth";
import {useHistory} from "react-router-dom";
import Spinner from "../components/Spinner";
import {db} from "../components/firebase/firebase";
import {ethPriceURL} from "../components/constants/routes";
import moment from "moment";
import axios from 'axios';

export default function Myrewards() {

	const [transactionData1, setTransactionData1] = useState([]);
	const [loading, setLoading] = useState(true);
	const [transactionData, setTransactionData] = useState([]);
	const history = useHistory();
	const currentUser = auth_profile.currentUser;

	const [width, setWidth] = useState(window.innerWidth);
	const [ethPriceData, setEthPriceData] = useState(2000);
	const handleWindowResize = () => {
		setWidth(window.innerWidth);
	}

	useEffect(() => {
		const getData = async () => {
			const userId = localStorage.getItem("account-info");
			const userRef = db.collection("users_tokenbal").doc(userId);
			const userData = await userRef.get();
			if (userData.exists) {
				const data = userData.data();
				const players = Object.keys(data).filter(key => key.endsWith("_Purchases"));
				const transactions1 = [];
				players.forEach(player => {
					const purchaseData = data[player];
					purchaseData.forEach(purchase => {
						const today = moment();
						const date = moment(purchase.date, "DD/MM/YYYY");
						const datePlus30Days = moment(purchase.date, "DD/MM/YYYY").add(30, "days");
						const timeLeft = datePlus30Days.diff(today, "days");
						if (timeLeft >= 0) {
							transactions1.push({
								player: player.split("_Purchases")[0],
								owned: purchase.number,
								date: purchase.date,
								timeleft: timeLeft
							});
						}
					});
				});
				setTransactionData1(transactions1);
				let ethPriceData = await axios.get(ethPriceURL);
				if (ethPriceData.data) {
					setEthPriceData(parseFloat(ethPriceData.data.USD));
				}
				setLoading(false);
			}
		};
		getData();
		window.addEventListener("resize", handleWindowResize);
		return () => window.removeEventListener("resize", handleWindowResize);
	}, []);


	useEffect(() => {
		let account = localStorage.getItem("account-info");
		if (!account) {
			localStorage.clear();
			history.push("/login");
		}
		db.collection('stateRealtime').doc('changeTransaction').onSnapshot(async (snap) => {
			await updateTransactionData(account)
		});
		doGetAnUser(account).then((query) => {
			if (query.docs.length !== 0) {
				query.docs[0].data();
				// setUser(res);
			}
		});
	}, [history]);


	const updateTransactionData = async () => {
		var mytransaction_ref = await db.collection("myRewards").doc(localStorage.getItem("account-info")).get();
		if (mytransaction_ref.data() !== undefined && mytransaction_ref.data() !== null && mytransaction_ref.data() !== []) {
			let transactions = mytransaction_ref.data();
			let myTransactions = [];
			for (let i = 0; i < Object.keys(transactions).length; i++) {
				if (Object.keys(transactions)[i] !== "uid") {
					let tokenId = transactions[Object.keys(transactions)[i]];
					for (let j = 0; j < tokenId.length; j++) {
						myTransactions.push({
							timestamp: moment.unix(tokenId[j].timestamp).format('DD/MM/YY'),
							reward: tokenId[j].reward,
							player: tokenId[j].player,
							tokensHeld: tokenId[j].tokensHeld,
							totalHeld: tokenId[j].totalHeld,
							payoutPerToken: tokenId[j].payoutPerToken,
							payout: tokenId[j].payout,
							real_timestamp: tokenId[j].timestamp
						});
					}
				}
			}
			myTransactions = myTransactions.slice(0, 100);
			myTransactions.sort(function (x, y) {
				return y.real_timestamp - x.real_timestamp;
			});
			// setFullTransactionData(myTransactions);
			setTransactionData(myTransactions);
		}
	}

	// console.log("Today's date: ", moment().format("MM/DD/YYYY"));

	if (loading) {
		return <Spinner />;
	}

	return (
		<div className="container-fluid">
			<div className="card card--overflow my-rewards">
				<div className="card-header">
					<h3 className="card-title">
						My Rewards
					</h3>
				</div>
				<div className="flex-grow-scroll">
					<div className="card-body">
						<div className="table-responsive">
							<table className="table">
								{
									width > 768 ? <thead>
										<tr>
											<th>Reward Type</th>
											<th>Time</th>
											<th>Total Reward</th>
											<th>Reward per token</th>
										</tr>
									</thead> : <></>
								}
								{(currentUser?.providerData[0]) ?
									(<tbody>
										{transactionData.map((transaction, key) => {
											if (width > 768) {
												<tr key={key}>
													<td>{transaction.reward}</td>
													<td>{transaction.timestamp}</td>
													<td>£{transaction.payout}</td>
													<td>£{transaction.payoutPerToken}</td>
												</tr>
											} else {
												<div key={key} className="pt-1">
													<Row className="padding-0 m-0 d-flex">
														<Row className="m-0 padding-0 w-50">
															<div className="text-muted fs-5 padding-0">{"Reward type:"}</div>
															<div className="fs-5 d-flex padding-0">{transaction.reward}</div>
														</Row>
														<Row className=" text-capitalize m-0 padding-0 w-50">
															<div className="text-muted fs-5 padding-0">{"Time:"}</div>
															<div className="fs-6 padding-0" style={{paddingRight : '0px !important'}}>{moment.unix(transaction.timestamp).format('h:mm:ss a')} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;{moment.unix(transaction.timestamp).format('M/D/Y')}</span></div>
														</Row>
													</Row>
													<Row className="m-0 d-flex padding-0">
														<Row className="m-0 padding-0 w-50">
															<div className="text-muted fs-5 padding-0">{"Total Reward:"}</div>
															<div className="fs-5 padding-0">£{(parseFloat(transaction.payout)).toFixed(2).toString()} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;${(parseFloat(transaction.payout) * parseFloat(ethPriceData)).toFixed(2)}&nbsp;ETH</span></div>
														</Row>
														<Row className="fw-medium text-capitalize m-0 padding-0 w-50">
															<div className="text-muted fs-6 padding-0">{"Reward Per Token:"}</div>
															<div className="fs-5 padding-0" style={{paddingRight : '0px !important'}}>£{(parseFloat(transaction.payoutPerToken)).toFixed(2).toString()} <span className="text-muted fs-7 my-auto">&nbsp;&nbsp;${(parseFloat(transaction.payoutPerToken) * parseFloat(ethPriceData)).toFixed(2)}&nbsp;ETH</span></div>
														</Row>
													</Row>
													<Row className="m-0 pt-2 pb-1 padding-0" style={{paddingLeft: "1rem", paddingRight: "1rem"}}>
														<hr className="m-0 p-0" />
													</Row>
												</div>
											}
										})}
									</tbody>) : <Spinner />}


												<div key={0} className="pt-1">
													<Row className="padding-0 m-0 d-flex">
														<Row className="m-0 padding-0 w-50">
															<div className="text-muted fs-5 padding-0">{"Reward type:"}</div>
															<div className="fs-5 d-flex padding-0">{'transaction.reward'}</div>
														</Row>
														<Row className=" text-capitalize m-0 padding-0 w-50">
															<div className="text-muted fs-5 padding-0">{"Time:"}</div>
															<div className="fs-6 padding-0" style={{paddingRight : '0px !important'}}>{moment.unix('21345').format('h:mm:ss a')} <span className="text-muted fs-7 padding-0" >{moment.unix('23125').format('M / D / Y')}</span></div>
														</Row>
													</Row>
													<Row className="m-0 d-flex padding-0">
														<Row className="m-0 padding-0 w-50">
															<div className="text-muted fs-5 padding-0">{"Total Reward:"}</div>
															<div className="fs-5 padding-0">£{(parseFloat('98')).toFixed(2).toString()} <span className="text-muted fs-7 padding-0">&nbsp;{(parseFloat('98') * parseFloat('45')).toFixed(2)}&nbsp;ETH</span></div>
														</Row>
														<Row className="fw-medium text-capitalize m-0 padding-0 w-50">
															<div className="text-muted fs-6 padding-0">{"Reward Per Token:"}</div>
															<div className="fs-5 padding-0" style={{paddingRight : '0px !important'}}>£{(parseFloat('345')).toFixed(2).toString()} <span className="text-muted fs-7 padding-0">&nbsp;{(parseFloat('7') * parseFloat('67')).toFixed(2)}&nbsp;ETH</span></div>
														</Row>
													</Row>
													<Row className="m-0 pt-2 pb-1 padding-0" style={{paddingLeft: "1rem", paddingRight: "1rem"}}>
														<hr className="m-0 p-0" />
													</Row>
												</div>

							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);


}

