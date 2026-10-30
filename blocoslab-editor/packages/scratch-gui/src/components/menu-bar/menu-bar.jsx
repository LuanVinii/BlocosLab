import classNames from 'classnames';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import intlShape from '../../lib/intlShape.js';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import bowser from 'bowser';
import React from 'react';
import '@fontsource/outfit/800.css';

import VM from '@scratch/scratch-vm';

import Box from '../box/box.jsx';
import {ComingSoonTooltip} from '../coming-soon/coming-soon.jsx';
import SaveStatus from './save-status.jsx';
import LoginDropdown from './login-dropdown.jsx';
import MenuBarHOC from '../../containers/menu-bar-hoc.jsx';
import SettingsMenu from './settings-menu.jsx';
import FileMenu from './file-menu.jsx';
import ModeMenu from './mode-menu.jsx';
import AboutMenu from './about-menu.jsx';

import {
    isTimeTravel2020,
    isTimeTravelNow,
    setTimeTravel
} from '../../reducers/time-travel';
import {
    requestNewProject,
    manualUpdateProject
} from '../../reducers/project-state';

import collectMetadata from '../../lib/collect-metadata';
import styles from './menu-bar.css';

import sharedMessages from '../../lib/shared-messages';
import mystuffIcon from './icon--mystuff.png';
import profileIcon from './icon--profile.png';
import dropdownCaret from './dropdown-caret.svg';
import {AccountMenuOptionsPropTypes} from '../../lib/account-menu-options';
import AccountMenu from './account-menu.jsx';

const ariaMessages = defineMessages({
    home: {
        id: 'gui.menuBar.home',
        defaultMessage: 'Home',
        description: 'accessibility text for the home button'
    }
});

const MenuBarItemTooltip = ({
    children,
    className,
    enable,
    id,
    place = 'bottom'
}) => {
    if (enable) {
        return (
            <React.Fragment>
                {children}
            </React.Fragment>
        );
    }
    return (
        <ComingSoonTooltip
            className={classNames(styles.comingSoon, className)}
            place={place}
            tooltipClassName={styles.comingSoonTooltip}
            tooltipId={id}
        >
            {children}
        </ComingSoonTooltip>
    );
};

MenuBarItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    enable: PropTypes.bool,
    id: PropTypes.string,
    place: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

const MenuItemTooltip = ({id, isRtl, children, className}) => (
    <ComingSoonTooltip
        className={classNames(styles.comingSoon, className)}
        isRtl={isRtl}
        place={isRtl ? 'left' : 'right'}
        tooltipClassName={styles.comingSoonTooltip}
        tooltipId={id}
    >
        {children}
    </ComingSoonTooltip>
);

MenuItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string,
    isRtl: PropTypes.bool
};

