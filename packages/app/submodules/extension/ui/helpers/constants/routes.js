const DEFAULT_ROUTE = '/';
const UNLOCK_ROUTE = '/unlock';
const LOCK_ROUTE = '/lock';
const ASSET_ROUTE = '/asset';
const SETTINGS_ROUTE = '/settings';
const GENERAL_ROUTE = '/settings/general';
const ADVANCED_ROUTE = '/settings/advanced';
const EXPERIMENTAL_ROUTE = '/settings/experimental';
const SECURITY_ROUTE = '/settings/security';
const ABOUT_US_ROUTE = '/settings/about-us';
const ALERTS_ROUTE = '/settings/alerts';
const NETWORKS_ROUTE = '/settings/networks';
const NETWORKS_FORM_ROUTE = '/settings/networks/form';
const ADD_NETWORK_ROUTE = '/settings/networks/add-network';
const ADD_POPULAR_CUSTOM_NETWORK =
  '/settings/networks/add-popular-custom-network';
const SNAPS_LIST_ROUTE = '/settings/snaps-list';
const SNAPS_VIEW_ROUTE = '/settings/snaps-view';
const CONTACT_LIST_ROUTE = '/settings/contact-list';
const CONTACT_EDIT_ROUTE = '/settings/contact-list/edit-contact';
const CONTACT_ADD_ROUTE = '/settings/contact-list/add-contact';
const CONTACT_VIEW_ROUTE = '/settings/contact-list/view-contact';
const REVEAL_SEED_ROUTE = '/seed';
const MOBILE_SYNC_ROUTE = '/mobile-sync';
const DESKTOP_PAIRING_ROUTE = '/desktop-sync';
const RESTORE_VAULT_ROUTE = '/restore-vault';
const IMPORT_TOKEN_ROUTE = '/import-token';
const CONFIRM_IMPORT_TOKEN_ROUTE = '/confirm-import-token';
const CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE = '/confirm-add-suggested-token';
const NEW_ACCOUNT_ROUTE = '/new-account';
const IMPORT_ACCOUNT_ROUTE = '/new-account/import';
const CONNECT_HARDWARE_ROUTE = '/new-account/connect';
const SEND_ROUTE = '/send';
const TOKEN_DETAILS = '/token-details';
const CONNECT_ROUTE = '/connect';
const CONNECT_CONFIRM_PERMISSIONS_ROUTE = '/confirm-permissions';
///: BEGIN:ONLY_INCLUDE_IN(flask,desktopextension,desktopapp)
const CONNECT_SNAP_INSTALL_ROUTE = '/snap-install';
const CONNECT_SNAP_UPDATE_ROUTE = '/snap-update';
const NOTIFICATIONS_ROUTE = '/notifications';
///: END:ONLY_INCLUDE_IN
const CONNECTED_ROUTE = '/connected';
const CONNECTED_ACCOUNTS_ROUTE = '/connected/accounts';
const SWAPS_ROUTE = '/swaps';
const BUILD_QUOTE_ROUTE = '/swaps/build-quote';
const VIEW_QUOTE_ROUTE = '/swaps/view-quote';
const LOADING_QUOTES_ROUTE = '/swaps/loading-quotes';
const AWAITING_SIGNATURES_ROUTE = '/swaps/awaiting-signatures';
const SMART_TRANSACTION_STATUS_ROUTE = '/swaps/smart-transaction-status';
const AWAITING_SWAP_ROUTE = '/swaps/awaiting-swap';
const SWAPS_ERROR_ROUTE = '/swaps/swaps-error';
const SWAPS_MAINTENANCE_ROUTE = '/swaps/maintenance';
const ADD_COLLECTIBLE_ROUTE = '/add-collectible';

const INITIALIZE_ROUTE = '/initialize';
const INITIALIZE_WELCOME_ROUTE = '/initialize/welcome';
const INITIALIZE_UNLOCK_ROUTE = '/initialize/unlock';
const INITIALIZE_CREATE_PASSWORD_ROUTE = '/initialize/create-password';
const INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE =
  '/initialize/create-password/import-with-seed-phrase';
