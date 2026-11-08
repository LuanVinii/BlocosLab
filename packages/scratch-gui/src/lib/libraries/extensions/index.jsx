import kitRoboticaCoverURL from './kit-robotica/motor-capa.png';
import kitRoboticaIconURL from './kit-robotica/motor-menu-64.png';
import musicIconURL from './music/music.png';
import musicInsetIconURL from './music/music-small.svg';
import penIconURL from './pen/pen.png';
import penInsetIconURL from './pen/pen-small.svg';
import videoSensingIconURL from './videoSensing/video-sensing.png';
import videoSensingInsetIconURL from './videoSensing/video-sensing-small.svg';
import faceSensingIconURL from './faceSensing/faceSensing.png';
import faceSensingInsetIconURL from './faceSensing/faceSensing-small.svg';

export default [
    {
        name: 'Música',
        extensionId: 'music',
        iconURL: musicIconURL,
        insetIconURL: musicInsetIconURL,
        description: 'Toque instrumentos e tambores.',
        featured: true
    },
    {
        name: 'Caneta',
        extensionId: 'pen',
        iconURL: penIconURL,
        insetIconURL: penInsetIconURL,
        description: 'Desenhe com seus atores.',
        featured: true
    },
    {
        name: 'Sensor de vídeo',
        extensionId: 'videoSensing',
        iconURL: videoSensingIconURL,
        insetIconURL: videoSensingInsetIconURL,
        description: 'Detecte movimentos com a câmera.',
        featured: true
    },
    {
        name: 'Detecção facial',
        extensionId: 'faceSensing',
        iconURL: faceSensingIconURL,
        insetIconURL: faceSensingInsetIconURL,
        description: 'Detecte rostos com a câmera.',
        featured: true
    },
    {
        name: 'Kit Robótica',
        extensionId: 'kitrobotica',
        iconURL: kitRoboticaCoverURL,
        insetIconURL: kitRoboticaIconURL,
        description: 'Controle o kit por Bluetooth.',
        bluetoothRequired: true,
        featured: true
    }
];
