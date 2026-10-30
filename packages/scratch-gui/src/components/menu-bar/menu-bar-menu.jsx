import PropTypes from 'prop-types';
import React from 'react';
import Menu from '../../containers/menu.jsx';

const MenuBarMenu = ({
    children,
    className,
    ignoreOutsideClickRef,
    onRequestClose,
    open,
    place = 'right'
}) => (
    <div className={className}>
        <Menu
            ignoreOutsideClickRef={ignoreOutsideClickRef}
            open={open}
            place={place}
            onRequestClose={onRequestClose}
        >
            {children}
        </Menu>
    </div>
);

MenuBarMenu.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    ignoreOutsideClickRef: PropTypes.object,
    onRequestClose: PropTypes.func,
    open: PropTypes.bool,
    place: PropTypes.oneOf(['left', 'right'])
};

export default MenuBarMenu;