const INITIALIZE_SELECT_ACTION_ROUTE = '/initialize/select-action';
const INITIALIZE_SEED_PHRASE_ROUTE = '/initialize/seed-phrase';
const INITIALIZE_BACKUP_SEED_PHRASE_ROUTE = '/initialize/backup-seed-phrase';
const INITIALIZE_SEED_PHRASE_INTRO_ROUTE = '/initialize/seed-phrase-intro';
const INITIALIZE_END_OF_FLOW_ROUTE = '/initialize/end-of-flow';
const INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE = '/initialize/seed-phrase/confirm';
const INITIALIZE_METAMETRICS_OPT_IN_ROUTE = '/initialize/metametrics-opt-in';

const ONBOARDING_ROUTE = '/onboarding';
const ONBOARDING_REVIEW_SRP_ROUTE = '/onboarding/review-recovery-phrase';
const ONBOARDING_CONFIRM_SRP_ROUTE = '/onboarding/confirm-recovery-phrase';
const ONBOARDING_CREATE_PASSWORD_ROUTE = '/onboarding/create-password';
const ONBOARDING_COMPLETION_ROUTE = '/onboarding/completion';
const ONBOARDING_UNLOCK_ROUTE = '/onboarding/unlock';
const ONBOARDING_HELP_US_IMPROVE_ROUTE = '/onboarding/help-us-improve';
const ONBOARDING_IMPORT_WITH_SRP_ROUTE =
  '/onboarding/import-with-recovery-phrase';
const ONBOARDING_IMPORT_MOBILE_ROUTE = '/onboarding/import-mobile';
const ONBOARDING_SECURE_YOUR_WALLET_ROUTE = '/onboarding/secure-your-wallet';
const ONBOARDING_PRIVACY_SETTINGS_ROUTE = '/onboarding/privacy-settings';
const ONBOARDING_PIN_EXTENSION_ROUTE = '/onboarding/pin-extension';
const ONBOARDING_WELCOME_ROUTE = '/onboarding/welcome';
const ONBOARDING_METAMETRICS = '/onboarding/metametrics';

///: BEGIN:ONLY_INCLUDE_IN(flask,desktopextension,desktopapp)
const INITIALIZE_EXPERIMENTAL_AREA = '/initialize/experimental-area';
const ONBOARDING_EXPERIMENTAL_AREA = '/onboarding/experimental-area';
///: END:ONLY_INCLUDE_IN

const CONFIRM_TRANSACTION_ROUTE = '/confirm-transaction';
const CONFIRM_SEND_ETHER_PATH = '/send-ether';
const CONFIRM_SEND_TOKEN_PATH = '/send-token';
const CONFIRM_DEPLOY_CONTRACT_PATH = '/deploy-contract';
const CONFIRM_APPROVE_PATH = '/approve';
const CONFIRM_SET_APPROVAL_FOR_ALL_PATH = '/set-approval-for-all';
const CONFIRM_TRANSFER_FROM_PATH = '/transfer-from';
const CONFIRM_SAFE_TRANSFER_FROM_PATH = '/safe-transfer-from';
const CONFIRM_TOKEN_METHOD_PATH = '/token-method';
const SIGNATURE_REQUEST_PATH = '/signature-request';
const DECRYPT_MESSAGE_REQUEST_PATH = '/decrypt-message-request';
const ENCRYPTION_PUBLIC_KEY_REQUEST_PATH = '/encryption-public-key-request';
const CONFIRMATION_V_NEXT_ROUTE = '/confirmation';
///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
const DESKTOP_ERROR_ROUTE = '/desktop/error';
///: END:ONLY_INCLUDE_IN

