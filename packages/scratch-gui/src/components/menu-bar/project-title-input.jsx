import classNames from 'classnames';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {setProjectTitle} from '../../reducers/project-title';

import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Input from '../forms/input.jsx';
const BufferedInput = BufferedInputHOC(Input);

import styles from './project-title-input.css';

const messages = defineMessages({
    projectTitlePlaceholder: {
        id: 'gui.gui.projectTitlePlaceholder',
        description: 'Placeholder for project title when blank',
        defaultMessage: 'Digite o nome do projeto'
    }
});

const ProjectTitleInput = ({
    className,
    autoFocus,
    id,
    onSubmit,
    projectTitle
}) => {
    const intl = useIntl();
    return (
        <BufferedInput
            className={classNames(styles.titleField, className)}
            autoFocus={autoFocus}
            aria-label="Nome do projeto"
            id={id}
            maxLength="100"
            placeholder={intl.formatMessage(messages.projectTitlePlaceholder)}
            tabIndex="0"
            type="text"
            value={projectTitle}
            onSubmit={onSubmit}
        />
    );
};

ProjectTitleInput.propTypes = {
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    id: PropTypes.string,
    onSubmit: PropTypes.func,
    projectTitle: PropTypes.string
};

const mapStateToProps = state => ({
    projectTitle: state.scratchGui.projectTitle
});

const mapDispatchToProps = dispatch => ({
    onSubmit: title => dispatch(setProjectTitle(title))
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectTitleInput);
