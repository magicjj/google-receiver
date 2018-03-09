import React from 'react';
import ReactDOM from 'react-dom';
import GoogleReceiver from './GoogleReceiver';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<GoogleReceiver />, div);
  ReactDOM.unmountComponentAtNode(div);
});
