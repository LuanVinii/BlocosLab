import React from 'react';
import classNames from 'classnames';
import styles from './loader.css';
import menuBarStyles from '../menu-bar/menu-bar.css';
import PropTypes from 'prop-types';

const messages = [
    'Juntando os blocos...',
    'Ligando os motores...',
    'Preparando o robô...',
    'Arrumando as peças...',
    'Quase lá!'
];

class LoaderComponent extends React.Component {
    constructor (props) {
        super(props);
        this.state = {messageNumber: 0};
    }
    componentDidMount () {
        this.intervalId = setInterval(() => {
            this.setState(({messageNumber}) => ({messageNumber: (messageNumber + 1) % messages.length}));
        }, 2000);
    }
    componentWillUnmount () {
        clearInterval(this.intervalId);
    }
    render () {
        return (
            <div
                className={classNames(styles.background, {
                    [styles.fullscreen]: this.props.isFullScreen
                })}
            >
                <div className={styles.container}>
                    <div className={styles.brandPlate}>
                        <div className={classNames(menuBarStyles.brand, styles.brand)} aria-label="BlocosLab">
                            <span className={menuBarStyles.brandPrimary}>Blocos</span>
                            <span className={menuBarStyles.brandAccent}>Lab</span>
                        </div>
                    </div>
                    <div className={styles.dots} aria-hidden="true">
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                    </div>
                    <div className={styles.title}>Carregando o BlocosLab</div>
                    <div className={styles.message} role="status" aria-live="polite" aria-atomic="false">
                        {messages[this.state.messageNumber]}
                    </div>
                </div>
            </div>
        );
    }
}

LoaderComponent.propTypes = {
    isFullScreen: PropTypes.bool,
    messageId: PropTypes.string
};
LoaderComponent.defaultProps = {
    isFullScreen: false,
    messageId: 'gui.loader.headline'
};

export default LoaderComponent;
