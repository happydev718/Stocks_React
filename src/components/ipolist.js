import { Row, Col } from 'react-bootstrap';
import IPOCarouselItem from './IPOCarouselItem';
import configURL4 from '../config/ipo.json'

const iponamelist = configURL4.iponamelist;

export default function IPOCarousel() {
	return (
		<Row>
			{
				iponamelist.map((obj, key) => (
					<Col md="4">
						<IPOCarouselItem id={obj} key={key} />
					</Col>
				))
			}
		</Row>
	);
}
