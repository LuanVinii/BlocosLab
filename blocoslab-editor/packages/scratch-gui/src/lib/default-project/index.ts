import projectData from './project-data';
import {TranslatorFunction} from '../../gui-config';


import robotCostume from '!arraybuffer-loader!../../../../../images/ator-principal-scratch.png?';
import blankStage from '!arraybuffer-loader!./cd21514d0531fdffb22204e0ec5ed84a.svg?';


const defaultProject = (translator?: TranslatorFunction) => {
    const projectJson = projectData(translator);
    return [{
        // TODO: This is weird - the ids are annotated by scratch-storage to be strigns, but
        //       this one is an int. May have implications on checking with `!` and in conditions,
        //       so leaving it as is for now.
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: 'cd21514d0531fdffb22204e0ec5ed84a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: new Uint8Array(blankStage)
    }, {
        id: 'f2194c30f3b685f54133d79e93bae963',
        assetType: 'ImageBitmap',
        dataFormat: 'PNG',
        data: new Uint8Array(robotCostume)
    }];
};

export default defaultProject;
