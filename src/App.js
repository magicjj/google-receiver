import React, { Component } from 'react';
import './App.css';
import $ from 'jquery';
import $cookie from 'jquery.cookie';
import fetch from 'node-fetch';
import { SERVICE_URL } from './BaseReceiver';
import BaseReceiver from './BaseReceiver';
import NoSleep from 'nosleep.js';
window.jQuery = window.$ = $;

// TODO ADD WAKELOCK OR NOSLEEP
// implement fetch
// make sure cookies work

let noSleep = new NoSleep();
function enableNoSleep() {
  noSleep.enable();
  document.removeEventListener('click', enableNoSleep, false);
}

// Enable wake lock.
// (must be wrapped in a user input event handler e.g. a mouse or touch handler)
document.addEventListener('click', enableNoSleep, false);



const DOODLE_SERVICE = "http://192.168.1.12:8080/https://www.google.com/doodles/json/";
const DEFAULT_DOODLE_URL = "http://www.11z.co/images/google.png";

class App extends BaseReceiver {
  tableId = "";
  modeStrings = ["VIDEOS", "VIDEO", "YOUTUBE"];
  covert_text = "What are you thinking of?";
  useLastThump = false;
  timerEnabled = false;
  timerDelay = 30;

  
  // receiverType = "web"; mode = 2;  moved to state
  selections = [];

  in_covert_mode = false;
  inputValLength = 0;
  covert_text_pos = 2;
  covert_thump = "";
  covert_thump_captured = false;

  handling = false;
  lastSelection = "";
  lastSelectionCount = -1;
  //merge = false;  moved to state
  mergeCount = 0;

  doodles = [];
  doodleIndex = -1;

  constructor(props) {
    super(props);

    this.userId = 8575;
    this.thumper = {
      "type": "image", "id": 19, "handle": "19", "type": "image", "name": "Stanford List (Receiver)", "valueType": "value", "customUrl": null, "aliases": [],
      "base": { // TODO on backend - instead of just passing a URL, you are passing a JSON object
        listLogo: "default",
        listHeader: "Custom List",
        listItems: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]
      },
      "sticky": true, "authorisedThumpers": [18], "ogTitle": ""
    };
    this.thumperId = this.thumper.id;
    this.tableId = "1518197032644";