// Used to pull a convenient name for analytics tracking events. The key must
// be react-router ready path, and can include params such as :id for popup windows
const PATH_NAME_MAP = {
  [DEFAULT_ROUTE]: 'Home',
  [UNLOCK_ROUTE]: 'Unlock Page',
  [LOCK_ROUTE]: 'Lock Page',
  [`${ASSET_ROUTE}/:asset/:id`]: `Asset Page`,
  [SETTINGS_ROUTE]: 'Settings Page',
  [GENERAL_ROUTE]: 'General Settings Page',
  [ADVANCED_ROUTE]: 'Advanced Settings Page',
  [EXPERIMENTAL_ROUTE]: 'Experimental Settings Page',
  [SECURITY_ROUTE]: 'Security Settings Page',
  [ABOUT_US_ROUTE]: 'About Us Page',
  [ALERTS_ROUTE]: 'Alerts Settings Page',
  [NETWORKS_ROUTE]: 'Network Settings Page',
  [NETWORKS_FORM_ROUTE]: 'Network Settings Page Form',
  [ADD_NETWORK_ROUTE]: 'Add Network From Settings Page Form',
  [ADD_POPULAR_CUSTOM_NETWORK]:
    'Add Network From A List Of Popular Custom Networks',
  [CONTACT_LIST_ROUTE]: 'Contact List Settings Page',
  [`${CONTACT_EDIT_ROUTE}/:address`]: 'Edit Contact Settings Page',
  [CONTACT_ADD_ROUTE]: 'Add Contact Settings Page',
  [`${CONTACT_VIEW_ROUTE}/:address`]: 'View Contact Settings Page',
  [REVEAL_SEED_ROUTE]: 'Reveal Secret Recovery Phrase Page',
  [MOBILE_SYNC_ROUTE]: 'Sync With Mobile Page',
  [DESKTOP_PAIRING_ROUTE]: 'Enable Desktop App',
  [RESTORE_VAULT_ROUTE]: 'Restore Vault Page',
  [IMPORT_TOKEN_ROUTE]: 'Import Token Page',
  [CONFIRM_IMPORT_TOKEN_ROUTE]: 'Confirm Import Token Page',
  [CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE]: 'Confirm Add Suggested Token Page',
  [NEW_ACCOUNT_ROUTE]: 'New Account Page',
  [IMPORT_ACCOUNT_ROUTE]: 'Import Account Page',
  [CONNECT_HARDWARE_ROUTE]: 'Connect Hardware Wallet Page',
  [SEND_ROUTE]: 'Send Page',
  [`${TOKEN_DETAILS}/:address`]: 'Token Details Page',
  [`${CONNECT_ROUTE}/:id`]: 'Connect To Site Confirmation Page',
  [`${CONNECT_ROUTE}/:id${CONNECT_CONFIRM_PERMISSIONS_ROUTE}`]:
    'Grant Connected Site Permissions Confirmation Page',
  [CONNECTED_ROUTE]: 'Sites Connected To This Account Page',
  [CONNECTED_ACCOUNTS_ROUTE]: 'Accounts Connected To This Site Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id`]: 'Confirmation Root Page',
  [CONFIRM_TRANSACTION_ROUTE]: 'Confirmation Root Page',
  // TODO: rename when this is the only confirmation page
  [CONFIRMATION_V_NEXT_ROUTE]: 'New Confirmation Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_TOKEN_METHOD_PATH}`]:
    'Confirm Token Method Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SEND_ETHER_PATH}`]:
    'Confirm Send Ether Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SEND_TOKEN_PATH}`]:
    'Confirm Send Token Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_DEPLOY_CONTRACT_PATH}`]:
    'Confirm Deploy Contract Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_APPROVE_PATH}`]:
    'Confirm Approve Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SET_APPROVAL_FOR_ALL_PATH}`]:
    'Confirm Set Approval For All Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_TRANSFER_FROM_PATH}`]:
    'Confirm Transfer From Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SAFE_TRANSFER_FROM_PATH}`]:
    'Confirm Safe Transfer From Transaction Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${SIGNATURE_REQUEST_PATH}`]:
    'Signature Request Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${DECRYPT_MESSAGE_REQUEST_PATH}`]:
    'Decrypt Message Request Page',
  [`${CONFIRM_TRANSACTION_ROUTE}/:id${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`]:
    'Encryption Public Key Request Page',
  [INITIALIZE_ROUTE]: 'Initialization Page',
  [INITIALIZE_WELCOME_ROUTE]: 'Install Welcome Page',
  [INITIALIZE_UNLOCK_ROUTE]: 'Initialization Unlock page',
  [INITIALIZE_CREATE_PASSWORD_ROUTE]: 'Initialization Create Password Page',
  [INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE]:
    'Initialization Import Account With Secret Recovery Phrase Page',
  [INITIALIZE_SELECT_ACTION_ROUTE]:
    'Initialization Choose Restore or New Account Page',
  [INITIALIZE_SEED_PHRASE_ROUTE]: 'Initialization Secret Recovery Phrase Page',
  [INITIALIZE_BACKUP_SEED_PHRASE_ROUTE]:
    'Initialization Backup Secret Recovery Phrase Page',
  [INITIALIZE_SEED_PHRASE_INTRO_ROUTE]:
    'Initialization Secret Recovery Phrase Intro Page',
  [INITIALIZE_END_OF_FLOW_ROUTE]: 'End of Initialization Page',
  [INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE]:
    'Initialization Confirm Secret Recovery Phrase Page',
  [INITIALIZE_METAMETRICS_OPT_IN_ROUTE]: 'MetaMetrics Opt In Page',
  [BUILD_QUOTE_ROUTE]: 'Swaps Build Quote Page',
  [VIEW_QUOTE_ROUTE]: 'Swaps View Quotes Page',
  [LOADING_QUOTES_ROUTE]: 'Swaps Loading Quotes Page',
  [AWAITING_SWAP_ROUTE]: 'Swaps Awaiting Swaps Page',
  [SWAPS_ERROR_ROUTE]: 'Swaps Error Page',
};

