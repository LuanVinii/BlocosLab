import PropTypes from 'prop-types';
import React, {useLayoutEffect, useRef} from 'react';
import classNames from 'classnames';

import styles from './watermark.css';

const Watermark = props => {
    const imageRef = useRef(null);

    useLayoutEffect(() => {
        const image = imageRef.current;
        const wrapper = image && image.closest('.blocks-wrapper');
        if (!wrapper) return undefined;

        const flyout = wrapper.querySelector('.blocklyFlyout');
        if (!flyout) return undefined;

        const positionImage = () => {
            const wrapperBounds = wrapper.getBoundingClientRect();
            const flyoutBounds = flyout.getBoundingClientRect();
            if (!flyoutBounds.width) return;

            if (window.getComputedStyle(wrapper).direction === 'rtl') {
                image.style.left = 'auto';
                image.style.right = `${Math.max(16, wrapperBounds.right - flyoutBounds.left + 8)}px`;
            } else {
                image.style.right = 'auto';
                image.style.left = `${Math.max(16, flyoutBounds.right - wrapperBounds.left + 8)}px`;
            }
        };

        positionImage();
        window.addEventListener('resize', positionImage);
        const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(positionImage) : null;
        if (resizeObserver) {
            resizeObserver.observe(wrapper);
            resizeObserver.observe(flyout);
        }

        return () => {
            window.removeEventListener('resize', positionImage);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, []);

    return (
        <img
            ref={imageRef}
            alt=""
            aria-hidden="true"
            className={classNames(styles.spriteImage, props.className)}
            src={props.costumeURL}
        />
    );
};

Watermark.propTypes = {
    className: PropTypes.string,
    costumeURL: PropTypes.string
};

export default Watermark;
