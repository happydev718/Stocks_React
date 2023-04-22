import React, { Component } from 'react';
// import PlayerStats from '../components/PlayerStats';
import PlayerStats2 from '../components/PlayerStats2';
import ProfileSlider from '../components/ProfileSlider';
import AboutPlayer from "../components/AboutPlayer";
// import { db } from "../components/firebase/firebase";
import { exchangeSelector, priceChartLoadedSelector, priceChartSelector } from '../store/selectors'
import { connect } from 'react-redux'

class Stats extends Component {
	constructor(props) {
		super(props);


	}




	componentDidMount() {
	}

	render() {
		return (
			<div className="container-fluid">
				<div className="row">
					<div className="col-md-3">
						<AboutPlayer id={this.props.id} />
						<PlayerStats2 id={this.props.id} />
					</div>
					<div className="col-md-9">
						<ProfileSlider id={this.props.id} />
					</div>
				</div>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		exchange: exchangeSelector(state),
		priceChartLoaded: priceChartLoadedSelector(state),
		priceChart: priceChartSelector(state),
	}
}

export default connect(mapStateToProps)(Stats);
