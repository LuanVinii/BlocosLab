import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useContext, useMemo} from 'react';
import {connect} from 'react-redux';
import VM from '@scratch/scratch-vm';
import useMenuNavigation from '../../hooks/use-menu-navigation';
import {MenuRefContext} from '../../contexts/menu-ref-context';

import LanguageMenu from './language-menu.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuItem, MenuSection} from '../menu/menu.jsx';
import PreferenceMenu from './preference-menu.jsx';

import {DEFAULT_MODE, HIGH_CONTRAST_MODE, colorModeMap} from '../../lib/settings/color-mode/index.js';
import {themeMap} from '../../lib/settings/theme/index.js';
import {persistColorMode} from '../../lib/settings/color-mode/persistence.js';
import {persistTheme} from '../../lib/settings/theme/persistence.js';
import {setColorMode, setTheme} from '../../reducers/settings.js';

import menuBarStyles from './menu-bar.css';
import styles from './settings-menu.css';

import dropdownCaret from './dropdown-caret.svg';
import settingsIcon from './icon--settings.svg';
import themeIcon from '../../lib/assets/icon--theme.svg';
import turboIcon from '../icons/lucide/zap.svg';

const enabledColorModes = [DEFAULT_MODE, HIGH_CONTRAST_MODE];

const SettingsMenu = ({
    canChangeLanguage,
    canChangeColorMode,
    canChangeTheme,
    hasActiveMembership,
    isRtl,
    activeColorMode,
    onChangeColorMode,
    activeTheme,
    onChangeTheme,
    turbo,
    vm,
    depth
}) => {
    const enabledColorModesMap = useMemo(() => Object.keys(colorModeMap).reduce((acc, colorMode) => {
        if (enabledColorModes.includes(colorMode)) {
            acc[colorMode] = colorModeMap[colorMode];
        }
        return acc;
    }, {}), []);
    const availableThemesMap = useMemo(() => Object.keys(themeMap).reduce((acc, themeKey) => {
        const theme = themeMap[themeKey];
        if (theme.isAvailable?.({hasActiveMembership})) {
            acc[themeKey] = theme;
        }
        return acc;
    }, {}), [hasActiveMembership]);
    const availableThemesLength = useMemo(() => Object.keys(availableThemesMap).length, [availableThemesMap]);
    const handleToggleTurbo = () => vm.setTurboMode(!turbo);
    const menuContext = useContext(MenuRefContext);

    const {
        isExpanded,
        handleOnOpen,
        handleKeyDown,
        menuRef
    } = useMenuNavigation({
        depth,
        isRtl
    });
    const handleCloseFromOutside = useCallback(() => {
        menuContext.closeMenuByRef(menuRef);
    }, [menuContext, menuRef]);
    const handleTogglePreferences = useCallback(() => {
        if (isExpanded()) {
            menuContext.closeMenuByRef(menuRef);
        } else {
            handleOnOpen();
        }
    }, [handleOnOpen, isExpanded, menuContext, menuRef]);

    return (<div
        className={styles.settingsMenu}
        data-menu-item-wrapper="true"
        onKeyDown={handleKeyDown}
        ref={menuRef}
        tabIndex={-1}
    >
        <button
            data-menu-item="true"
            className={classNames(
                menuBarStyles.menuBarItem,
                menuBarStyles.hoverable,
                styles.settingsTrigger,
                {
                    [menuBarStyles.active]: isExpanded(),
                    [styles.settingsTriggerOpen]: isExpanded()
                }
            )}
            type="button"
            aria-expanded={isExpanded()}
            aria-label="Preferências"
            onClick={handleTogglePreferences}
        >
            <img src={settingsIcon} alt="" aria-hidden="true" />
            <span className={styles.dropdownLabel}>Preferências</span>
            <img src={dropdownCaret} alt="" aria-hidden="true" />
        </button>
        <MenuBarMenu
            className={classNames(menuBarStyles.menuBarMenu, styles.preferencesDropdown)}
            ignoreOutsideClickRef={menuRef}
            open={isExpanded()}
            place={isRtl ? 'left' : 'right'}
            onRequestClose={handleCloseFromOutside}
        >
            <MenuSection>
                {canChangeLanguage && <LanguageMenu depth={depth + 1} />}
                <MenuItem
                    ariaRole="menuitemcheckbox"
                    aria-checked={turbo}
                    data-blocoslab-turbo="true"
                    isDataMenuItem
                    isSelected={turbo}
                    onClick={handleToggleTurbo}
                >
                    <span className={styles.turboRow}>
                        <span className={styles.turboLabel}>
                            <img className={styles.icon} src={turboIcon} alt="" aria-hidden="true" />
                            <span>Modo turbo</span>
                        </span>
                        <span className={styles.turboState}>{turbo ? 'Ativado' : 'Desativado'}</span>
                    </span>
                </MenuItem>
                {canChangeTheme &&
                    // TODO: Consider always showing the theme menu, even if there is a single available theme
                    availableThemesLength > 1 &&
                    <PreferenceMenu
                        itemsMap={availableThemesMap}
                        onChange={onChangeTheme}
                        defaultMenuIconSrc={themeIcon}
                        submenuLabel={{
                            defaultMessage: 'Theme',
                            description: 'Theme sub-menu',
                            id: 'gui.menuBar.theme'
                        }}
                        selectedItemKey={activeTheme}
                        isRtl={isRtl}
                        depth={depth + 1}
                    />}
                {canChangeColorMode && <PreferenceMenu
                    itemsMap={enabledColorModesMap}
                    onChange={onChangeColorMode}
                    submenuLabel={{
                        defaultMessage: 'Color Mode',
                        description: 'Color mode sub-menu',
                        id: 'gui.menuBar.colorMode'
                    }}
                    selectedItemKey={activeColorMode}
                    isRtl={isRtl}
                    depth={depth + 1}
                />}
            </MenuSection>
        </MenuBarMenu>
    </div>);
};

SettingsMenu.propTypes = {
    canChangeLanguage: PropTypes.bool,
    canChangeColorMode: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    hasActiveMembership: PropTypes.bool,
    isRtl: PropTypes.bool,
    activeColorMode: PropTypes.string,
    onChangeColorMode: PropTypes.func,
    activeTheme: PropTypes.string,
    onChangeTheme: PropTypes.func,
    turbo: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    depth: PropTypes.number
};

const mapStateToProps = state => ({
    activeColorMode: state.scratchGui.settings.colorMode,
    activeTheme: state.scratchGui.settings.theme,
    isRtl: state.locales.isRtl,
    turbo: state.scratchGui.vmStatus.turbo,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onChangeColorMode: colorMode => {
        dispatch(setColorMode(colorMode));
        persistColorMode(colorMode);
    },
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        persistTheme(theme);
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SettingsMenu);
