import PropTypes from 'prop-types';
import React from 'react';
import VM from '@scratch/scratch-vm';
import menuIconURI from './media/motor-menu-64.png';

import styles from './kit-robotica-button.css';

const KitIcon = ({state}) => (
    <span className={styles.iconContainer}>
        <img
            alt=""
            className={styles.icon}
            src={menuIconURI}
        />
        {state === 'connected' ? (
            <svg aria-hidden="true" className={styles.connectedSeal} viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="7" />
                <path d="m3.5 7 2.2 2.2 4.8-5" />
            </svg>
        ) : state === 'connecting' ? (
            <span className={styles.loadingSeal} />
        ) : (
            <svg aria-hidden="true" className={styles.disconnectedSeal} viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="7" />
                <path d="M7 3.5v5M7 11.5v.2" />
            </svg>
        )}
    </span>
);

KitIcon.propTypes = {
    state: PropTypes.oneOf(['disconnected', 'connecting', 'connected']).isRequired
};

class KitRoboticaButton extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            connected: false,
            error: null,
            popoverOpen: false,
            disconnectNoticeVisible: false,
            disconnectNoticeFaded: false,
            ready: false,
            visible: false,
            state: 'disconnected'
        };
        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
        this.handleRequestError = this.handleRequestError.bind(this);
        this.handleConnectionLost = this.handleConnectionLost.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleConnectedClick = this.handleConnectedClick.bind(this);
        this.handleExtensionAdded = this.handleExtensionAdded.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.setPopoverRef = this.setPopoverRef.bind(this);
        this.handleReconnectClick = this.handleReconnectClick.bind(this);
        this.handleDismissDisconnectNotice = this.handleDismissDisconnectNotice.bind(this);
        this.handleNoticeMouseEnter = this.handleNoticeMouseEnter.bind(this);
        this.handleNoticeMouseLeave = this.handleNoticeMouseLeave.bind(this);
        this.handleNoticeFocus = this.handleNoticeFocus.bind(this);
        this.handleNoticeBlur = this.handleNoticeBlur.bind(this);
        this.connectionActive = false;
        this.disconnectPendingLoss = false;
        this.disconnectNoticeDismissed = false;
        this.disconnectNoticeFadeReady = false;
        this.disconnectNoticeHovered = false;
        this.disconnectNoticeFocused = false;
        this.disconnectNoticeTimer = null;
        this.disconnectNoticeFadeTimer = null;
    }

    componentDidMount () {
        this.props.vm.on('PERIPHERAL_CONNECTED', this.handleConnected);
        this.props.vm.on('PERIPHERAL_DISCONNECTED', this.handleDisconnected);
        this.props.vm.on('PERIPHERAL_REQUEST_ERROR', this.handleRequestError);
        this.props.vm.on('PERIPHERAL_CONNECTION_LOST_ERROR', this.handleConnectionLost);
        this.props.vm.on('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.runtime.on('EXTENSION_ADDED', this.handleExtensionAdded);
        document.addEventListener('mousedown', this.handleOutsideClick);
        this.updateVisibility();
    }

    componentWillUnmount () {
        this.clearDisconnectNoticeTimers();
        this.props.vm.removeListener('PERIPHERAL_CONNECTED', this.handleConnected);
        this.props.vm.removeListener('PERIPHERAL_DISCONNECTED', this.handleDisconnected);
        this.props.vm.removeListener('PERIPHERAL_REQUEST_ERROR', this.handleRequestError);
        this.props.vm.removeListener('PERIPHERAL_CONNECTION_LOST_ERROR', this.handleConnectionLost);
        this.props.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.runtime.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        document.removeEventListener('mousedown', this.handleOutsideClick);
    }

    updateVisibility () {
        const visible = this.props.vm.extensionManager.isExtensionLoaded('kitrobotica');
        const connected = visible && this.props.vm.getPeripheralIsConnected('kitrobotica');
        this.connectionActive = connected;
        this.disconnectPendingLoss = false;
        this.setState({
            connected,
            ready: visible,
            visible
        });
    }

    handleExtensionAdded (categoryInfo) {
        if (categoryInfo.id === 'kitrobotica') {
            this.setState({ready: true, visible: true});
        } else if (this.props.vm.extensionManager.isExtensionLoaded('kitrobotica')) {
            this.updateVisibility();
        }
    }

    handleConnected () {
        this.connectionActive = true;
        this.disconnectPendingLoss = false;
        this.disconnectNoticeDismissed = false;
        this.disconnectNoticeFadeReady = false;
        this.disconnectNoticeHovered = false;
        this.disconnectNoticeFocused = false;
        this.clearDisconnectNoticeTimers();
        this.setState({
            connected: true,
            disconnectNoticeVisible: false,
            disconnectNoticeFaded: false,
            error: null,
            state: 'connected'
        });
    }

    handleDisconnected () {
        if (this.connectionActive) {
            this.connectionActive = false;
            this.disconnectPendingLoss = true;
        }
        this.setState({connected: false, state: 'disconnected'});
    }

    handleRequestError (error) {
        this.setState({
            connected: false,
            error: error && error.message ? error.message : 'Não foi possível conectar ao kit.',
            state: 'disconnected'
        });
        window.setTimeout(() => this.setState({error: null}), 4000);
    }

    handleConnectionLost () {
        const hadConnectedTransition = this.connectionActive || this.disconnectPendingLoss;
        this.connectionActive = false;
        this.disconnectPendingLoss = false;
        this.setState({connected: false, state: 'disconnected'});
        if (hadConnectedTransition) this.showDisconnectNotice();
    }

    clearDisconnectNoticeTimers () {
        if (this.disconnectNoticeTimer) window.clearTimeout(this.disconnectNoticeTimer);
        if (this.disconnectNoticeFadeTimer) window.clearTimeout(this.disconnectNoticeFadeTimer);
        this.disconnectNoticeTimer = null;
        this.disconnectNoticeFadeTimer = null;
    }

    showDisconnectNotice () {
        if (this.disconnectNoticeDismissed || this.state.disconnectNoticeVisible) return;
        this.disconnectNoticeFadeReady = false;
        this.setState({disconnectNoticeVisible: true, disconnectNoticeFaded: false});
        this.disconnectNoticeTimer = window.setTimeout(() => {
            this.disconnectNoticeFadeReady = true;
            if (!this.disconnectNoticeHovered && !this.disconnectNoticeFocused && !this.disconnectNoticeDismissed) {
                this.setState({disconnectNoticeFaded: true});
            }
        }, 6000);
    }

    scheduleDisconnectNoticeFade () {
        if (!this.disconnectNoticeFadeReady || this.disconnectNoticeHovered || this.disconnectNoticeFocused) return;
        if (this.disconnectNoticeFadeTimer) window.clearTimeout(this.disconnectNoticeFadeTimer);
        this.disconnectNoticeFadeTimer = window.setTimeout(() => {
            if (!this.disconnectNoticeHovered && !this.disconnectNoticeFocused && !this.disconnectNoticeDismissed) {
                this.setState({disconnectNoticeFaded: true});
            }
        }, 1000);
    }

    emphasizeDisconnectNotice () {
        if (this.disconnectNoticeFadeTimer) window.clearTimeout(this.disconnectNoticeFadeTimer);
        this.disconnectNoticeFadeTimer = null;
        this.setState({disconnectNoticeFaded: false});
    }

    handleNoticeMouseEnter () {
        this.disconnectNoticeHovered = true;
        this.emphasizeDisconnectNotice();
    }

    handleNoticeMouseLeave () {
        this.disconnectNoticeHovered = false;
        this.scheduleDisconnectNoticeFade();
    }

    handleNoticeFocus () {
        this.disconnectNoticeFocused = true;
        this.emphasizeDisconnectNotice();
    }

    handleNoticeBlur (event) {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        this.disconnectNoticeFocused = false;
        this.scheduleDisconnectNoticeFade();
    }

    handleDismissDisconnectNotice () {
        this.disconnectNoticeDismissed = true;
        this.clearDisconnectNoticeTimers();
        this.setState({disconnectNoticeVisible: false});
    }

    handleButtonClick () {
        if (this.state.connected) return;
        this.handleConnect();
    }

    handleConnectedClick () {
        this.setState({popoverOpen: !this.state.popoverOpen});
    }

    handleConnect () {
        this.setState({error: null, state: 'connecting'});
        this.props.vm.connectPeripheral('kitrobotica', 'web-bluetooth');
    }

    handleReconnectClick () {
        this.setState({error: null, state: 'connecting'});
        const extension = this.props.vm.runtime.peripheralExtensions.kitrobotica;
        if (extension && typeof extension.connect === 'function') {
            extension.connect();
        }
    }

    handleDisconnect () {
        this.props.vm.disconnectPeripheral('kitrobotica');
    }

    handleOutsideClick (event) {
        if (this.popover && !this.popover.contains(event.target)) {
            this.setState({popoverOpen: false});
        }
    }

    setPopoverRef (element) {
        this.popover = element;
    }

    render () {
        const state = this.state.connected ? 'connected' : this.state.state;
        const label = this.state.connected ?
            'Kit conectado.' :
            state === 'connecting' ? 'Procurando o kit...' : 'Kit desconectado. Clique para conectar.';
        const extension = this.props.vm.runtime.peripheralExtensions.kitrobotica;
        const deviceName = extension && extension.getDeviceName ? extension.getDeviceName() : 'TUDAO_MASTER';
        if (!this.state.visible) return null;

        return (
            <div className={styles.container}>
                <button
                    aria-label={label}
                    className={styles.button}
                    disabled={!this.state.ready}
                    onClick={this.state.connected ? this.handleConnectedClick : this.handleButtonClick}
                    title={label}
                    type="button"
                >
                    <KitIcon state={state} />
                    {this.state.connected && <span className={styles.connectedText}>Conectado</span>}
                </button>
                {this.state.connected && this.state.popoverOpen && (
                    <div
                        className={styles.popover}
                        ref={this.setPopoverRef}
                    >
                        <p>Dispositivo: {deviceName}</p>
                        <button
                            className={styles.action}
                            onClick={this.handleDisconnect}
                            type="button"
                        >
                            Desconectar
                        </button>
                    </div>
                )}
                {this.state.disconnectNoticeVisible && (
                    <div
                        aria-live="polite"
                        className={`${styles.disconnectNotice} ${this.state.disconnectNoticeFaded ? styles.disconnectNoticeFaded : ''}`}
                        onBlurCapture={this.handleNoticeBlur}
                        onFocusCapture={this.handleNoticeFocus}
                        onMouseEnter={this.handleNoticeMouseEnter}
                        onMouseLeave={this.handleNoticeMouseLeave}
                        role="status"
                    >
                        <span className={styles.disconnectNoticeText}>
                            O BlocosLab perdeu a conexão com o Kit Robótica.
                        </span>
                        <button
                            className={styles.disconnectNoticeReconnect}
                            onClick={this.handleReconnectClick}
                            type="button"
                        >
                            Reconectar
                        </button>
                        <button
                            aria-label="Fechar aviso de desconexão"
                            className={styles.disconnectNoticeClose}
                            onClick={this.handleDismissDisconnectNotice}
                            type="button"
                        >
                            ×
                        </button>
                    </div>
                )}
                {this.state.error && <span className={styles.error}>{this.state.error}</span>}
            </div>
        );
    }
}

KitRoboticaButton.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default KitRoboticaButton;
