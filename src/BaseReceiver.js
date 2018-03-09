import React, { Component } from 'react';
import $ from 'jquery';
import GoogleReceiver from './google-receiver/GoogleReceiver';
import ListReceiver from './list-receiver/ListReceiver';
import {SERVICE_PROXY_URL, SERVICE_URL, API_URL} from './shared/env';

class BaseReceiver extends Component {
    userId = null;
    thumperId = null;
    tableId = null;
    timerEnabled = false;
    timerDelay = 30;
    useLastThump = false;

    currentReceiveCount = null;
    thumpListener = () => false;

    constructor(props) {
        super(props);
        let path = window.location.pathname;
        let regex = /([0-9]+)(?:\/([^\/]+)){0,1}(?:-([^\/]+)){0,1}(?::([0-9]+)){0,1}!{0,1}/g;
        let pathMatches = regex.exec(path);
        if (!pathMatches) {
            this.userId = "8575";   // TODO REMOVE THIS
            this.state = {
                thumper: null
            };
            return;
            window.location.replace('https://www.google.com');
            return;
        }
        if (pathMatches[1]) {
            this.userId = pathMatches[1];
        }
        if (pathMatches[2]) {
            this.thumperId = pathMatches[2];
        }
        if (pathMatches[3]) {
            this.tableId = pathMatches[3];
        }
        if (pathMatches[4]) {
            this.timerDelay = pathMatches[4];
        }
        if (path.indexOf(":") > -1) {
            this.timerEnabled = true;
        }
        if (path.indexOf("!") > -1) {
            this.useLastThump = true;
        }

        window.history.replaceState({}, "Google", "/");

        this.state = {
            thumper: null
        };
    }

    componentDidMount() {
        if (this.thumperId !== null) {
            fetch(API_URL + "thumpers/" + this.userId + "/" + this.thumperId, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Server': 'Google Frontend'
                }
            })
                .then(response => response.json())
                //.catch() // TODO!
                .then((thumper) => {
                    this.setState({ thumper });
                })
            ;
        } else {
            fetch(API_URL + "thumpers/" + this.userId, {   // todo I should make thmpers/userid without a thumperid match this
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Server': 'Google Frontend'
                }
            })
                .then(response => response.json())
                //.catch() // TODO!
                .then((user) => {
                    this.setState({ thumper: { type:'google', ...user }});
                })
            ;
            //this.setState({thumper: { type: 'google' }});
        }
    }

    thump(uid, thumper, value, callback) {
        this.setSelection(uid, thumper, value,
            (data) => {
                callback("thumped");
                this.currentReceiveCount = data.receiveCount;
                this.waitForReceipt(() => callback("received"))
            },
            () => callback("error")
        );
    }

    setSelection(uid, thumper, value, successCallback, errorCallback) {
        let valueType = thumper.valueType;
        if (valueType === "custom") {
            value = thumper.customUrl.replace("--value--", value);
        }
        let data = {};
        data.value = value;
        data.thumperId = thumper.id;
        fetch(SERVICE_URL + encodeURIComponent(uid) + "/selection?tm=" + new Date().getTime(), {
            body: JSON.stringify(data),
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Server': 'Google Frontend'
            }
        })
            .then(response => response.json())
            .catch(errorCallback)
            .then(successCallback)
        ;
    }

    waitForReceipt(callback) {
        this.thumpListener = callback;
        this.thumpListenerTimeout = setTimeout(this.thumpListenerCallback, 500);
    }

    thumpListenerCallback() {
        // TODO make fetch
        $.get(SERVICE_URL + encodeURIComponent(this.userId) + "/selection?tm=" + new Date().getTime())
            .success((data) => {
                if (data.receiveCount !== this.currentReceiveCount) {
                    this.thumpListener();
                } else {
                    if (this.thumpListener != null) {
                        setTimeout(this.thumpListenerCallback, 500);
                    }
                }
            })
            .error(() => {
                if (this.thumpListener != null) {
                    setTimeout(this.thumpListenerCallback, 500);
                }
            });
    }

    isEmpty(value) {
        if (typeof value === 'undefined' || value === null || value.trim() === "") {
            return true;
        }
        return false;
    }

    render() {
        if (this.state.thumper === null) {
            return null;
        }
        if (this.state.thumper.type === 'list') {
            return <ListReceiver BaseReceiver={this} thumper={this.state.thumper}/>
        }
        return <GoogleReceiver BaseReceiver={this} thumper={this.state.thumper} />
    }
}

export default BaseReceiver;
