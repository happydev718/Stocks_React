import React, { useState, useEffect } from 'react';
import { db } from "../components/firebase/firebase";
import { Row, Col } from 'react-bootstrap';

export default function Balances() {

	const [balance, setBalance] = useState(0);
	const [balance1, setBalance1] = useState(0);
	const [balance2, setBalance2] = useState(0);
	const [balance3, setBalance3] = useState(0);

	const update_payouts = async () => {
		let query_payouts = await db.collection('PayoutsBalance').doc("payouts").get();
		if (query_payouts.data() !== undefined && query_payouts.data() !== null && query_payouts.data() !== []) {
			let payouts = query_payouts.data();
			setBalance(payouts.balance);
			setBalance1(payouts.balance1);
			setBalance2(payouts.balance2);
			setBalance3(payouts.balance3);
		}
	}

	useEffect(() => {
		async function fetchData() {
			db.collection('PayoutsBalance').doc('payouts').onSnapshot(async (snap) => {
				await update_payouts();
			});
		}
		fetchData();
	}, []);

	return (
		<div className="container-fluid">
			<Row>
				<Col md='6'>
					<div className="card">
						<div className="card-body py-5">
							<Row>
								<Col md>
									<p className="card-title text-muted">
										Team Of the Week Wallet Balance:
									</p>
								</Col>
								<Col md='auto'>
									<h4 className="mb-0 d-inline">
										£{(parseFloat(balance)).toFixed(2)}
									</h4>
								</Col>
							</Row>
						</div>
					</div>
				</Col>
				<Col md='6'>
					<div className="card">
						<div className="card-body py-5">
							<Row>
								<Col md>
									<p className="card-title text-muted">
										Team Of the Month Wallet Balance:
									</p>
								</Col>
								<Col md='auto'>
									<h4 className="mb-0 d-inline">
										£{(parseFloat(balance1)).toFixed(2)}
									</h4>
								</Col>
							</Row>
						</div>
					</div>
				</Col>
				<Col md='6'>
					<div className="card">
						<div className="card-body py-5">
							<Row>
								<Col md>
									<p className="card-title text-muted">
										Team Of the Season Wallet Balance:
									</p>
								</Col>
								<Col md='auto'>
									<h4 className="mb-0 d-inline">
										£{(parseFloat(balance2)).toFixed(2)}
									</h4>
								</Col>
							</Row>
						</div>
					</div>
				</Col>
				<Col md='6'>
					<div className="card">
						<div className="card-body py-5">
							<Row>
								<Col md>
									<p className="card-title text-muted">
										Inplay Wallet Balance:
									</p>
								</Col>
								<Col md='auto'>
									<h4 className="mb-0 d-inline">
										£{(parseFloat(balance3)).toFixed(2)}
									</h4>
								</Col>
							</Row>
						</div>
					</div>
				</Col>
			</Row>
		</div>
	);
}
