import React from 'react';
import * as Sentry from '@sentry/electron/renderer';
import { getPureMessage } from '../../shared/locales/getPureMessage';

const missingSubstitutionErrors = {};

export const getMessage = (localeCode, localeMessages, key, substitutions) => {
  let phrase = getPureMessage(localeCode, localeMessages, key);
  if (phrase === null) {
    return null;
  }
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
        Sentry.captureException(error);
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
