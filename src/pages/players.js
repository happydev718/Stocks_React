import React, { Fragment } from 'react';
import PlayersCarousel from '../components/PlayersCarousel';
import PlayersList from '../components/PlayersList';

export default function Players() {
	return (
		<Fragment>
			<div className="container-fluid">
				<PlayersCarousel />
			</div>
			<PlayersList />
		</Fragment>
	);
}
