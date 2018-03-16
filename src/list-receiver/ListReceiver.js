import React, { Component} from 'react';
import './ListReceiver.css';
import $ from 'jquery';
import $cookie from 'jquery.cookie';
import fetch from 'node-fetch';
import { SERVICE_PROXY_URL, SERVICE_URL } from '../shared/env';
import { withStyles } from 'material-ui/styles';
import ListThumperOptions from '../google-receiver/edit-form/thumper-options/ListThumperOptions';
import Grid from 'material-ui/Grid';
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
    
    this.state = {
      thumper: props.thumper,
      selection: 1
    };

    this.getSelection = this.getSelection.bind(this);
    this.displayTableImage = this.displayTableImage.bind(this);
    this.redirect = this.redirect.bind(this);
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
    
    ListThumperOptions.setData.bind(this)(this.props.thumper.data);
    setTimeout(() => {
      let theme;

      if (this.state.thumperData.header === "Buzzfeed") {
        theme = {
          header: "/assets/images/buzzfeedHeader.png",
          footer: "/assets/images/buzzfeedFooter.png",
          adTop: "/assets/images/buzzfeedAdTop.png",
          adBottom: "/assets/images/buzzfeedAdBottom.png",
          numberClass: "buzzfeedNumbers",
          redirectLink: "https://www.buzzfeed.com"
        }
      } else {
        // default is Stanford
        theme = {
          header: "/assets/images/stanfordHeader.png",
          footer: "/assets/images/stanfordFooter.png",
          adTop: "/assets/images/stanfordAdTop.png",
          adBottom: "/assets/images/stanfordAdBottom.png",
          numberClass: "stanfordNumbers",
          redirectLink: "https://psychology.stanford.edu"
        }
      }

      this.setState({ theme });
    });
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
        console.log(result);
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

  redirect() {
    window.location.replace(this.state.theme.redirectLink);
  }

  render() {
    let data = this.state.thumperData;

    if (!data || !this.state.theme) {
      return null;
    }

    let listCopy = data.list.slice();
    let selectionIndex = this.state.selection - 1;
    if (selectionIndex !== 0) {
      let temp = listCopy[selectionIndex];
      listCopy[selectionIndex] = listCopy[0];
      listCopy[0] = temp;
    }

    if (data.showAd === "true" || data.showAd === true) {
      data.showAd = true;
    } else {
      data.showAd = false;
    }
    return (
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <div className="doodleContainer">
            <img id="doodle" src={this.state.theme.header} alt="header" draggable="false" onClick={this.redirect} />
          </div>
        </Grid>
        {data.showAd ?
          <Grid item xs={12}>
            <div className="doodleContainer">
              <img src={this.state.theme.adTop} alt="Ad" draggable="false" onClick={this.redirect} />
            </div>
          </Grid>
          : null}
        {data.title !== null && typeof data.title !== "undefined" && data.title.trim() !== "" ?
          <Grid item xs={12}>
            <h1 className="title">{data.title}</h1>
          </Grid>
        : null}
        <Grid item xs={12} className={this.props.classes.listPadding}>
          <ul className="mainList">
            {
              listCopy.map((item, i) => {
                let index = i + 1;
                return <li key={item} className={i === 0 ? this.props.classes.topMarNone : ""}><span className={this.state.theme.numberClass}>{index}</span> {item}</li>;
              })
            }
          </ul>
        </Grid>
        <Grid item xs={12}>
          <div className="doodleContainer">
            <img id="doodle" src={this.state.theme.footer} alt="Buzzfeed" draggable="false" onClick={this.redirect} />
          </div>
        </Grid>
        {data.showAd ?
          <Grid item xs={12}>
            <div className="doodleContainer">
              <img src={this.state.theme.adBottom} alt="Ad" draggable="false" onClick={this.redirect} />
            </div>
          </Grid>
        : null}
      </Grid>
    );
  }
}


//TODO currently styles are unused here
const styles = {
  listPadding: {
    padding: '0 10px'
  },
  topMarNone: {
    marginTop: '0'
  }
};

export default withStyles(styles)(ListReceiver);
