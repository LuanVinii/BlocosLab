import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {useIntl, defineMessage} from 'react-intl';

import SB3Downloader from '../../containers/sb3-downloader.jsx';
import styles from './menu-bar.css';
import newProjectIcon from './icon--new.svg';
import uploadProjectIcon from '../action-menu/icon--file-upload.svg';
import downloadProjectIcon from './icon--download.svg';
import projectTitleIcon from './icon--project-title.svg';
import confirmIcon from './icon--confirm.svg';
import ProjectTitleInput from './project-title-input.jsx';

const messages = {
    newProject: defineMessage({
        id: 'gui.menuBar.new',
        defaultMessage: 'Novo',
        description: 'Ação para criar um projeto novo'
    }),
    loadProject: defineMessage({
        id: 'gui.menuBar.loadFromComputer',
        defaultMessage: 'Carregar do computador',
        description: 'Ação para carregar um projeto do computador'
    }),
    saveProject: defineMessage({
        id: 'gui.menuBar.saveToComputer',
        defaultMessage: 'Salvar no computador',
        description: 'Ação para baixar uma cópia do projeto para o computador'
    }),
    projectTitle: defineMessage({
        id: 'gui.menuBar.projectTitle',
        defaultMessage: 'Nome do projeto',
        description: 'Opção para alterar o nome do projeto'
    })
};

const FileAction = ({className, expanded, icon, label, onClick}) => {
    const intl = useIntl();
    const text = intl.formatMessage(label);
    return (
        <button
            className={classNames(styles.menuBarItem, styles.fileAction, className)}
            type="button"
            aria-label={text}
            aria-expanded={expanded}
            title={text}
            onClick={onClick}
        >
            <img src={icon} alt="" aria-hidden="true" />
            <span>{text}</span>
        </button>
    );
};

FileAction.propTypes = {
    className: PropTypes.string,
    expanded: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    label: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired
};

const FileMenu = ({onClickNew, onStartSelectingFileUpload, getSaveToComputerHandler}) => {
    const [projectTitleOpen, setProjectTitleOpen] = useState(false);
    const [projectTitleSaved, setProjectTitleSaved] = useState(false);
    const projectTitleSavedTimer = useRef(null);

    useEffect(() => () => window.clearTimeout(projectTitleSavedTimer.current), []);

    const confirmProjectTitle = () => {
        const input = document.getElementById('blocoslab-project-title');
        if (input) input.blur();
        setProjectTitleOpen(false);
        setProjectTitleSaved(true);
        window.clearTimeout(projectTitleSavedTimer.current);
        projectTitleSavedTimer.current = window.setTimeout(() => setProjectTitleSaved(false), 3500);
    };

    return (
        <div className={styles.fileActions}>
            <FileAction
                icon={newProjectIcon}
                label={messages.newProject}
                onClick={onClickNew}
            />
            <FileAction
                icon={uploadProjectIcon}
                label={messages.loadProject}
                onClick={onStartSelectingFileUpload}
            />
            <SB3Downloader>{(className, downloadProjectCallback) => (
                <FileAction
                    className={className}
                    icon={downloadProjectIcon}
                    label={messages.saveProject}
                    onClick={getSaveToComputerHandler(downloadProjectCallback)}
                />
            )}</SB3Downloader>
            <div className={styles.projectTitleAction}>
                <FileAction
                    expanded={projectTitleOpen}
                    icon={projectTitleIcon}
                    label={messages.projectTitle}
                    onClick={() => {
                        setProjectTitleOpen(open => !open);
                        setProjectTitleSaved(false);
                    }}
                />
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
                                <img src={confirmIcon} alt="" aria-hidden="true" />
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
        </div>
    );
};

FileMenu.propTypes = {
    onClickNew: PropTypes.func.isRequired,
    onStartSelectingFileUpload: PropTypes.func.isRequired,
    getSaveToComputerHandler: PropTypes.func.isRequired
};

export default FileMenu;