export {
  DEFAULT_ROUTE,
  ALERTS_ROUTE,
  ASSET_ROUTE,
  UNLOCK_ROUTE,
  LOCK_ROUTE,
  SETTINGS_ROUTE,
  REVEAL_SEED_ROUTE,
  MOBILE_SYNC_ROUTE,
  DESKTOP_PAIRING_ROUTE,
  RESTORE_VAULT_ROUTE,
  IMPORT_TOKEN_ROUTE,
  CONFIRM_IMPORT_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  NEW_ACCOUNT_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
  SEND_ROUTE,
  TOKEN_DETAILS,
  INITIALIZE_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  INITIALIZE_SELECT_ACTION_ROUTE,
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_SEND_TOKEN_PATH,
  CONFIRM_DEPLOY_CONTRACT_PATH,
  CONFIRM_APPROVE_PATH,
  CONFIRM_SET_APPROVAL_FOR_ALL_PATH,
  CONFIRM_TRANSFER_FROM_PATH,
  CONFIRM_SAFE_TRANSFER_FROM_PATH,
  CONFIRM_TOKEN_METHOD_PATH,
  SIGNATURE_REQUEST_PATH,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
  CONFIRMATION_V_NEXT_ROUTE,
  INITIALIZE_METAMETRICS_OPT_IN_ROUTE,
  ADVANCED_ROUTE,
  EXPERIMENTAL_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  SNAPS_LIST_ROUTE,
  SNAPS_VIEW_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_VIEW_ROUTE,
  NETWORKS_ROUTE,
  NETWORKS_FORM_ROUTE,
  ADD_NETWORK_ROUTE,
  ADD_POPULAR_CUSTOM_NETWORK,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  INITIALIZE_SEED_PHRASE_INTRO_ROUTE,
  CONNECT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask,desktopextension,desktopapp)
  CONNECT_SNAP_INSTALL_ROUTE,
  CONNECT_SNAP_UPDATE_ROUTE,
  NOTIFICATIONS_ROUTE,
  ///: END:ONLY_INCLUDE_IN
  CONNECTED_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
  PATH_NAME_MAP,
  SWAPS_ROUTE,
  BUILD_QUOTE_ROUTE,
  VIEW_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
  AWAITING_SWAP_ROUTE,
  AWAITING_SIGNATURES_ROUTE,
  SWAPS_ERROR_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  SMART_TRANSACTION_STATUS_ROUTE,
  ADD_COLLECTIBLE_ROUTE,
  ONBOARDING_ROUTE,
  ONBOARDING_HELP_US_IMPROVE_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_IMPORT_MOBILE_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  ONBOARDING_METAMETRICS,
  ///: BEGIN:ONLY_INCLUDE_IN(flask,desktopextension,desktopapp)
  INITIALIZE_EXPERIMENTAL_AREA,
  ONBOARDING_EXPERIMENTAL_AREA,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(desktopextension)
  DESKTOP_ERROR_ROUTE,
  ///: END:ONLY_INCLUDE_IN
};
