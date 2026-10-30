export const getProjectTitleFromFilename = fileInputFilename => {
    if (!fileInputFilename) return '';
    // Accept native Scratch project extensions and the BlocosLab project extension.
    const matches = fileInputFilename.match(/^(.*)\.(?:sb[23]?|bl)$/i);
    if (!matches) return '';
    return matches[1].substring(0, 100); // truncate project title to max 100 chars
};