class MenuBar extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickNew',
            'handleSetMode',
            'handleKeyPress',
            'getSaveToComputerHandler'
        ]);
    }
    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyPress);
    }
    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyPress);
    }
    handleClickNew () {
        // if the project is dirty, and user owns the project, we will autosave.
        // but if they are not logged in and can't save, user should consider
        // downloading or logging in first.
        // Note that if user is logged in and editing someone else's project,
        // they'll lose their work.
        const readyToReplaceProject = this.props.confirmReadyToReplaceProject(
            this.props.intl.formatMessage(sharedMessages.replaceProjectWarning)
        );
        if (readyToReplaceProject) {
            this.props.onClickNew(this.props.canSave && this.props.canCreateNew);
        }
    }
    handleSetMode (mode) {
        return () => {
            // Turn on/off filters for modes.
            if (mode === '1920') {
                document.documentElement.style.filter = 'brightness(.9)contrast(.8)sepia(1.0)';
                document.documentElement.style.height = '100%';
            } else if (mode === '1990') {
                document.documentElement.style.filter = 'hue-rotate(40deg)';
                document.documentElement.style.height = '100%';
            } else {
                document.documentElement.style.filter = '';
                document.documentElement.style.height = '';
            }

            this.props.onSetTimeTravelMode(mode);
        };
    }
    handleKeyPress (event) {
        const modifier = bowser.mac ? event.metaKey : event.ctrlKey;
        if (modifier && event.key === 's') {
            this.props.onClickSave();
            event.preventDefault();
        }
    }
    getSaveToComputerHandler (downloadProjectCallback) {
        return async () => {
            const saved = await downloadProjectCallback();
            if (saved === false) return;
            if (this.props.onProjectTelemetryEvent) {
                const metadata = collectMetadata(this.props.vm, this.props.projectTitle, this.props.locale);
                this.props.onProjectTelemetryEvent('projectDidSave', metadata);
            }
        };
    }
    render () {
        const menuOpts = this.props.accountMenuOptions;
        return (
            <Box
                className={classNames(
                    this.props.className,
                    styles.menuBar
                )}
                aria-label={this.props.ariaLabel}
                role={this.props.ariaRole}
                element="header"
            >
                <div className={styles.mainMenu}>
                    <div className={styles.navigationActions}>
                    <div className={styles.fileGroup}>
                        <button
                            aria-label={this.props.intl.formatMessage(ariaMessages.home)}
                            className={classNames(styles.menuBarItem)}
                            onClick={this.props.onClickLogo}
                        >
                            <span
                                aria-label="BlocosLab"
                                className={classNames(styles.brand, {
                                    [styles.clickable]: typeof this.props.onClickLogo !== 'undefined'
                                })}
                            >
                                <span className={styles.brandPrimary}>Blocos</span>
                                <span className={styles.brandAccent}>Lab</span>
                            </span>
                        </button>
                        {(this.props.canChangeColorMode || this.props.canChangeLanguage || this.props.canChangeTheme) &&
                        (<SettingsMenu
                            canChangeLanguage={this.props.canChangeLanguage}
                            canChangeColorMode={false}
                            canChangeTheme={false}
                            hasActiveMembership={this.props.hasActiveMembership}
                            isRtl={this.props.isRtl}
                            depth={1}
                        />)}
                        {this.props.isTotallyNormal && (<ModeMenu
                            onSetMode={this.handleSetMode}
                            modeNow={this.props.modeNow}
                            mode2020={this.props.mode2020}
                            isRtl={this.props.isRtl}
                            depth={1}
                        />)}
                    </div>
                    {(this.props.canManageFiles) && (<FileMenu
                        onStartSelectingFileUpload={this.props.onStartSelectingFileUpload}
                        onClickNew={this.handleClickNew}
                        onClickRemix={this.props.onClickRemix}
                        onClickSave={this.props.onClickSave}
                        getSaveToComputerHandler={this.getSaveToComputerHandler}
                        canSave={this.props.canSave}
                    />)}
                    </div>
                </div>

                {/* show the proper UI in the account menu, given whether the user is
                logged in, and whether a session is available to log in with */}
                {this.props.showComingSoon && <div className={styles.accountInfoGroup}>
                    <div className={styles.menuBarItem}>
                        {this.props.canSave && (
                            <SaveStatus className={classNames(styles.hoverable, styles.menuBarItem)} />
                        )}
                    </div>

                    {menuOpts.canHaveSession ? (
                        this.props.username ? (
                            // ************ user is logged in ************
                            <React.Fragment>
                                {menuOpts.myStuffUrl ? (
                                    <a
                                        href={menuOpts.myStuffUrl}
                                        aria-label={this.props.intl.formatMessage(ariaMessages.myStuff)}
                                    >
                                        <div
                                            className={classNames(
                                                styles.menuBarItem,
                                                styles.hoverable,
                                                styles.mystuffButton
                                            )}
                                        >
                                            <img
                                                className={styles.mystuffIcon}
                                                src={mystuffIcon}
                                            />
                                        </div>
                                    </a>
                                ) : null}

                                <AccountMenu
                                    menuOpts={menuOpts}
                                    username={this.props.username}
                                    isRtl={this.props.isRtl}
                                    onLogOut={this.props.onLogOut}
                                    avatarBadge={this.props.avatarBadge}
                                    depth={1}
                                />
                            </React.Fragment>
                        ) : (
                            // ********* user not logged in, but a session exists
                            // ********* so they can choose to log in
                            <React.Fragment>
                                {menuOpts.canRegister ? (
                                    <button
                                        className={classNames(
                                            styles.menuBarItem,
                                            styles.hoverable
                                        )}
                                        key="join"
                                        onClick={this.props.onOpenRegistration}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Join Scratch"
                                            description="Link for creating a Scratch account"
                                            id="gui.menuBar.joinScratch"
                                        />
                                    </button>
                                ) : null}

                                {menuOpts.canLogin ? (
                                    <button
                                        className={classNames(
                                            styles.menuBarItem,
                                            styles.hoverable
                                        )}
                                        key="login"
                                        onMouseUp={this.props.onClickLogin}
                                        onClick={this.props.onClickLogin}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Sign in"
                                            description="Link for signing in to your Scratch account"
                                            id="gui.menuBar.signIn"
                                        />
                                        <LoginDropdown
                                            className={classNames(styles.menuBarMenu)}
                                            isOpen={this.props.loginMenuOpen}
                                            isRtl={this.props.isRtl}
                                            renderLogin={this.props.renderLogin}
                                            onClose={this.props.onRequestCloseLogin}
                                        />
                                    </button>
                                ) : null}
                            </React.Fragment>
                        )
                    ) : (
                        // ******** no login session is available, so don't show login stuff
                        <React.Fragment>
                            {this.props.showComingSoon ? (
                                <React.Fragment>
                                    <MenuBarItemTooltip id="mystuff">
                                        <div
                                            className={classNames(
                                                styles.menuBarItem,
                                                styles.hoverable,
                                                styles.mystuffButton
                                            )}
                                        >
                                            <img
                                                className={styles.mystuffIcon}
                                                src={mystuffIcon}
                                            />
                                        </div>
                                    </MenuBarItemTooltip>
                                    <MenuBarItemTooltip
                                        id="account-nav"
                                        place={this.props.isRtl ? 'right' : 'left'}
                                    >
                                        <div
                                            className={classNames(
                                                styles.menuBarItem,
                                                styles.hoverable,
                                                styles.accountNavMenu
                                            )}
                                        >
                                            <img
                                                className={styles.profileIcon}
                                                src={profileIcon}
                                            />
                                            <span>
                                                {'scratch-cat'}
                                            </span>
                                            <img
                                                className={styles.dropdownCaretIcon}
                                                src={dropdownCaret}
                                            />
                                        </div>
                                    </MenuBarItemTooltip>
                                </React.Fragment>
                            ) : []}
                        </React.Fragment>
                    )}
                </div>}

                {this.props.showComingSoon && this.props.onClickAbout && (
                    <AboutMenu
                        onClick={this.props.onClickAbout}
                        isRtl={this.props.isRtl}
                        depth={1}
                    />
                )}
            </Box>
        );
    }
}

