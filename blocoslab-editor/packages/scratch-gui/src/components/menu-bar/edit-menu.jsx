import React from 'react';
import styles from './menu-bar.css';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import editIcon from './icon--edit.svg';
import {useIntl, FormattedMessage, defineMessage} from 'react-intl';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuItem} from '../menu/menu.jsx';
import useMenuNavigation from '../../hooks/use-menu-navigation';
import dropdownCaret from './dropdown-caret.svg';
import DeletionRestorer from '../../containers/deletion-restorer.jsx';

const editMenuAriaMessage = defineMessage({
    id: 'gui.aria.editMenu',
    defaultMessage: 'Edit menu',
    description: 'accessibility label for edit menu'
});

const EditMenu = ({
    isRtl,
    onRestoreOption,
    restoreOptionMessage,
    depth
}) => {
    const intl = useIntl();

    const {
        menuRef,
        isExpanded,
        handleKeyDown,
        handleKeyDownOpenMenu,
        handleOnOpen,
        handleOnClose
    } = useMenuNavigation({
        depth,
        isRtl
    });

    return (
        <button
            className={classNames(styles.menuBarItem, styles.hoverable, {
                [styles.active]: isExpanded()
            })}
            onClick={handleOnOpen}
            aria-label={intl.formatMessage(editMenuAriaMessage)}
            aria-expanded={isExpanded()}
            onKeyDown={handleKeyDown}
            ref={menuRef}
        >
            <img src={editIcon} />
            <span className={styles.collapsibleLabel}>
                <FormattedMessage
                    defaultMessage="Edit"
                    description="Text for edit dropdown menu"
                    id="gui.menuBar.edit"
                />
            </span>
            <img src={dropdownCaret} />
            <MenuBarMenu
                className={classNames(styles.menuBarMenu)}
                open={isExpanded()}
                place={isRtl ? 'left' : 'right'}
                onRequestClose={handleOnClose}
            >
                <DeletionRestorer>{(handleRestore, {restorable, deletedItem}) => (
                    <MenuItem
                        className={classNames({[styles.disabled]: !restorable})}
                        onClick={onRestoreOption(handleRestore)}
                        isDataMenuItem
                        onParentKeyDown={handleKeyDownOpenMenu}
                        isDisabled={!restorable}
                    >
                        {restoreOptionMessage(deletedItem)}
                    </MenuItem>
                )}</DeletionRestorer>
            </MenuBarMenu>
        </button>
    );
};

EditMenu.propTypes = {
    isRtl: PropTypes.bool,
    restoreOptionMessage: PropTypes.func.isRequired,
    onRestoreOption: PropTypes.func.isRequired,
    depth: PropTypes.number
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

export default connect(
    mapStateToProps
)(EditMenu);
