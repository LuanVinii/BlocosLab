/**
 * @file
 * Utility function to detect locale from a parameter on the URL.
 */

import queryString from 'query-string';

/**
 * Use a valid locale parameter from the URL, or pt-br by default.
 * @param {Array.string} supportedLocales An array of supported locale codes.
 * @returns {string} the preferred locale
 */
const detectLocale = supportedLocales => {
    let locale = 'pt-br'; // default

    const queryParams = queryString.parse(location.search);
    // Flatten potential arrays and remove falsy values
    const potentialLocales = [].concat(queryParams.locale, queryParams.lang).filter(l => l);
    if (!potentialLocales.length) {
        return locale;
    }

    const urlLocale = potentialLocales[0].toLowerCase();
    if (supportedLocales.includes(urlLocale)) {
        return urlLocale;
    }

    return locale;
};

export {
    detectLocale
};
