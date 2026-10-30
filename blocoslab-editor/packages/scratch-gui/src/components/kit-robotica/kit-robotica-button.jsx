import PropTypes from 'prop-types';
import React from 'react';
import VM from '@scratch/scratch-vm';

import styles from './kit-robotica-button.css';

const KitIcon = ({state}) => (
    <svg
        aria-hidden="true"
        className={styles.icon}
        viewBox="0 0 48 32"
    >
        <rect
            className={styles.motor}
            height="20"
            rx="3"
            width="27"
            x="5"
            y="6"
        />
        <path
            className={styles.shaft}
            d="M32 16h9"
        />
        <circle
            className={styles.gear}
            cx="42"
            cy="16"
            r="5"
        />
        <circle
            className={styles.gearHole}
            cx="42"
            cy="16"
            r="2"
        />
        {state === 'connected' ? (
            <g className={styles.connectedSeal}>
                <circle
                    cx="10"
                    cy="7"
                    r="7"
                />
                <path d="m6.5 7 2.2 2.2 4.8-5" />
            </g>
        ) : state === 'connecting' ? (
            <circle
                className={styles.loadingSeal}
                cx="10"
                cy="7"
                r="6"
            />
        ) : (
            <g className={styles.disconnectedSeal}>
                <circle
                    cx="10"
                    cy="7"
                    r="7"
                />
                <path d="M10 3.5v5M10 11.5v.2" />
            </g>
        )}
    </svg>
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
        this.setState({
            connected: visible && this.props.vm.getPeripheralIsConnected('kitrobotica'),
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
        this.setState({connected: true, error: null, state: 'connected'});
    }

    handleDisconnected () {
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
        this.setState({
            connected: false,
            error: 'O kit foi desconectado.',
            state: 'disconnected'
        });
        window.setTimeout(() => this.setState({error: null}), 4000);
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
                {this.state.error && <span className={styles.error}>{this.state.error}</span>}
            </div>
        );
    }
}

KitRoboticaButton.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default KitRoboticaButton;
