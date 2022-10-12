import React from 'react';
import { render } from 'react-dom';
import DesktopApp from './App';

function launchDesktopUi() {
  const rootElement = document.getElementById('root');
  render(<DesktopApp />, rootElement);
}

export default launchDesktopUi;
