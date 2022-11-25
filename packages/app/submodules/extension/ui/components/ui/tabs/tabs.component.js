import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class Tabs extends Component {
  static defaultProps = {
    defaultActiveTabName: null,
    onTabClick: null,
    tabsClassName: undefined,
    subHeader: null,
  };

  static propTypes = {
    defaultActiveTabName: PropTypes.string,
    onTabClick: PropTypes.func,
    children: PropTypes.node.isRequired,
    tabsClassName: PropTypes.string,
    subHeader: PropTypes.node,
  };

  state = {
    activeTabIndex: Math.max(
      this._findChildByName(this.props.defaultActiveTabName),
      0,
    ),
  };

  handleTabClick(tabIndex, tabName) {
    const { onTabClick } = this.props;
    const { activeTabIndex } = this.state;

    if (tabIndex !== activeTabIndex) {
      this.setState(
        {
          activeTabIndex: tabIndex,
        },
        () => {
          if (onTabClick) {
            onTabClick(tabName);
          }
        },
      );
    }
  }

  renderTabs() {
    const numberOfTabs = React.Children.count(this._getValidChildren());

    return React.Children.map(this._getValidChildren(), (child, index) => {
      const tabName = child?.props.name;
      return (
        child &&
        React.cloneElement(child, {
          onClick: (idx) => this.handleTabClick(idx, tabName),
          tabIndex: index,
          isActive: numberOfTabs > 1 && index === this.state.activeTabIndex,
        })
      );
    });
  }

  renderActiveTabContent() {
    const children = this._getValidChildren();
    const { activeTabIndex } = this.state;

    if (
      (Array.isArray(children) && !children[activeTabIndex]) ||
      (!Array.isArray(children) && activeTabIndex !== 0)
    ) {
      throw new Error(`Tab at index '${activeTabIndex}' does not exist`);
    }

    return children[activeTabIndex]
      ? children[activeTabIndex].props.children
      : children.props.children;
  }

  render() {
    const { tabsClassName, subHeader } = this.props;
    return (
      <div className="tabs">
        <ul className={classnames('tabs__list', tabsClassName)}>
          {this.renderTabs()}
        </ul>
        {subHeader}
        <div className="tabs__content">{this.renderActiveTabContent()}</div>
      </div>
    );
  }

  /**
   * Returns the index of the child with the given name
   *
   * @param {string} name - the name to search for
   * @returns {number} the index of the child with the given name
   * @private
   */
  _findChildByName(name) {
    return this._getValidChildren().findIndex((c) => c?.props.name === name);
  }

  // This ignores any 'null' child elements that are a result of a conditional
  // based on a feature flag setting.
  _getValidChildren() {
    return React.Children.toArray(this.props.children).filter(Boolean);
  }
}
