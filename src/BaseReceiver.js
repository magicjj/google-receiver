import { Component } from 'react';
import $ from 'jquery';

export const SERVICE_PROXY_URL = window.location.protocol + "//" + window.location.hostname + ":8080/";
export const SERVICE_URL = SERVICE_PROXY_URL + "https://11z.co/_w/";

class BaseReceiver extends Component {
    nosleep = null;
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
        let regex = /([0-9]+)(?:\/([0-9]+)){0,1}(?:-([0-9]+)){0,1}(?::([0-9]+)){0,1}!{0,1}/g;
        let pathMatches = regex.exec(path);
        if (!pathMatches) {
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
}

export default BaseReceiver;
