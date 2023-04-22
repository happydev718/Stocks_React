import React from 'react';
import Slider from 'react-slick';
import IPOCarouselItem from './IPOCarouselItem';
import configURL4 from '../config/ipo.json'

const iponamelist = configURL4.iponamelist;

export default function PlayersCarousel() {
	const settings = {
		infinite: true,
		speed: 900,
		autoplay: true,
		autoplaySpeed: 3000,
		slidesToShow: 3,
		slidesToScroll: 1,
		responsive: [
			{
				breakpoint: 1400,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 1,
				},
			},
			{
				breakpoint: 991,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
				},
			},
			{
				breakpoint: 768,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
				},
			},
		],
	};

	return (
		<Slider {...settings}>
			{
				iponamelist.map((obj, key) => (
					<IPOCarouselItem id={obj} key={key} />
				))
			}
		</Slider>
	);
}
