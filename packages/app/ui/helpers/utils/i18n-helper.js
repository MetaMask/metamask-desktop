import React from 'react';
// import * as Sentry from '@sentry/browser';

const warned = {};
const missingMessageErrors = {};
const missingSubstitutionErrors = {};

// Keep same getMessage function as in the extension
export const getMessage = (localeCode, localeMessages, key, substitutions) => {
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
        __electronLog.error(missingMessageErrors[key]);
        if (process.env.IN_TEST) {
          throw missingMessageErrors[key];
        }
      }
    } else if (!warned[localeCode] || !warned[localeCode][key]) {
      if (!warned[localeCode]) {
        warned[localeCode] = {};
      }
      warned[localeCode][key] = true;
      __electronLog.warn(
        `Translator - Unable to find value of key "${key}" for locale "${localeCode}"`,
      );
    }
    return null;
  }
  const entry = localeMessages[key];
  let phrase = entry.message;

  const hasSubstitutions = Boolean(substitutions && substitutions.length);
  const hasReactSubstitutions =
    hasSubstitutions &&
    substitutions.some(
      (element) =>
        element !== null &&
        (typeof element === 'function' || typeof element === 'object'),
    );

  // perform substitutions
  if (hasSubstitutions) {
    const parts = phrase.split(/(\$\d)/gu);

    const substitutedParts = parts.map((part) => {
      const subMatch = part.match(/\$(\d)/u);
      if (!subMatch) {
        return part;
      }
      const substituteIndex = Number(subMatch[1]) - 1;
      if (
        (substitutions[substituteIndex] === null ||
          substitutions[substituteIndex] === undefined) &&
        !missingSubstitutionErrors[localeCode]?.[key]
      ) {
        if (!missingSubstitutionErrors[localeCode]) {
          missingSubstitutionErrors[localeCode] = {};
        }
        missingSubstitutionErrors[localeCode][key] = true;
        const error = new Error(
          `Insufficient number of substitutions for key "${key}" with locale "${localeCode}"`,
        );
        __electronLog.error(error);
        // Sentry.captureException(error);
      }
      return substitutions[substituteIndex];
    });

    phrase = hasReactSubstitutions ? (
      <span> {substitutedParts} </span>
    ) : (
      substitutedParts.join('')
    );
  }

  return phrase;
};
