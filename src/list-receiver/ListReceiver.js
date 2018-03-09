import React, { Component} from 'react';
import './ListReceiver.css';
import $ from 'jquery';
import $cookie from 'jquery.cookie';
import fetch from 'node-fetch';
import { SERVICE_PROXY_URL, SERVICE_URL } from '../shared/env';
window.jQuery = window.$ = $;


// make sure cookies work

class ListReceiver extends Component {

  thumper = null;
  handling = false;
  lastSelectionCount = -1;  
  handleTimestamp = null;
  interval = null;
  currentReceiveCount = null;
  thumpListener = () => false;

  constructor(props) {
    super(props);

    let base = this.props.BaseReceiver;
    this.userId = base.userId;
    this.thumperId = base.thumperId;
    this.tableId = base.tableId;
    this.timerEnabled = base.timerEnabled;
    this.timerDelay = base.timerDelay;
    this.useLastThump = base.useLastThump;
    
/* 
    this.thumper = {"type":"image","id":19,"handle":"19","name":"Stanford List (Receiver)","valueType":"value","customUrl":null,"aliases":[],
      "base": { // TODO on backend - instead of just passing a URL, you are passing a JSON object
        listLogo: "default",
        listHeader: "Custom List",
        listItems: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]
      },
      "sticky":true,"authorisedThumpers":[18],"ogTitle":""
    }; */
    
    this.state = {
      thumper: props.thumper,
      selection: 4
    };

    this.getSelection = this.getSelection.bind(this);
    this.displayTableImage = this.displayTableImage.bind(this);
  }

  componentDidMount() {
    

    window.onpageshow = function(event) {
      if (event.persisted) {
          window.location.reload();
      }
    };

    if (this.tableId === "") {
      this.tableId = ""+new Date().getTime();
    }
    if (this.tableId === "0") {
      this.clearCookies();
    }

    if (!this.state.thumper.sticky) {
      this.setState({ "content": this.state.thumper.base});
    } else {
      let ck = $.cookie("images-"+this.thumperId+"-"+this.tableId);
      if (!this.isEmpty(ck)) {
        this.setState({"content":ck});
        return;
      }
      this.displayTableImage();
    }
    this.interval = setInterval(this.getSelection, 500);
  }

  thump(uid, thumper, value, callback) {
    this.setSelection(uid,thumper,value,
      (data) => {
        callback("thumped");
        this.currentReceiveCount = data.receiveCount;
        this.waitForReceipt(() => callback("received"))
      },
      () => callback("error"));
  }


  setSelection(uid,thumper,value,successCallback,errorCallback) {
    let valueType = thumper.valueType;
    if (valueType === "custom") {
      value = thumper.customUrl.replace("--value--",value);
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
    this.thumpListenerTimeout = setTimeout(this.thumpListenerCallback,500);
  }

  thumpListenerCallback() {
    let _successCallback = (data) => {
      if (data.receiveCount !== this.currentReceiveCount) {
        this.thumpListener();
      } else {
        if (this.thumpListener !== null) {
          setTimeout(this.thumpListenerCallback, 500);
        }
      }
    };
    let _errorCallback = () => {
      if (this.thumpListener !== null) {
        setTimeout(this.thumpListenerCallback, 500);
      }
    };
    fetch(SERVICE_URL + encodeURIComponent(this.userId) + "/selection?tm=" + new Date().getTime(), {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Server': 'Google Frontend'
      }
    })
      .then(response => response.json())
      .catch(_errorCallback)
      .then(_successCallback)
    ;
  }

  isEmpty(value) {
    if(typeof value === 'undefined' || value === null || value.trim() === "") {
      return true;
    }
    return false;
  }

