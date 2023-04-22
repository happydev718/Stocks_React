import React from 'react';
import PortfolioList from '../components/PortfolioList';
import PortfolioStats from '../components/PortfolioStats';

export default function Portfolio() {
	return (
		<>
			<div className="container-fluid">
				<PortfolioStats />
			</div>
			<PortfolioList />
		</>
	);
}
