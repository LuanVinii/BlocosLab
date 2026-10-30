/* eslint-disable no-console */

const KIT_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const KIT_INPUT_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const KIT_OUTPUT_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const bytesToHex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(' ');

const createBleKit = ({onDisconnected} = {}) => {
    let device = null;
    let server = null;
    let service = null;
    let writeCharacteristic = null;
    let notifyCharacteristic = null;
    let writeQueue = Promise.resolve();
    const listeners = new Set();

    const handleNotification = event => {
        const value = event.target.value;
        const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        console.info('[Kit Robótica] notificação:', bytesToHex(bytes));
        listeners.forEach(listener => listener(bytes));
    };

    const disconnect = unexpected => {
        if (notifyCharacteristic) {
            notifyCharacteristic.removeEventListener('characteristicvaluechanged', handleNotification);
        }
        device = null;
        server = null;
        service = null;
        writeCharacteristic = null;
        notifyCharacteristic = null;
        console.info('[Kit Robótica] desconectado do kit.');
        if (onDisconnected) onDisconnected(unexpected);
    };

    const conectar = async () => {
        if (!navigator.bluetooth) {
            throw new Error('Web Bluetooth não está disponível neste navegador.');
        }

        device = await navigator.bluetooth.requestDevice({
            filters: [
                {services: [KIT_SERVICE_UUID]},
                {namePrefix: 'TUDAO_MASTER'},
                {namePrefix: 'Nordic_TUDAO'}
            ],
            optionalServices: [KIT_SERVICE_UUID]
        });
        device.addEventListener('gattserverdisconnected', () => disconnect(true));
        server = await device.gatt.connect();
        service = await server.getPrimaryService(KIT_SERVICE_UUID);
        writeCharacteristic = await service.getCharacteristic(KIT_INPUT_UUID);
        notifyCharacteristic = await service.getCharacteristic(KIT_OUTPUT_UUID);

        if (notifyCharacteristic) {
            notifyCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);
            await notifyCharacteristic.startNotifications();
        }
        console.info('[Kit Robótica] conectado ao kit.');
    };

    const desconectar = () => {
        if (device && device.gatt.connected) {
            device.gatt.disconnect();
        }
        disconnect(false);
    };

    const conectado = () => Boolean(device && device.gatt && device.gatt.connected);

    const getDeviceName = () => (device && device.name ? device.name : '');

    const enviar = bytes => {
        const payload = Uint8Array.from(bytes);
        const write = async () => {
            if (!conectado() || !writeCharacteristic) {
                throw new Error('O Kit Robótica não está conectado ou não tem característica de escrita.');
            }
            if (writeCharacteristic.properties.writeWithoutResponse) {
                await writeCharacteristic.writeValueWithoutResponse(payload);
            } else {
                await writeCharacteristic.writeValueWithResponse(payload);
            }
        };
        const operation = writeQueue.then(write, write);
        writeQueue = operation.catch(() => {});
        return operation;
    };

    const adicionarOuvinte = listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    return {
        conectar,
        desconectar,
        enviar,
        conectado,
        getDeviceName,
        adicionarOuvinte
    };
};

module.exports = {
    KIT_INPUT_UUID,
    KIT_OUTPUT_UUID,
    KIT_SERVICE_UUID,
    createBleKit
};
