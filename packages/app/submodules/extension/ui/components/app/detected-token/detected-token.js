import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { chain } from 'lodash';

import {
  addImportedTokens,
  ignoreTokens,
  setNewTokensImported,
} from '../../../store/actions';
import { getDetectedTokensInCurrentNetwork } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';

import {
  ASSET_TYPES,
  TOKEN_STANDARDS,
} from '../../../../shared/constants/transaction';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import DetectedTokenSelectionPopover from './detected-token-selection-popover/detected-token-selection-popover';
import DetectedTokenIgnoredPopover from './detected-token-ignored-popover/detected-token-ignored-popover';

const sortingBasedOnTokenSelection = (tokensDetected) => {
  return (
    chain(tokensDetected)
      // get the values
      .values()
      // create a new object with keys 'selected', 'deselected' and group the tokens
      .groupBy((token) => (token.selected ? 'selected' : 'deselected'))
      // ditch the 'selected' property and get just the tokens'
      .mapValues((group) =>
        group.map(({ token }) => {
          const { address, symbol, decimals, aggregators } = token;
          return { address, symbol, decimals, aggregators };
        }),
      )
      // Exit the chain and get the underlying value, an object.
      .value()
  );
};

const DetectedToken = ({ setShowDetectedTokens }) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);

  const [tokensListDetected, setTokensListDetected] = useState(() =>
    detectedTokens.reduce((tokenObj, token) => {
      tokenObj[token.address] = { token, selected: true };
      return tokenObj;
    }, {}),
  );
  const [showDetectedTokenIgnoredPopover, setShowDetectedTokenIgnoredPopover] =
    useState(false);
  const [partiallyIgnoreDetectedTokens, setPartiallyIgnoreDetectedTokens] =
    useState(false);

  const importSelectedTokens = async (selectedTokens) => {
    selectedTokens.forEach((importedToken) => {
      trackEvent({
        event: EVENT_NAMES.TOKEN_ADDED,
        category: EVENT.CATEGORIES.WALLET,
        sensitiveProperties: {
          token_symbol: importedToken.symbol,
          token_contract_address: importedToken.address,
          token_decimal_precision: importedToken.decimals,
          source: EVENT.SOURCE.TOKEN.DETECTED,
          token_standard: TOKEN_STANDARDS.ERC20,
          asset_type: ASSET_TYPES.TOKEN,
        },
      });
    });
    await dispatch(addImportedTokens(selectedTokens));
    const tokenSymbols = selectedTokens.map(({ symbol }) => symbol);
    dispatch(setNewTokensImported(tokenSymbols.join(', ')));
  };

  const handleClearTokensSelection = async () => {
    const { selected: selectedTokens = [], deselected: deSelectedTokens = [] } =
      sortingBasedOnTokenSelection(tokensListDetected);

    if (deSelectedTokens.length < detectedTokens.length) {
      await importSelectedTokens(selectedTokens);
    }
    const tokensDetailsList = deSelectedTokens.map(
      ({ symbol, address }) => `${symbol} - ${address}`,
    );
    trackEvent({
      event: EVENT_NAMES.TOKEN_HIDDEN,
      category: EVENT.CATEGORIES.WALLET,
      sensitiveProperties: {
        tokens: tokensDetailsList,
        location: EVENT.LOCATION.TOKEN_DETECTION,
        token_standard: TOKEN_STANDARDS.ERC20,
        asset_type: ASSET_TYPES.TOKEN,
      },
    });
    const deSelectedTokensAddresses = deSelectedTokens.map(
      ({ address }) => address,
    );
    await dispatch(
      ignoreTokens({
        tokensToIgnore: deSelectedTokensAddresses,
        dontShowLoadingIndicator: true,
      }),
    );
    setShowDetectedTokens(false);
    setPartiallyIgnoreDetectedTokens(false);
  };

  const handleTokenSelection = (token) => {
    setTokensListDetected((prevState) => ({
      ...prevState,
      [token.address]: {
        ...prevState[token.address],
        selected: !prevState[token.address].selected,
      },
    }));
  };

  const onImport = async () => {
    const { selected: selectedTokens = [] } =
      sortingBasedOnTokenSelection(tokensListDetected);

    if (selectedTokens.length < detectedTokens.length) {
      setShowDetectedTokenIgnoredPopover(true);
      setPartiallyIgnoreDetectedTokens(true);
    } else {
      await importSelectedTokens(selectedTokens);
      setShowDetectedTokens(false);
    }
  };

  const onIgnoreAll = () => {
    const newTokensListDetected = { ...tokensListDetected };
    for (const tokenAddress of Object.keys(tokensListDetected)) {
      newTokensListDetected[tokenAddress].selected = false;
    }

    setTokensListDetected(newTokensListDetected);
    setShowDetectedTokenIgnoredPopover(true);
  };

  const onCancelIgnore = () => {
    setShowDetectedTokenIgnoredPopover(false);
    setPartiallyIgnoreDetectedTokens(false);
  };

  return (
    <>
      {showDetectedTokenIgnoredPopover && (
        <DetectedTokenIgnoredPopover
          onCancelIgnore={onCancelIgnore}
          handleClearTokensSelection={handleClearTokensSelection}
          partiallyIgnoreDetectedTokens={partiallyIgnoreDetectedTokens}
        />
      )}
      {detectedTokens.length > 0 && (
        <DetectedTokenSelectionPopover
          detectedTokens={detectedTokens}
          tokensListDetected={tokensListDetected}
          handleTokenSelection={handleTokenSelection}
          onImport={onImport}
          onIgnoreAll={onIgnoreAll}
          setShowDetectedTokens={setShowDetectedTokens}
          sortingBasedOnTokenSelection={sortingBasedOnTokenSelection}
        />
      )}
    </>
  );
};

DetectedToken.propTypes = {
  setShowDetectedTokens: PropTypes.func.isRequired,
};

export default DetectedToken;
