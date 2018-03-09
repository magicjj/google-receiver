import React, { Component } from 'react';
import $ from 'jquery';
import GoogleReceiver from './google-receiver/GoogleReceiver';
import ListReceiver from './list-receiver/ListReceiver';

export const SERVICE_PROXY_URL = window.location.protocol + "//" + window.location.hostname + ":8080/";
export const SERVICE_URL = SERVICE_PROXY_URL + "https://11z.co/_w/";

class App extends Component {
    render() {
        if (this.props.BaseReceiver.thumperId === 'list') {
            return <ListReceiver BaseReceiver={this.props.BaseReceiver} />
        }
        return <GoogleReceiver BaseReceiver={this.props.BaseReceiver} />
    }
}

export default App;
