import React, { Component } from 'react';
import $ from 'jquery';
import NoSleep from 'nosleep.js';

export const SERVICE_URL = "http://192.168.1.12:8080/https://11z.co/_w/";

class BaseReceiver extends Component {
    nosleep = null;
    userId = null;

    currentReceiveCount = null;
    thumpListener = () => false;

    constructor(props) {
        super(props)
        this.nosleep = new NoSleep();
    }

    enableNoSleep() {
        console.log("setup nosleep");
        this.nosleep.enable();
    }

    componentWillUnmount() {
        console.log("teardown nosleep");
        this.nosleep.disable();
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
        if (valueType == "custom") {
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
        $.get(SERVICE_URL + encodeURIComponent(this.userId) + "/selection?tm=" + new Date().getTime())     // TODO Can't we just always use this.userId instead of passing around uid in these functions?
            .success((data) => {
                if (data.receiveCount != this.currentReceiveCount) {
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
        if (typeof value === 'undefined' || value == null || value.trim() == "") {
            return true;
        }
        return false;
    }
}

export default BaseReceiver;
