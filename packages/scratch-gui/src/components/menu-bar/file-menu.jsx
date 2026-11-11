import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {defineMessage, useIntl} from 'react-intl';

import SB3Downloader from '../../containers/sb3-downloader.jsx';
import styles from './menu-bar.css';
import dropdownCaret from './dropdown-caret.svg';
import fileMenuIcon from './icon--file.svg';
import newProjectIcon from './icon--new.svg';
import uploadProjectIcon from '../action-menu/icon--file-upload.svg';
import downloadProjectIcon from './icon--download.svg';
import projectTitleIcon from './icon--project-title.svg';
import confirmIcon from './icon--confirm.svg';
import ProjectTitleInput from './project-title-input.jsx';

const messages = {
    menu: defineMessage({
        id: 'gui.menuBar.fileMenu',
        defaultMessage: 'Arquivo',
        description: 'Menu das ações de arquivo do projeto'
    }),
    newProject: defineMessage({
        id: 'gui.menuBar.newProject',
        defaultMessage: 'Novo projeto',
        description: 'Ação para criar um projeto novo'
    }),
    openProject: defineMessage({
        id: 'gui.menuBar.openProject',
        defaultMessage: 'Abrir projeto',
        description: 'Ação para abrir um projeto do computador'
    }),
    saveProject: defineMessage({
        id: 'gui.menuBar.saveProject',
        defaultMessage: 'Salvar projeto',
        description: 'Ação para baixar uma cópia do projeto para o computador'
    }),
    renameProject: defineMessage({
        id: 'gui.menuBar.renameProject',
        defaultMessage: 'Renomear projeto',
        description: 'Ação para alterar o nome do projeto'
    })
};

const FileMenuItem = ({className, icon, label, onClick}) => {
    const intl = useIntl();
    const text = intl.formatMessage(label);
    return (
        <button
            aria-label={text}
            className={classNames(styles.fileMenuItem, className)}
            onClick={onClick}
            role="menuitem"
            type="button"
        >
            <img
                src={icon}
                alt=""
                aria-hidden="true"
            />
            <span>{text}</span>
        </button>
    );
};

FileMenuItem.propTypes = {
    className: PropTypes.string,
    icon: PropTypes.string.isRequired,
    label: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired
};

const FileMenu = ({onClickNew, onStartSelectingFileUpload, getSaveToComputerHandler}) => {
    const intl = useIntl();
    const [menuOpen, setMenuOpen] = useState(false);
    const [projectTitleOpen, setProjectTitleOpen] = useState(false);
    const [projectTitleSaved, setProjectTitleSaved] = useState(false);
    const projectTitleSavedTimer = useRef(null);
    const menuRef = useRef(null);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    useEffect(() => {
        const handlePointerDown = event => {
            if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) closeMenu();
        };
        const handleKeyDown = event => {
            if (event.key === 'Escape') closeMenu();
        };

        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('keydown', handleKeyDown);
            window.clearTimeout(projectTitleSavedTimer.current);
        };
    }, [closeMenu, menuOpen]);

    const handleNewProject = useCallback(() => {
        closeMenu();
        onClickNew();
    }, [closeMenu, onClickNew]);

    const handleOpenProject = useCallback(() => {
        closeMenu();
        onStartSelectingFileUpload();
    }, [closeMenu, onStartSelectingFileUpload]);

    const handleRenameProject = useCallback(() => {
        closeMenu();
        setProjectTitleOpen(true);
        setProjectTitleSaved(false);
    }, [closeMenu]);

    const confirmProjectTitle = useCallback(() => {
        const input = document.getElementById('blocoslab-project-title');
        if (input) input.blur();
        setProjectTitleOpen(false);
        setProjectTitleSaved(true);
        window.clearTimeout(projectTitleSavedTimer.current);
        projectTitleSavedTimer.current = window.setTimeout(() => setProjectTitleSaved(false), 3500);
    }, []);

    const handleSaveProject = useCallback((downloadProjectCallback) => {
        closeMenu();
        getSaveToComputerHandler(downloadProjectCallback)();
    }, [closeMenu, getSaveToComputerHandler]);

    return (
        <div className={styles.fileMenu} ref={menuRef}>
            <button
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={intl.formatMessage(messages.menu)}
                className={classNames(styles.menuBarItem, styles.hoverable, styles.fileMenuTrigger, {
                    [styles.active]: menuOpen,
                    [styles.fileMenuTriggerOpen]: menuOpen
                })}
                onClick={() => setMenuOpen(open => !open)}
                title={intl.formatMessage(messages.menu)}
                type="button"
            >
                <img
                    className={styles.fileMenuIcon}
                    src={fileMenuIcon}
                    alt=""
                    aria-hidden="true"
                />
                <span className={styles.fileMenuLabel}>{intl.formatMessage(messages.menu)}</span>
                <img
                    src={dropdownCaret}
                    alt=""
                    aria-hidden="true"
                />
            </button>
            {menuOpen && (
                <div
                    aria-label={intl.formatMessage(messages.menu)}
                    className={styles.fileMenuDropdown}
                    role="menu"
                >
                    <FileMenuItem
                        icon={newProjectIcon}
                        label={messages.newProject}
                        onClick={handleNewProject}
                    />
                    <FileMenuItem
                        icon={uploadProjectIcon}
                        label={messages.openProject}
                        onClick={handleOpenProject}
                    />
                    <SB3Downloader>{(className, downloadProjectCallback) => (
                        <FileMenuItem
                            className={className}
                            icon={downloadProjectIcon}
                            label={messages.saveProject}
                            onClick={() => handleSaveProject(downloadProjectCallback)}
                        />
                    )}</SB3Downloader>
                    <FileMenuItem
                        icon={projectTitleIcon}
                        label={messages.renameProject}
                        onClick={handleRenameProject}
                    />
                </div>
            )}
            {projectTitleOpen && (
                <div
                    aria-label="Nome do projeto"
                    className={styles.projectTitleMenu}
                    role="group"
                >
                    <label
                        className={styles.projectTitleLabel}
                        htmlFor="blocoslab-project-title"
                    >
                        Nome do projeto
                    </label>
                    <div className={styles.projectTitleControls}>
                        <ProjectTitleInput
                            autoFocus
                            className={styles.projectTitleField}
                            id="blocoslab-project-title"
                        />
                        <button
                            className={styles.projectTitleConfirm}
                            type="button"
                            aria-label="Confirmar nome do projeto"
                            title="Confirmar nome do projeto"
                            onClick={confirmProjectTitle}
                        >
                            <img
                                src={confirmIcon}
                                alt=""
                                aria-hidden="true"
                            />
                        </button>
                    </div>
                </div>
            )}
            {projectTitleSaved && (
                <div
                    aria-live="polite"
                    className={styles.projectTitleToast}
                    role="status"
                >
                    Nome do projeto alterado com sucesso.
                </div>
            )}
        </div>
    );
};

FileMenu.propTypes = {
    onClickNew: PropTypes.func.isRequired,
    onStartSelectingFileUpload: PropTypes.func.isRequired,
    getSaveToComputerHandler: PropTypes.func.isRequired
};

export default FileMenu;