MenuBar.propTypes = {
    ariaLabel: PropTypes.string,
    ariaRole: PropTypes.string,
    canChangeLanguage: PropTypes.bool,
    canChangeColorMode: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    className: PropTypes.string,
    confirmReadyToReplaceProject: PropTypes.func,
    hasActiveMembership: PropTypes.bool,
    intl: intlShape,
    isRtl: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    loginMenuOpen: PropTypes.bool,
    mode2020: PropTypes.bool,
    modeNow: PropTypes.bool,
    onClickAbout: PropTypes.oneOfType([
        PropTypes.func, // button mode: call this callback when the About button is clicked
        PropTypes.arrayOf( // menu mode: list of items in the About menu
            PropTypes.shape({
                title: PropTypes.string, // text for the menu item
                onClick: PropTypes.func // call this callback when the menu item is clicked
            })
        )
    ]),
    onClickLogin: PropTypes.func,
    onClickLogo: PropTypes.func,
    onClickNew: PropTypes.func,
    onClickRemix: PropTypes.func,
    onClickSave: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onProjectTelemetryEvent: PropTypes.func,
    onRequestCloseLogin: PropTypes.func,
    onSetTimeTravelMode: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    projectTitle: PropTypes.string,
    renderLogin: PropTypes.func,
    showComingSoon: PropTypes.bool,
    username: PropTypes.string,
    avatarBadge: PropTypes.number,

    accountMenuOptions: AccountMenuOptionsPropTypes,

    vm: PropTypes.instanceOf(VM).isRequired
};

MenuBar.defaultProps = {
    logo: null,
    onShare: () => {}
};

const mapStateToProps = (state, ownProps) => {
    const user = state.session && state.session.session && state.session.session.user;
    const permissions = state.session && state.session.permissions;
    const sessionExists = state.session && typeof state.session.session !== 'undefined';

    return {
        currentLocale: state.locales.locale,
        isRtl: state.locales.isRtl,
        locale: state.locales.locale,
        projectTitle: state.scratchGui.projectTitle,
        username: ownProps.username ?? (user ? user.username : null),
        avatarBadge: ownProps.avatarBadge ?? (user ? user.membership_avatar_badge : null),
        userIsEducator: permissions && permissions.educator,
        vm: state.scratchGui.vm,
        mode2020: isTimeTravel2020(state),
        modeNow: isTimeTravelNow(state),

        userOwnsProject: ownProps.userOwnsProject ?? (
            ownProps.authorUsername && user && (ownProps.authorUsername === user.username)
        ),

        accountMenuOptions: ownProps.accountMenuOptions ?? {
            canHaveSession: sessionExists ?? false,

            canRegister: true,
            canLogin: true,
            canLogout: true,

            avatarUrl: user?.thumbnailUrl,
            myStuffUrl: '/mystuff/',
            profileUrl: user && `/users/${user.username}`,
            myClassesUrl: permissions?.educator ? '/educators/classes/' : null,
            myClassUrl: user && permissions?.student ? `/classes/${user.classroomId}/` : null,
            accountSettingsUrl: '/accounts/settings/'
        }
    };
};

const mapDispatchToProps = dispatch => ({
    onClickNew: needSave => dispatch(requestNewProject(needSave)),
    onClickSave: () => dispatch(manualUpdateProject()),
    onSetTimeTravelMode: mode => dispatch(setTimeTravel(mode))
});

export default compose(
    injectIntl,
    MenuBarHOC,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(MenuBar);
