import React, { useEffect, useState } from "react";
import { Tab, Row, Col } from "react-bootstrap";
// import { auth } from "../components/firebase/firebase";
import { doGetAnUser } from "../components/firebase/auth";
import { useHistory } from "react-router-dom";

export default function Refer() {
	const [user, setUser] = useState(null);
	const account = localStorage.getItem("account-info");
	const history = useHistory();
	useEffect(() => {
		if (!account) {
			localStorage.clear();
			history.push("/login");
		}
		doGetAnUser(account).then((query) => {
			if (query.docs.length !== 0) {
				let res = query.docs[0].data();
				setUser(res);
			}
		});
	}, [account, history]);
	return (
		<div className="container-fluid">
			<Row>
				<Col md='6'>
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">Refer a friend</h3>
						</div>
						<div className="card-body">
							<div className="mb-5">
								<h4>
									Earn £10 for yourself and a friend when they use your referral link!
								</h4>
								<p className="text-muted">
									Rewards will be paid in free shares and will be credited when the real money platform goes live. Referred users must make a deposit on the real money platform to qualify.
								</p>
							</div>

							<h5>
								Your Unique Referral Link:
							</h5>

							<div className="form-control text-select-all">
								{"https://stocksfc.com/?r=" + user?.uid}
							</div>
						</div>
					</div>
				</Col>

				<Col md='6'>
					<div className="card">
						<div className="card-header">
							<h3 className="card-title">
								Referral bonus
							</h3>
						</div>
						<div className="card-body">
							<h4>
								The Top 10 Referrers will earn the following bonus credit:
							</h4>

							<Row>
								<Col>
									<div className='mb-2'>
										<span className="text-muted">1. {' '}</span>
										£250
									</div>
									<div className='mb-2'>
										<span className="text-muted">2. {' '}</span>
										£100
									</div>
									<div className='mb-2'>
										<span className="text-muted">3. {' '}</span>
										£100
									</div>
								</Col>
								<Col>
									<div className='mb-2'>
										<span className="text-muted">4. {' '}</span>
										£100
									</div>
									<div className='mb-2'>
										<span className="text-muted">5. {' '}</span>
										£100
									</div>
									<div className='mb-2'>
										<span className="text-muted">6. {' '}</span>
										£50
									</div>
								</Col>
								<Col>
									<div className='mb-2'>
										<span className="text-muted">7. {' '}</span>
										£50
									</div>
									<div className='mb-2'>
										<span className="text-muted">8. {' '}</span>
										£50
									</div>
									<div className='mb-2'>
										<span className="text-muted">9. {' '}</span>
										£50
									</div>
								</Col>
								<Col>
									<div className='mb-2'>
										<span className="text-muted">10. {' '}</span>
										£50
									</div>
								</Col>
							</Row>
						</div>
					</div>
				</Col>
			</Row >
		</div >
	);
}
