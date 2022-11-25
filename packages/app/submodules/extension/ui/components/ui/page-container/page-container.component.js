import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import PageContainerHeader from './page-container-header';
import PageContainerFooter from './page-container-footer';

export default class PageContainer extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    // PageContainerHeader props
    backButtonString: PropTypes.string,
    backButtonStyles: PropTypes.object,
    headerCloseText: PropTypes.string,
    onBackButtonClick: PropTypes.func,
    onClose: PropTypes.func,
    showBackButton: PropTypes.bool,
    subtitle: PropTypes.string,
    title: PropTypes.string.isRequired,
    // Tabs-related props
    defaultActiveTabIndex: PropTypes.number,
    tabsComponent: PropTypes.node,
    // Content props
    contentComponent: PropTypes.node,
    // PageContainerFooter props
    cancelText: PropTypes.string,
    disabled: PropTypes.bool,
    hideCancel: PropTypes.bool,
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
    submitText: PropTypes.string,
  };

  state = {
    activeTabIndex: this.props.defaultActiveTabIndex || 0,
  };

  handleTabClick(activeTabIndex) {
    this.setState({ activeTabIndex });
  }

  renderTabs() {
    const { tabsComponent } = this.props;

    if (!tabsComponent) {
      return null;
    }

    const numberOfTabs = React.Children.count(tabsComponent.props.children);

    return React.Children.map(
      tabsComponent.props.children,
      (child, tabIndex) => {
        return (
          child &&
          React.cloneElement(child, {
            onClick: (index) => this.handleTabClick(index),
            tabIndex,
            isActive:
              numberOfTabs > 1 && tabIndex === this.state.activeTabIndex,
            key: tabIndex,
            className: 'page-container__tab',
          })
        );
      },
    );
  }

  renderActiveTabContent() {
    const { tabsComponent } = this.props;
    let { children } = tabsComponent.props;
    children = children.filter(Boolean);
    const { activeTabIndex } = this.state;

    return (children[activeTabIndex] || children[0]).props.children;
  }

  renderContent() {
    const { contentComponent, tabsComponent } = this.props;

    if (contentComponent) {
      return contentComponent;
    } else if (tabsComponent) {
      return this.renderActiveTabContent();
    }
    return null;
  }

  getTabSubmitText() {
    const { tabsComponent } = this.props;
    const { activeTabIndex } = this.state;
    if (tabsComponent) {
      let { children } = tabsComponent.props;
      children = children.filter(Boolean);
      if (children[activeTabIndex]?.key === 'custom-tab') {
        return this.context.t('addCustomToken');
      }
    }
    return null;
  }

  render() {
    const {
      title,
      subtitle,
      onClose,
      showBackButton,
      onBackButtonClick,
      backButtonStyles,
      backButtonString,
      onCancel,
      cancelText,
      onSubmit,
      submitText,
      disabled,
      headerCloseText,
      hideCancel,
    } = this.props;
    const tabSubmitText = this.getTabSubmitText();
    return (
      <div className="page-container">
        <PageContainerHeader
          title={title}
          subtitle={subtitle}
          onClose={onClose}
          showBackButton={showBackButton}
          onBackButtonClick={onBackButtonClick}
          backButtonStyles={backButtonStyles}
          backButtonString={backButtonString}
          tabs={this.renderTabs()}
          headerCloseText={headerCloseText}
        />
        <div className="page-container__bottom">
          <div className="page-container__content">{this.renderContent()}</div>
          <PageContainerFooter
            onCancel={onCancel}
            cancelText={cancelText}
            hideCancel={hideCancel}
            onSubmit={onSubmit}
            submitText={tabSubmitText || submitText}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }
}
