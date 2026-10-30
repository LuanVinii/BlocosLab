const registerKitRobotica = vm => vm.extensionManager.loadExtensionURL('kitrobotica')
    .then(() => new Promise(resolve => setTimeout(resolve, 0)));

export {registerKitRobotica};