    this.state = {
      receiverType: "web",
      mode: 2,
      merge: false,
      warn: false,
      doodleUrl: null
    };
    this.enableNoSleep = this.enableNoSleep.bind(this);
    this.getSelection = this.getSelection.bind(this);
    this.setReceiverType = this.setReceiverType.bind(this);
    this.toggleMode = this.toggleMode.bind(this);
    this.search = this.search.bind(this);
    this.toggleMerge = this.toggleMerge.bind(this);
    this.doodlePress = this.doodlePress.bind(this);
    this.doodleRelease = this.doodleRelease.bind(this);
  }

  componentDidMount() {
    //window.history.replaceState({},"Google","/");
    this.setReceiverType("web");

    
    if (this.covert_text != "") {

      $("#q").keyup((event) => {
        this.removeCookie(null);
      });

      $("#q").keypress((event) => {
        if (this.in_covert_mode) {
          if (event.keyCode == 13) {
            return;
          }
          event.preventDefault();
          this.removeCookie(String.fromCharCode(event.keyCode));
        }
      });
    }
    if (this.useLastThump) {
      $("#q").val("");
    }
    this.initMonitoring();

    if (this.timerEnabled) {
      setTimeout(this.displayWarning, this.timerDelay * 1000 - 4000);
    }

    let date = [2018,3,3];
    fetch(DOODLE_SERVICE + date[0] + "/" + date[1])
      .then(response => response.json())
      .catch(() => this.setState({doodleUrl: DEFAULT_DOODLE_URL}))
      .then(res => {
        this.doodles = res;
        this.doodleIndex = res.findIndex(o => o.run_date_array[2] === date[2]);
        if (this.doodleIndex > -1) {
          let todaysDoodle = this.doodles[this.doodleIndex];
          this.setState({doodleUrl: todaysDoodle.url});
        }
      })
    ;
  }

  doodlePress(e) {
    console.log("press")
    this.doodlePressX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  }

  doodleRelease(e) {
    let swapDoodle = (change) => {
      this.doodleIndex = (this.doodleIndex + change) % this.doodles.length;
      if (this.doodleIndex < 0) {
        this.doodleIndex = this.doodles.length - 1;
      }
      this.setState({ doodleUrl: this.doodles[this.doodleIndex].url });
    };
    
    let clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    if (clientX > this.doodlePressX + 150) {
      swapDoodle(1);
    } else if (clientX < this.doodlePressX - 150) {
      swapDoodle(-1);
    } else {
      this.toggleMerge();
    }
  }

  displayWarning() {
    console.log("WARN");
    this.setState({warn: true});
    setTimeout(this.flip, 4000);
  }

  flip() {
    document.title = "Google";
    var newLoc = this.getSelectionUrl(this.lastSelection);
    this.removeCookie();
    window.location.replace(newLoc);
  }

  removeCookie() {
    var cookies = $.cookie();
    for (var key in cookies) {
      if (key.indexOf("i-ghandle") == 0)
        $.removeCookie(key);
    }
  }

  keyup(theKey) {
    var inputVal = $("#q").val();
    if (theKey != null) {
      inputVal += theKey;
    }
    var delta = inputVal.length - this.inputValLength;
    if (delta == 0) {
      return;
    }
    //console.log("val="+inputVal);
    var isBack = false;
    if (inputVal.length < this.inputValLength || inputVal.length == 0) {
      isBack = true;
    }
    this.inputValLength = inputVal.length;

    if (!this.in_covert_mode && inputVal === "qp") {
      this.in_covert_mode = true;
      this.covert_thump = "";
      $("#q").val(this.covert_text.substring(0, 2));
    } else {
      if (this.in_covert_mode) {
        if (!isBack) {
          this.covert_text_pos += delta;
          if (!this.covert_thump_captured) {
            this.covert_thump += inputVal.substring(inputVal.length - delta, inputVal.length);
          }
          if (this.covert_thump.endsWith("qp")) {
            this.covert_thump = this.covert_thump.substring(0, this.covert_thump.length - 2);
            //console.log("CAPTURED: "+this.covert_thump);
            this.covert_thump_captured = true;
          }
        } else {
          if (this.covert_text_pos > 0) {
            this.covert_text_pos -= 1;
          }
          if (this.covert_thump.length > 0) {
            this.covert_thump = this.covert_thump.substring(0, this.covert_thump.length - 1);
          }
        }
        $("#q").val(this.covert_text.substring(0, this.covert_text_pos));
      }
    }
    //console.log("covert="+this.covert_thump);
  }

  getClassByReceiverType(receiverType) {
    return this.state.receiverType === receiverType ? "gbcps gbcp" : "gbcp";
  }

  setReceiverType(rType) {
    this.setState({ receiverType: rType });

    if (this.useLastThump && !this.isEmpty(this.lastSelection)) {
      let url;
      if (this.state.receiverType == "web") {
        url = "https://google.com/search?q=" + this.lastSelection;
      }
      else if (this.state.receiverType == "images") {
        url = "https://google.com/search?tbm=isch&q=" + this.lastSelection;
      }
      else if (this.state.receiverType == "maps") {
        url = "https://maps.google.com/maps/?q=" + this.lastSelection;
      }
      else if (this.state.receiverType == "youtube") {
        url = "https://www.youtube.com/results?search_query=" + this.lastSelection;
      }
      this.removeCookie();
      window.location.replace(url);
    }


    return false;
  }

  toggleMode() {
    this.setState({ mode: (this.state.mode + 1) % 3 });
    return false;
  }

  toggleMerge() {
    if (this.useLastThump) {
      document.title = "Google";
      this.removeCookie();
      window.location.replace("https://google.com");
      return;
    }
    this.mergeCount += 1;
    if (this.mergeCount % 2 == 0) {
      this.setState({ merge: !this.state.merge });
    }
    return false;
  }

  search(event) {
    event.preventDefault();
    var selection = $("#q").val();
    if ("" == selection.trim()) {
      return;
    }
    if (this.state.mode == 2) {
      if (this.in_covert_mode) {
        selection = this.covert_thump;
      }
      var data = { value: selection, source: "google" };
      this.handling = true;
      
      let _successCallback = () => {
        document.title = "Google";
        var newLoc = this.getSelectionUrl($("#q").val());
        this.removeCookie();
        window.location.replace(newLoc);
      };
      let _errorCallback = () => { };

      fetch(SERVICE_URL + this.userId + "/selection?tm=" + new Date().getTime(), {
        body: JSON.stringify(data),
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Server': 'Google Frontend'
        }
      })
        .then(response => response.json())
        .catch(_errorCallback)
        .then(_successCallback)
      ;
    } else {
      //mode = 1;
      this.lastSelectionCount += 1;
      var data = { value: $("#q").val(), source: "google" };

      let _successCallback = () => { };
      let _errorCallback = () => { };

      fetch(SERVICE_URL + this.userId + "/selection?tm=" + new Date().getTime(), {
        body: JSON.stringify(data),
        method: "POST",
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
    return false;
  }

  getSelectionUrl(selection) {
    if (this.isURL(selection)) {
      return selection;
    }
    if (this.state.receiverType == "web") {
      return "https://www.google.com/search?q=" + encodeURIComponent(selection);
    }
    else if (this.state.receiverType == "images") {
      return "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(selection) + "&oq=" + encodeURIComponent(selection);
    }
    else if (this.state.receiverType == "maps") {
      return "https://maps.google.com/maps/?q=" + encodeURIComponent(selection) + "&oq=" + encodeURIComponent(selection);
    }
    else if (this.state.receiverType == "youtube") {
      return "https://www.youtube.com/results?search_query=" + encodeURIComponent(selection);
    }
  }

  // ----------------

  initMonitoring() {
    if (this.tableId == "") {
      this.tableId = "" + new Date().getTime();
    }
    if (this.tableId == "0") {
      this.startMonitoring();
      return;
    }
    this.startMonitoring();
  }

  startMonitoring() {
    $("#page").show();
    this.interval = setInterval(this.getSelection, 500);
  }

  getSelection() {
    if (!this.handling) {
      this.handling = true;

      let _successCallback = (result) => {
        if (typeof result.error != 'undefined') {
          this.selectionError(result.error);
          this.handling = false;
          return;
        }
        this.handleSelection(result);
        this.handling = false;
      };
      let _errorCallback = () => {
        console.log("error");
        clearInterval(this.interval);
        this.interval = setInterval(this.getSelection, 500);
        this.handling = false;
      };

      fetch(SERVICE_URL + this.userId + "/selection?rc=" + this.lastSelectionCount + "&tm=" + new Date().getTime(), {
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
  }

  selectionError(error) {

  }

  handleSelection(selection) {
    this.lastSelection = selection.value;
    if (this.timerEnabled) {
      return;
    }
    if (this.useLastThump) {
      if (this.isEmpty($("#q").val())) {
        $("#q").val(this.lastSelection);
      }
    }
    if (this.in_covert_mode) {
      clearInterval(this.interval);
      return;
    }
    if (this.lastSelectionCount == -1) {
      this.lastSelectionCount = selection.count;
      return;
    }
    if (this.lastSelectionCount >= selection.count) {
      return;
    }
    this.lastSelectionCount = selection.count;

    if (!this.isEmpty(selection.value)) {
      this.onSelection(selection);
    }
  }

  onSelection(selection) {
    //	if (mode == 2) {
    //		return;
    //	}
    if (this.state.mode == 0) {
      this.selections.push(selection.value);
      if (selection.source == "google") {
        return;
      } else {
        selection.value = this.selections.join(' ');
      }
    }
    if (!this.isURL(selection.value)) {
      if (this.merge) {
        var value = $("#q").val();
        if (value.indexOf("mmm") != -1) {
          value = value.replace("mmm", selection.value);
        } else {
          value = value + " " + selection.value;
        }
        selection.value = value;
      }
      selection.value = this.getSelectionUrl(selection.value);
    }
    document.title = "Google";
    /* 
    if (this.willExitBrowser(selection.value)) {
      setTimeout(function () {
        this.removeCookie();
        window.location.replace('https://www.google.com');
      }, 0);
    }
    */
    this.removeCookie();
    window.location.replace(selection.value);
  }


  willExitBrowser(url) {
    //	if (!this.isIOS()) {
    //		return false;
    //	}
    //	if (this.contains(url,"maps.apple.com")) {
    //		return true;
    //	}
    //	if (this.contains(url,"youtube.com")) {
    //		return true;
    //	}
    //	if (this.contains(url,"itunes.apple.com")) {
    //		return true;
    //	}
    return false;
  }

  isIOS() {
    return navigator.userAgent.match(/iPad|iPhone|iPod/g) ? true : false;
  }

  isURL(value) {
    return value.indexOf("http") == 0;
  }

  contains(str, value) {
    return str.indexOf(value) >= 0;
  }


  render() {
    // TODO add error this.handling if pic doesn't load
    /* {this.state.content.listHeader}
        <ol>
          {
            this.state.content.listItems.map(item => <li key={item}>{item}</li>)
          }
        </ol>
    */
    return (
      <div>
        <div>
          <div id="gb">
            <a id="web" className={this.getClassByReceiverType("web")} onClick={() => this.setReceiverType("web")}><b>ALL</b></a>
            <a id="images" className={this.getClassByReceiverType("images")} onClick={() => this.setReceiverType("images")}><b>IMAGES</b></a>
            <a id="maps" className={this.getClassByReceiverType("maps")} onClick={() => this.setReceiverType("maps")}><b>MAPS</b></a>
            <b><a id="mode" className="gbcp" onClick={this.toggleMode}>{this.modeStrings[this.state.mode]}{this.state.merge || this.state.warn ? "." : ""}</a></b>
          </div>
        </div>
        <div id="_Q5">
          <div className="doodleContainer">
            <img id="doodle" src={this.state.doodleUrl} alt="Google" draggable="false" onTouchStart={this.doodlePress} onTouchEnd={this.doodleRelease} onMouseDown={this.doodlePress} onMouseUp={this.doodleRelease} />
          </div>
          <div id="main">
            <div className="formContainer">
              <form id="form" action="." onSubmit={this.search}>
                <div className="msb" id="tmsb">
                  <div className="msfo">
                    <a href="" id="mlogo"></a>
                    <div className="msfi" id="tsfi">
                      <div id="gs_id0">
                        <div className="sb_ifc" id="sb_ifc0" dir="ltr">
                          <div className="sb_chc" id="sb_chc0"></div>
                          <input className="lst lst-tbb gsfi searchInput" id="q" maxLength="2048" name="q" autoCapitalize="off" autoComplete="off" autoCorrect="off" title="" type="search" defaultValue="birthday of " aria-label="Search" aria-haspopup="false" role="combobox" aria-autocomplete="both" dir="ltr" spellCheck="false" />
                          <div className="gsst_b" id="gs_st0" dir="ltr"><a className="gsst_a hidden" href="javascript:void(0)"><span className="sbcb_a" id="sb_cb0" aria-label="Clear Search">×</span></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button id="search" className="lsbb" onClick={this.search}>
                    <div className="sbico"></div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
