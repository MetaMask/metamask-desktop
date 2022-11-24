import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { getAddressBookEntryOrAccountName } from '../../selectors';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import {
  isValidHexAddress,
  isBurnAddress,
} from '../../../shared/modules/hexstring-utils';

import {
  ABOUT_US_ROUTE,
  ADVANCED_ROUTE,
  ALERTS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  GENERAL_ROUTE,
  NETWORKS_FORM_ROUTE,
  NETWORKS_ROUTE,
  SECURITY_ROUTE,
  SETTINGS_ROUTE,
  EXPERIMENTAL_ROUTE,
  ADD_NETWORK_ROUTE,
  SNAPS_LIST_ROUTE,
  SNAPS_VIEW_ROUTE,
  ADD_POPULAR_CUSTOM_NETWORK,
} from '../../helpers/constants/routes';
import Settings from './settings.component';

const ROUTES_TO_I18N_KEYS = {
  [ABOUT_US_ROUTE]: 'about',
  [ADD_NETWORK_ROUTE]: 'networks',
  [ADD_POPULAR_CUSTOM_NETWORK]: 'addNetwork',
  [ADVANCED_ROUTE]: 'advanced',
  [ALERTS_ROUTE]: 'alerts',
  [CONTACT_ADD_ROUTE]: 'newContact',
  [CONTACT_EDIT_ROUTE]: 'editContact',
  [CONTACT_LIST_ROUTE]: 'contacts',
  [CONTACT_VIEW_ROUTE]: 'viewContact',
  [EXPERIMENTAL_ROUTE]: 'experimental',
  [GENERAL_ROUTE]: 'general',
  [NETWORKS_FORM_ROUTE]: 'networks',
  [NETWORKS_ROUTE]: 'networks',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
  [SNAPS_LIST_ROUTE]: 'snaps',
  [SNAPS_VIEW_ROUTE]: 'snaps',
};

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { pathname } = location;
  const {
    metamask: { conversionDate },
  } = state;

  const pathNameTail = pathname.match(/[^/]+$/u)[0];
  const isAddressEntryPage = pathNameTail.includes('0x');
  const isSnapViewPage = Boolean(pathname.match(SNAPS_VIEW_ROUTE));
  const isAddContactPage = Boolean(pathname.match(CONTACT_ADD_ROUTE));
  const isEditContactPage = Boolean(pathname.match(CONTACT_EDIT_ROUTE));
  const isNetworksFormPage =
    Boolean(pathname.match(NETWORKS_FORM_ROUTE)) ||
    Boolean(pathname.match(ADD_NETWORK_ROUTE));
  const addNewNetwork = Boolean(pathname.match(ADD_NETWORK_ROUTE));
  const isAddPopularCustomNetwork = Boolean(
    pathname.match(ADD_POPULAR_CUSTOM_NETWORK),
  );

  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const pathnameI18nKey = ROUTES_TO_I18N_KEYS[pathname];

  let backRoute = SETTINGS_ROUTE;
  if (isEditContactPage) {
    backRoute = `${CONTACT_VIEW_ROUTE}/${pathNameTail}`;
  } else if (isAddressEntryPage || isAddContactPage) {
    backRoute = CONTACT_LIST_ROUTE;
  } else if (isNetworksFormPage) {
    backRoute = NETWORKS_ROUTE;
  } else if (isSnapViewPage) {
    backRoute = SNAPS_LIST_ROUTE;
  } else if (isAddPopularCustomNetwork) {
    backRoute = NETWORKS_ROUTE;
  }

  let initialBreadCrumbRoute;
  let initialBreadCrumbKey;

  const addressName = getAddressBookEntryOrAccountName(
    state,
    !isBurnAddress(pathNameTail) &&
      isValidHexAddress(pathNameTail, { mixedCaseUseChecksum: true })
      ? pathNameTail
      : '',
  );

  return {
    addNewNetwork,
    addressName,
    backRoute,
    conversionDate,
    currentPath: pathname,
    initialBreadCrumbKey,
    initialBreadCrumbRoute,
    isAddressEntryPage,
    isPopup,
    isSnapViewPage,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    pathnameI18nKey,
  };
};

export default compose(withRouter, connect(mapStateToProps))(Settings);
