/* eslint-disable no-console */

const {createBleKit} = require('./ble-kit');
const Cast = require('../../util/cast');
const BlockType = {
    BOOLEAN: 'Boolean',
    COMMAND: 'command',
    HAT: 'hat',
    REPORTER: 'reporter'
};
const MotorRotations = [
    {text: 'horário', value: 'clockwise'},
    {text: 'anti-horário', value: 'anticlockwise'}
];
const DistanceSensors = [
    {text: '1', value: '1'},
    {text: '2', value: '2'}
];
const ComparisonOperators = ['<', '>'];
const MotorPorts = [
    {text: 'todas as portas', value: 'all'},
    {text: 'porta 1', value: '1'},
    {text: 'porta 2', value: '2'},
    {text: 'porta 3', value: '3'}
];
const StopTargets = [
    {text: 'da porta 1', value: '1'},
    {text: 'da porta 2', value: '2'},
    {text: 'da porta 3', value: '3'},
    {text: 'de todas as portas', value: 'all'}
];
const Lights = [
    {text: 'todas as luzes', value: 'all'},
    {text: 'luz 1', value: '1'},
    {text: 'luz 2', value: '2'}
];
const LightColors = [
    {text: 'desligada', value: '0'},
    {text: 'vermelha', value: '1'},
    {text: 'laranja', value: '2'},
    {text: 'amarela', value: '3'},
    {text: 'verde', value: '4'},
    {text: 'ciano', value: '5'},
    {text: 'azul', value: '6'},
    {text: 'roxa', value: '7'}
];
const TiltDirections = [
    {text: 'para frente', value: 'front'},
    {text: 'para trás', value: 'back'},
    {text: 'para a esquerda', value: 'left'},
    {text: 'para a direita', value: 'right'},
    {text: 'em qualquer direção', value: 'any'}
];
const LineTrackerStates = [
    {text: 'ligado', value: '0'},
    {text: 'desligado', value: '1'}
];
const MOTOR_FRAME_HEADER = [0xFF, 0xFE, 0x09, 0x01, 0x02];
const MOTOR_FRAME_FOOTER = [0xFD, 0xFC];
const TILT_THRESHOLD = 15;

/**
 * Web Bluetooth extension for the BlocosLab robotics kit.
 *
 * To add a block: add its metadata to getInfo().blocks, implement the method
 * named by its opcode, and keep any Bluetooth protocol details in that method.
 */
