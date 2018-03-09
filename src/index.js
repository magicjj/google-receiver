import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import BaseReceiver from './BaseReceiver';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<BaseReceiver />, document.getElementById('root'));
// TODO - make all origins https then uncomment this to enable caching
//registerServiceWorker();