  displayTableImage() {
    let data = { thumperId: this.thumperId, tableId: this.tableId };

    let _successCallback = (result) => {
      if (typeof result.error !== 'undefined') {
        this.setState({ "content": this.state.thumper.base });
        this.interval = setInterval(getSelection, 500);
        return;
      }
      if (!this.isEmpty(result.url)) { // TODO - result.url won't make sense any more - we aren't just passing a URL we're passing a JSON object
        this.setState({ "content": result.url });
        if (this.tableId === "0" || this.tableId === "embedded" || result.matched === false) {
          this.interval = setInterval(this.getSelection, 500);
        }
      } else {
        this.setState({ "content": this.state.thumper.base });
        this.interval = setInterval(this.getSelection, 500);
      }
    };

    let _errorCallback = (jqxhr, textStatus, error) => {
      // TODO should this do anything?
    };

    fetch(SERVICE_URL + this.userId + "/tableSelection?tm=" + new Date().getTime(), {
      body: JSON.stringify(data),
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Server': 'Google Frontend',
        'X-Requested-With': 'XMLHttpRequest'
      },
      mode: 'cors'
    })
      .then(response => response.json())
      .catch(_errorCallback)
      .then(_successCallback)
    ;
  }

  getSelection() {
    if (this.state.thumper.sticky && this.handleTimestamp !== null) {
      let delta = new Date().getTime() - this.handleTimestamp;
      if (delta > 120000) {
        clearInterval(this.interval);
        return;
      }
    }
    if (!this.handling) {
      this.handling = true;

      let _successCallback = (result) => {
        if (typeof result !== 'undefined' && typeof result.error !== 'undefined') {
          this.handling = false;
          return;
        } else if (typeof result !== 'undefined') {
          this.handleSelection(result);
          this.handling = false;
        }
      };
      
      let _errorCallback = (jqxhr, textStatus, error) => {
        this.handling = false;
        clearInterval(this.interval);
        this.interval = setInterval(this.getSelection, 500);
      };

      fetch(SERVICE_URL + this.userId + "/selection?rc=" + this.lastSelectionCount + "&tm=" + new Date().getTime(), {
        method: "GET"
      })
        .then(response => response.json())
        .catch(_errorCallback)
        .then(_successCallback)
      ;
    }
  }

  handleSelection(selection) {
    selection.url = selection.value;
    if (this.lastSelectionCount === -1) {
      this.lastSelectionCount = selection.count;
    }
    if (this.lastSelectionCount === selection.count) {
      return;
    }
    this.lastSelectionCount = selection.count;

    if (! isNaN(selection.value)) {
      this.setState({selection: selection.value});
      return;
    }

    if (this.isValidSelection(selection)) {
      this.setState({content: selection.url});
      $.cookie("images-"+this.thumperId+"-"+this.tableId,selection.url);
      let data = { thumperId: this.thumperId, tableId: this.tableId, url: selection.url };
      
      fetch(SERVICE_URL + this.userId + "/tableSelection/set?tm=" + new Date().getTime(), {
        body: JSON.stringify(data),
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Server': 'Google Frontend'
        }
      })  // TODO should we do any error handling or logging?
        .then(resp => { console.log({ call: 'tableSeletion/set', resp }); })
      ;
      
      this.handleTimestamp = new Date().getTime();
    }
  }

  isValidSelection(selection) {
    if (this.isEmpty(selection.url)) {
      return false;
    }
    if (typeof this.state.thumper.authorisedThumpers === 'undefined' || this.state.thumper.authorisedThumpers.length === 0) {
      return true;
    }
    for (let i = 0; i < this.state.thumper.authorisedThumpers.length;i++) {
      if (this.state.thumper.authorisedThumpers[i] === selection.thumperId) {
        return true;
      }
    }
    return false;
  }

  clearCookies() {
    let cookies = $.cookie();
    for (let key in cookies) {
      if (key.indexOf("images-") === 0)
        $.removeCookie(key);
    }
  }

  render() {
    let list = this.state.thumper.data.split(",");
    let selectionIndex = this.state.selection - 1;
    if (selectionIndex !== 0) {
      let temp = list[selectionIndex];
      list[selectionIndex] = list[0];
      list[0] = temp;
    }
    return (
      <div className="App">
        <ol>
          {
            list.map(item => <li key={item}>{item}</li>)
          }
        </ol>
      </div>
    );
  }
}

export default ListReceiver;