class KitRobotica {
    constructor (runtime) {
        this.runtime = runtime;
        this.extensionId = 'kitrobotica';
        this.motorSpeeds = [0, 0, 0];
        this.sensorDistances = [null, null];
        this.gyro = {x: null, y: null, acceleration: null};
        this.commandFrame = Uint8Array.from([
            ...MOTOR_FRAME_HEADER, 0, 0, 0, 0, 0, 0, 0, ...MOTOR_FRAME_FOOTER
        ]);
        this.bleKit = createBleKit({
            onDisconnected: unexpected => {
                this.sensorDistances = [null, null];
                this.gyro = {x: null, y: null, acceleration: null};
                this.runtime.emit(this.runtime.constructor.PERIPHERAL_DISCONNECTED);
                if (unexpected) {
                    this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR, {
                        extensionId: this.extensionId
                    });
                }
            }
        });
        this.bleKit.adicionarOuvinte(bytes => this._handleSensorNotification(bytes));
        this.runtime.on('PROJECT_STOP_ALL', () => {
            if (this.isConnected()) {
                this.stopMotor({PORT: 'all'}).catch(error => {
                    console.error('[Kit Robótica] falha ao parar as portas:', error);
                });
            }
        });
        this.runtime.registerPeripheralExtension(this.extensionId, this);
    }

    getInfo () {
        return {
            id: 'kitrobotica',
            name: 'Kit Robótica',
            showStatusButton: false,
            color1: '#74C7F4',
            color2: '#42A5D5',
            color3: '#2583B4',
            blocks: [
                {
                    opcode: 'setMotorSpeed',
                    blockType: BlockType.COMMAND,
                    text: 'defina a [PORT] para velocidade [SPEED] no sentido [ROTATION]',
                    arguments: {
                        PORT: {type: 'string', menu: 'motorPort', defaultValue: '1'},
                        SPEED: {type: 'number', defaultValue: 6},
                        ROTATION: {type: 'string', menu: 'motorRotation', defaultValue: 'clockwise'}
                    }
                },
                {
                    opcode: 'stopMotor',
                    blockType: BlockType.COMMAND,
                    text: 'pare o motor [PORT]',
                    arguments: {PORT: {type: 'string', menu: 'stopTarget', defaultValue: '1'}}
                },
                '---',
                {
                    opcode: 'getDistanceSensor1',
                    blockType: BlockType.REPORTER,
                    text: 'distância do sensor 1'
                },
                {
                    opcode: 'getDistanceSensor2',
                    blockType: BlockType.REPORTER,
                    text: 'distância do sensor 2'
                },
                {
                    opcode: 'getGyroXaxisAngle',
                    blockType: BlockType.REPORTER,
                    text: 'ângulo do giroscópio no eixo X'
                },
                {
                    opcode: 'getGyroYaxisAngle',
                    blockType: BlockType.REPORTER,
                    text: 'ângulo do giroscópio no eixo Y'
                },
                {
                    opcode: 'getGyroSumAcceleration',
                    blockType: BlockType.REPORTER,
                    text: 'soma da aceleração do giroscópio'
                },
                '---',
                {
                    opcode: 'whenDistance',
                    blockType: BlockType.HAT,
                    text: 'quando a distância do sensor [SENSOR] [OP] [REFERENCE]',
                    arguments: {
                        SENSOR: {type: 'string', menu: 'distanceSensor', defaultValue: '1'},
                        OP: {type: 'string', menu: 'comparisonOperator', defaultValue: '<'},
                        REFERENCE: {type: 'number', defaultValue: 3}
                    }
                },
                {
                    opcode: 'whenTilted',
                    blockType: BlockType.HAT,
                    text: 'quando inclinado [DIRECTION]',
                    arguments: {
                        DIRECTION: {type: 'string', menu: 'tiltDirection', defaultValue: 'any'}
                    }
                },
                '---',
                {
                    opcode: 'isTilted',
                    blockType: BlockType.BOOLEAN,
                    text: 'inclinado [DIRECTION]?',
                    arguments: {
                        DIRECTION: {type: 'string', menu: 'tiltDirection', defaultValue: 'any'}
                    }
                },
                {
                    opcode: 'areLineTrackersMatchedState',
                    blockType: BlockType.BOOLEAN,
                    text: 'o sensor de linha esquerdo está [LEFT] e o direito está [RIGHT]?',
                    arguments: {
                        LEFT: {type: 'string', menu: 'lineTrackerState', defaultValue: '0'},
                        RIGHT: {type: 'string', menu: 'lineTrackerState', defaultValue: '0'}
                    }
                },
                '---',
                {
                    opcode: 'setLightHue',
                    blockType: BlockType.COMMAND,
                    text: 'defina a cor de [LIGHT] como [HUE]',
                    arguments: {
                        LIGHT: {type: 'string', menu: 'lights', defaultValue: 'all'},
                        HUE: {type: 'string', menu: 'lightColors', defaultValue: '1'}
                    }
                },
                {
                    opcode: 'turnOffLight',
                    blockType: BlockType.COMMAND,
                    text: 'desligue [LIGHT]',
                    arguments: {LIGHT: {type: 'string', menu: 'lights', defaultValue: 'all'}}
                }
            ],
            menus: {
                motorPort: {
                    acceptReporters: false,
                    items: MotorPorts
                },
                stopTarget: {
                    acceptReporters: false,
                    items: StopTargets
                },
                motorRotation: {
                    acceptReporters: false,
                    items: MotorRotations
                },
                distanceSensor: {
                    acceptReporters: false,
                    items: DistanceSensors
                },
                comparisonOperator: {
                    acceptReporters: false,
                    items: ComparisonOperators
                },
                tiltDirection: {
                    acceptReporters: false,
                    items: TiltDirections
                },
                lineTrackerState: {
                    acceptReporters: false,
                    items: LineTrackerStates
                },
                lights: {
                    acceptReporters: false,
                    items: Lights
                },
                lightColors: {
                    acceptReporters: false,
                    items: LightColors
                }
            }
        };
    }

    scan () {
        // A escolha do dispositivo é feita pela janela nativa do Chrome.
    }

    connect () {
        return this.bleKit.conectar()
            .then(() => {
                this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED);
            })
            .catch(error => {
                if (error && error.name === 'NotFoundError') {
                    this.runtime.emit(this.runtime.constructor.PERIPHERAL_DISCONNECTED);
                    return;
                }
                console.error('[Kit Robótica] falha ao conectar:', error);
                this.runtime.emit(this.runtime.constructor.PERIPHERAL_REQUEST_ERROR, error);
            });
    }

    disconnect () {
        this.bleKit.desconectar();
    }

    isConnected () {
        return this.bleKit.conectado();
    }

    getDeviceName () {
        return this.bleKit.getDeviceName();
    }

    _handleSensorNotification (bytes) {
        let sensor1Index;
        let sensor2Index;
        if (bytes.length === 11) {
            // Formato do firmware antigo, conforme o parser do Makerzoid.
            sensor1Index = 7;
            sensor2Index = 8;
        } else if (bytes.length === 19) {
            // Formato do firmware atual, conforme o parser do Makerzoid.
            sensor1Index = 6;
            sensor2Index = 7;
            if (bytes[8] < 0xFF) this.gyro.x = bytes[8] - 90;
            if (bytes[9] < 0xFF) this.gyro.y = bytes[9] - 90;
            if (bytes[10] < 0xFF) this.gyro.acceleration = bytes[10];
        } else {
            return;
        }

        [sensor1Index, sensor2Index].forEach((index, sensorIndex) => {
            const value = bytes[index];
            if (value < 0xFF) {
                this.sensorDistances[sensorIndex] = Math.min(value, 6);
            }
        });
    }

    getDistanceSensor1 () {
        return this.sensorDistances[0] === null ? 0 : this.sensorDistances[0];
    }

    getDistanceSensor2 () {
        return this.sensorDistances[1] === null ? 0 : this.sensorDistances[1];
    }

    getGyroXaxisAngle () {
        return this.gyro.x === null ? 0 : this.gyro.x;
    }

    getGyroYaxisAngle () {
        return this.gyro.y === null ? 0 : this.gyro.y;
    }

    getGyroSumAcceleration () {
        return this.gyro.acceleration === null ? 0 : this.gyro.acceleration;
    }

    _isTilted (direction) {
        const x = this.gyro.x;
        const y = this.gyro.y;
        if (x === null || y === null) return false;
        switch (direction) {
        case 'front':
            return y >= TILT_THRESHOLD;
        case 'back':
            return y <= -TILT_THRESHOLD;
        case 'left':
            return x <= -TILT_THRESHOLD;
        case 'right':
            return x >= TILT_THRESHOLD;
        case 'any':
            return Math.abs(x) >= TILT_THRESHOLD || Math.abs(y) >= TILT_THRESHOLD;
        default:
            return false;
        }
    }

    whenTilted (args) {
        return this._isTilted(args.DIRECTION);
    }

    isTilted (args) {
        return this._isTilted(args.DIRECTION);
    }

    _isLineTrackerMatchState (state, value) {
        return (state === '0' && value >= 3) || (state === '1' && value < 3);
    }

    areLineTrackersMatchedState (args) {
        const [left, right] = this.sensorDistances;
        if (left === null || right === null) return false;
        return this._isLineTrackerMatchState(args.LEFT, left) &&
            this._isLineTrackerMatchState(args.RIGHT, right);
    }

    whenDistance (args) {
        const sensorIndex = Number(args.SENSOR) - 1;
        if (!Number.isInteger(sensorIndex) || sensorIndex < 0 || sensorIndex > 1) return false;
        const distance = this.sensorDistances[sensorIndex];
        if (distance === null) return false;

        const threshold = Cast.toNumber(args.REFERENCE);
        if (args.OP === '<') return distance < threshold;
        if (args.OP === '>') return distance > threshold;
        return false;
    }

    setMotorSpeed (args) {
        const requestedSpeed = Cast.toNumber(args.SPEED);
        const magnitude = Math.min(Math.max(requestedSpeed, 0), 100);
        const signedSpeed = args.ROTATION === 'anticlockwise' ? -magnitude : magnitude;
        return this._setMotorSpeed(args.PORT, signedSpeed);
    }

    stopMotor (args) {
        if (args.PORT === 'all') {
            [1, 2, 3].forEach(port => this._updateMotorSpeed(port, 0));
            return this._sendCommandFrame();
        }
        return this._setMotorSpeed(args.PORT, 0);
    }

    _setMotorSpeed (port, speed) {
        if (port === 'all') {
            [1, 2, 3].forEach(portNumber => this._updateMotorSpeed(portNumber, speed));
        } else {
            this._updateMotorSpeed(Number(port), speed);
        }
        return this._sendCommandFrame();
    }

    _updateMotorSpeed (port, speed) {
        if (!Number.isInteger(port) || port < 1 || port > 3) return;
        this.motorSpeeds[port - 1] = speed;
        const integer = Math.trunc(speed);
        this.commandFrame[4 + port] = ((integer % 256) + 256) % 256;
    }

    _sendCommandFrame () {
        return this.bleKit.enviar(this.commandFrame);
    }

    setLightHue (args) {
        const hue = Number(args.HUE);
        const indexes = args.LIGHT === 'all' ? [8, 9] : [7 + Number(args.LIGHT)];
        indexes.forEach(index => {
            if (index === 8 || index === 9) this.commandFrame[index] = hue;
        });
        return this._sendCommandFrame();
    }

    turnOffLight (args) {
        return this.setLightHue({LIGHT: args.LIGHT, HUE: '0'});
    }
}

module.exports = KitRobotica;
