import PropTypes from 'prop-types';
import React from 'react';
import ReactStars from 'react-rating-stars-component';
import theme from '../theme.js';
import {IoStar, IoStarHalf, IoStarOutline} from 'react-icons/io5';

// https://www.npmjs.com/package/react-rating-stars-component

export default function ReviewRating({
  edit = false,
  isHalf = false,
  rating = 0,
  setReviewsInput = () => {},
  size = 32,
  isLight = false
}) {
  const color = isLight ? theme.colors.brand.white : theme.colors.brand.black;
  const starConfig = {
    size,
    isHalf,
    color,
    activeColor: color,
    emptyIcon: <IoStarOutline />,
    halfIcon: <IoStarHalf />,
    filledIcon: <IoStar />
  };

  return (
    <ReactStars
      a11y={false}
      count={5}
      edit={edit}
      value={rating}
      onChange={setReviewsInput}
      {...starConfig}
    />
  );
}

ReviewRating.propTypes = {
  rating: PropTypes.number,
  setReviewsInput: PropTypes.func,
  size: PropTypes.number,
  isHalf: PropTypes.bool,
  edit: PropTypes.bool,
  isLight: PropTypes.bool
};
