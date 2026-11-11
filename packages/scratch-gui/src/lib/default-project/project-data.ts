import projectDataMessages from './messages';
import sharedMessages from '../shared-messages';
import {MessageObject, TranslatorFunction} from '../../gui-config';

const messages = {...projectDataMessages, ...sharedMessages};

// use the default message if a translation function is not passed
const defaultTranslator = (msgObj: MessageObject) => msgObj.defaultMessage;

/**
 * Generate a localized version of the default project
 * @param {function} translateFunction a function to use for translating the default names
 * @returns {object} the project data json for the default project
 */
const projectData = (translateFunction?: TranslatorFunction): object => {
    const translator = translateFunction || defaultTranslator;
    return ({
        targets: [
            {
                isStage: true,
                name: 'Stage',
                variables: {
                    '`jEk@4|i[#Fk?(8x)AV.-my variable': [
                        translator(messages.variable),
                        0
                    ]
                },
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: '91dc085aa42f8accb73026491509ee95',
                        name: 'Laboratório Espacial',
                        md5ext: '91dc085aa42f8accb73026491509ee95.png',
                        dataFormat: 'png',
                        bitmapResolution: 2,
                        rotationCenterX: 480,
                        rotationCenterY: 360
                    }
                ],
                sounds: [],
                volume: 100
            },
            {
                isStage: false,
                name: 'Rob\u00f4',
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: 'f2194c30f3b685f54133d79e93bae963',
                        name: 'Rob\u00f4',
                        bitmapResolution: 2,
                        md5ext: 'f2194c30f3b685f54133d79e93bae963.png',
                        dataFormat: 'png',
                        rotationCenterX: 100,
                        rotationCenterY: 100
                    }
                ],
                sounds: [],
                volume: 100,
                visible: true,
                x: -180,
                y: -61,
                size: 70,
                direction: 90,
                draggable: false,
                rotationStyle: 'all around'
            }
        ],
        meta: {
            semver: '3.0.0',
            vm: '0.1.0',
            agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36' // eslint-disable-line @stylistic/max-len
        }
    });
};


export default projectData;
