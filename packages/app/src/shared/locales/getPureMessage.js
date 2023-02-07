const warned = {};
const missingMessageErrors = {};

export const getPureMessage = (localeCode, localeMessages, key, logger) => {
  if (!localeMessages) {
    return null;
  }

  if (!localeMessages[key]) {
    if (localeCode === 'en') {
      if (!missingMessageErrors[key]) {
        missingMessageErrors[key] = new Error(
          `Unable to find value of key "${key}" for locale "${localeCode}"`,
        );
        // Sentry.captureException(missingMessageErrors[key]);
        logger.error(missingMessageErrors[key]);
        if (process.env.IN_TEST) {
          throw missingMessageErrors[key];
        }
      }
    } else if (!warned[localeCode] || !warned[localeCode][key]) {
      if (!warned[localeCode]) {
        warned[localeCode] = {};
      }
      warned[localeCode][key] = true;
      logger.warn(
        `Translator - Unable to find value of key "${key}" for locale "${localeCode}"`,
      );
    }
    return null;
  }
  const entry = localeMessages[key];
  return entry.message;
};
