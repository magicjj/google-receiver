import React, { Component } from 'react';
import './GoogleReceiver.css';
import $ from 'jquery';
import $cookie from 'jquery.cookie';
import fetch from 'node-fetch';
import { SERVICE_PROXY_URL, SERVICE_URL, API_URL } from '../shared/env';
import Autocomplete from './autocomplete/Autocomplete';
import EditForm from './edit-form/EditForm';
window.jQuery = window.$ = $;

/* 
// make sure cookies work
const auto = require('google-autocomplete');
auto.getQuerySuggestions('house', function (err, suggestions) {
  console.log(suggestions);
})
 */
const DOODLE_SERVICE_URL = SERVICE_PROXY_URL + "https://www.google.com/doodles/json/";
const DEFAULT_DOODLE_URL = "/assets/images/google.png";


class GoogleReceiver extends Component {
  tableId = "";
  modeStrings = ["VIDEOS", "VIDEO", "YOUTUBE"];

  // receiverType = "web"; mode = 2;  moved to state
  //merge = false;  moved to state

  selections = [];

  handling = false;
  lastSelection = "";
  lastSelectionCount = -1;
  mergeCount = 0;

  doodles = [];
  doodleIndex = -1;
  base = null;
  searchFocused = false;

  constructor(props) {
    super(props);

    this.base = this.props.BaseReceiver;
    this.userId = this.base.userId;
    this.thumperId = this.base.thumperId;
    this.tableId = this.base.tableId;
    this.timerEnabled = this.base.timerEnabled;
    this.timerDelay = this.base.timerDelay;
    this.useLastThump = this.base.useLastThump;


    this.state = {
      receiverType: "web",
      mode: 2,
      merge: false,
      warn: false,
      doodleUrl: null,
      covertMode: false,
      covertValue: "",
      searchValue: props.thumper.defaultText,
      thumper: props.thumper,
      autocompleteData: null
    };

    this.doodleIndex = props.thumper.doodleIndex || 0;

    this.getSelection = this.getSelection.bind(this);
    this.setReceiverType = this.setReceiverType.bind(this);
    this.toggleMode = this.toggleMode.bind(this);
    this.search = this.search.bind(this);
    this.toggleMerge = this.toggleMerge.bind(this);
    this.doodlePress = this.doodlePress.bind(this);
    this.doodleRelease = this.doodleRelease.bind(this);
    this.displayWarning = this.displayWarning.bind(this);
    this.flip = this.flip.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.fetchAutocomplete = this.fetchAutocomplete.bind(this);
    this.autocompletePushHandler = this.autocompletePushHandler.bind(this);
    this.autocompleteSearchHandler = this.autocompleteSearchHandler.bind(this);
  }

  componentDidMount() {
    this.setReceiverType("web");

    if (this.useLastThump) {
      this.setState({ searchValue: "" });
    }
    this.initMonitoring();

    if (this.timerEnabled) {
      setTimeout(this.displayWarning, this.timerDelay * 1000 - 4000);
    }

    let now = new Date();
    let date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    fetch(DOODLE_SERVICE_URL + date[0] + "/" + date[1])
      .then(response => response.json())
      .catch(() => this.setState({ doodleUrl: DEFAULT_DOODLE_URL }))
      .then(res => {
        if (typeof res === "undefined") {
          return;
        }
        this.doodles = res.filter(o => o.run_date_array[2] === date[2]);
        this.doodles.push({ url: DEFAULT_DOODLE_URL });
        if (this.doodleIndex !== 0) {
          if (this.doodles.length > this.doodleIndex) {
            this.doodles.unshift(this.doodles[this.doodleIndex]);
            this.doodlesUnshifted = true;
          }
          this.doodleIndex = 0;
        }
        if (this.doodles.length > 0) {
          let todaysDoodle = this.doodles[this.doodleIndex];
          this.setState({ doodleUrl: todaysDoodle.url });
        }
      })
      ;

    this.fetchAutocomplete();
  }

  doodlePress(e) {
    console.log("press")
    this.doodlePressX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  }

  doodleRelease(e) {
    let swapDoodle = (change) => {
      this.doodleIndex = (this.doodleIndex + change) % this.doodles.length;
      if (this.doodleIndex < 0) {
        this.doodleIndex = 0;
      }
      this.setState({ doodleUrl: this.doodles[this.doodleIndex].url });
      this.updateDoodleIndexPreference();
    };

    let clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    if (clientX > this.doodlePressX + 150) {
      swapDoodle(-1);
    } else if (clientX < this.doodlePressX - 150) {
      swapDoodle(1);
    } else {
      this.toggleMerge();
    }
  }

  updateDoodleIndexPreference() {
    let saveIndex = this.doodleIndex;
    if (this.doodlesUnshifted) {
      saveIndex--;
    }
    if (saveIndex < 0) {
      return;
    }
    fetch(API_URL + "thumpers/" + this.userId, {
      method: "POST",
      body: JSON.stringify({ doodleIndex: saveIndex }),
      headers: {
        'Content-Type': 'application/json',
        'Server': 'Google Frontend'
      }
    });
  }

  displayWarning() {
    console.log("WARN");
    this.setState({ warn: true });
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
      if (key.indexOf("i-ghandle") === 0)
        $.removeCookie(key);
    }
  }

  getClassByReceiverType(receiverType) {
    return this.state.receiverType === receiverType ? "gbcps gbcp" : "gbcp";
  }

  setReceiverType(rType) {
    this.setState({ receiverType: rType });

    if (this.useLastThump && !this.base.isEmpty(this.lastSelection)) {
      let url;
      if (this.state.receiverType === "web") {
        url = "https://google.com/search?q=" + this.lastSelection;
      }
      else if (this.state.receiverType === "images") {
        url = "https://google.com/search?tbm=isch&q=" + this.lastSelection;
      }
      else if (this.state.receiverType === "maps") {
        url = "https://maps.google.com/maps/?q=" + this.lastSelection;
      }
      else if (this.state.receiverType === "youtube") {
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
    if (this.mergeCount % 2 === 0) {
      this.setState({ merge: !this.state.merge });
    }
    return false;
  }

  search(event) {
    if (event) {
      event.preventDefault();
    }
    let selection = this.state.searchValue;
    if (this.state.covertMode) {
      selection = this.state.covertInput;
    }
    if ("" === selection.trim()) {
      return;
    }
    if (this.state.mode === 2) {
      var data = { value: selection, source: "google" };
      this.handling = true;

      let _successCallback = () => {
        document.title = "Google";
        var newLoc = this.getSelectionUrl(this.state.covertMode ? this.state.covertValue : this.state.searchValue);
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
      var data = { value: selection, source: "google" };

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
    if (this.state.receiverType === "web") {
      return "https://www.google.com/search?q=" + encodeURIComponent(selection);
    }
    else if (this.state.receiverType === "images") {
      return "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(selection) + "&oq=" + encodeURIComponent(selection);
    }
    else if (this.state.receiverType === "maps") {
      return "https://maps.google.com/maps/?q=" + encodeURIComponent(selection) + "&oq=" + encodeURIComponent(selection);
    }
    else if (this.state.receiverType === "youtube") {
      return "https://www.youtube.com/results?search_query=" + encodeURIComponent(selection);
    }
  }

  // ----------------
 
  initMonitoring() {
    if (this.tableId === "") {
      this.tableId = "" + new Date().getTime();
    }
    if (this.tableId === "0") {
      this.startMonitoring();
      return;
    }
    this.startMonitoring();
  }

  startMonitoring() {
    this.interval = setInterval(this.getSelection, 500);
  }

  getSelection() {
    if (!this.handling) {
      this.handling = true;

      let _successCallback = (result) => {
        if (typeof result !== 'undefined' && typeof result.error !== 'undefined') {
          this.selectionError(result.error);
          this.handling = false;
          return;
        } else if (typeof result !== 'undefined') {
          this.handleSelection(result);
        }
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
      if (this.base.isEmpty(this.state.searchValue)) {
        this.setState({ searchValue: this.lastSelection });
      }
    }
    if (this.state.covertMode) {
      clearInterval(this.interval);
      return;
    }
    if (this.lastSelectionCount === -1) {
      this.lastSelectionCount = selection.count;
      return;
    }
    if (this.lastSelectionCount >= selection.count) {
      return;
    }
    this.lastSelectionCount = selection.count;

    if (!this.base.isEmpty(selection.value)) {
      this.onSelection(selection);
    }
  }

  onSelection(selection) {
    if (this.state.mode === 0) {
      this.selections.push(selection.value);
      if (selection.source === "google") {
        return;
      } else {
        selection.value = this.selections.join(' ');
      }
    }
    if (!this.isURL(selection.value)) {
      // TODO Test this replacement
      if (this.state.merge) {
        var value;
        if (this.state.searchValue.indexOf("mmm") > -1) {
          value = this.state.searchValue.replace("mmm", selection.value);
        } else {
          value = this.state.searchValue.trim() + " " + selection.value.trim();
        }
        selection.value = value;
      }
      selection.value = this.getSelectionUrl(selection.value);
    }
    document.title = "Google";
    /* TODO - this was already commented out - but I want to explore the idea more
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
    return value.indexOf("http") === 0;
  }

  contains(str, value) {
    return str.indexOf(value) >= 0;
  }

  handleSearchChange(e) {
    let searchValue = e.target.value;
    let covertMode = this.state.covertMode;
    let covertValue = this.state.covertValue;
    let covertInput = this.state.covertInput;


    if (searchValue.indexOf("qp") === 0) {
      covertMode = true;
      covertValue = this.props.thumper.covertText.slice(0, searchValue.length);
      while (covertValue.length < searchValue.length) {
        covertValue += " ";
      }
      covertInput = searchValue.slice(2).split("qp")[0];
    } else {
      covertMode = false;
    }

    this.setState({ searchValue, covertMode, covertValue, covertInput });

    setTimeout(this.fetchAutocomplete);
  }

  fetchAutocomplete() {
    let reqTime = Date.now();
    let visibleValue = this.state.searchValue;
    if (this.state.covertMode) {
      visibleValue = this.state.covertValue;
    }
    fetch(SERVICE_PROXY_URL + "http://suggestqueries.google.com/complete/search?client=chrome&q=" + visibleValue)
      .then(res => res.json())
      //.catch()
      .then(res => {
        console.log(res);
        if (this.state.autocompleteData === null || this.state.autocompleteData.reqTime < reqTime) {
          // to keep things clean, we filter out all the suggestions to that don't start with the search term
          this.setState({ autocompleteData: { list: res[1].filter((o) => o.indexOf(res[0]) === 0), req: res[0], reqTime  } });
        }
      })
      ;
  }

  showAutocomplete() {
    return this.state.searchFocused && this.state.autocompleteData !== null && this.state.autocompleteData.list.length > 0;
  }

  autocompletePushHandler(str) {
    document.getElementById("q").focus();
    this.setState({ searchFocused: true })
    this.setState({searchValue: str});
    setTimeout(this.fetchAutocomplete);
  }

  autocompleteSearchHandler(str) {
    this.autocompletePushHandler(str);
    this.search();
  }

  isEditMode() {
    return this.state.searchValue === "!edit";
  }

  render() {
    // TODO add error this.handling if pic doesn't load
    return ( this.isEditMode() ?
      <EditForm thumper={this.props.thumper} />
      : // else if not isEditMode
      <div>
        <div style={{paddingBottom: '20px'}}>
          <div id="gb">
            <a id="web" className={this.getClassByReceiverType("web")} onClick={() => this.setReceiverType("web")}><b>ALL</b></a>
            <a id="images" className={this.getClassByReceiverType("images")} onClick={() => this.setReceiverType("images")}><b>IMAGES</b></a>
            <a id="maps" className={this.getClassByReceiverType("maps")} onClick={() => this.setReceiverType("maps")}><b>MAPS</b></a>
            <b><a id="mode" className="gbcp" onClick={this.toggleMode}>{this.modeStrings[this.state.mode]}{this.state.merge || this.state.warn ? "." : ""}</a></b>
          </div>
        </div>
        <div>
          { ! this.state.searchFocused && this.state.doodleUrl !== null ?
            <div className="doodleContainer">
              <img id="doodle" src={this.state.doodleUrl} alt="Google" draggable="false" onTouchStart={this.doodlePress} onTouchEnd={this.doodleRelease} onMouseDown={this.doodlePress} onMouseUp={this.doodleRelease} />
            </div> : ""
          }
          <div id="main">
            <div className="formContainer">
              <form id="form" action="." onSubmit={this.search}>
                <div className="msb" id="tmsb">
                  <div className="msfo">
                    <a href="" id="mlogo"></a>
                    <div className={"msfi " + (this.showAutocomplete() ? "autocompleteOpen" : "")} id="tsfi">
                      <div id="gs_id0">
                        <div className="sb_ifc inputDiv " id="sb_ifc0" dir="ltr">
                          <div className="sb_chc" id="sb_chc0"></div>
                          {this.state.covertMode ? <input className="lst lst-tbb gsfi searchInput covertSearchMask" id="qMask" maxLength="2048" name="q" autoCapitalize="off" autoComplete="off" autoCorrect="off" title="" type="search" value={this.state.covertValue} readOnly="true" aria-label="Search" aria-haspopup="false" role="combobox" aria-autocomplete="both" dir="ltr" spellCheck="false" /> : ''}
                          <input className="lst lst-tbb gsfi searchInput" id="q" maxLength="2048" name="q" autoCapitalize="off" autoComplete="off" autoCorrect="off" title="" type="search" aria-label="Search" aria-haspopup="false" role="combobox" aria-autocomplete="both" dir="ltr" spellCheck="false"
                            value={this.state.searchValue} onChange={this.handleSearchChange} onFocus={() => this.setState({ searchFocused: true })} 
                            onBlur={() => setTimeout(() => {
                              console.log(document.activeElement);
                              if (document.activeElement !== document.getElementById("q")) {
                                this.setState({ searchFocused: false });
                              }
                            }, 100)}
                          />
                          <div className="gsst_b" id="gs_st0" dir="ltr"><a className="gsst_a hidden" href="javascript:void(0)"><span className="sbcb_a" id="sb_cb0" aria-label="Clear Search">×</span></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button id="search" className={"lsbb " + (this.showAutocomplete() ? "autocompleteOpen" : "")} onClick={this.search}>
                    <div className="sbico"></div>
                  </button>
                </div>
              </form>
              <div className={this.showAutocomplete() ? '' : 'hidden'}>
                <Autocomplete autocompleteData={this.state.autocompleteData} pushHandler={this.autocompletePushHandler} searchHandler={this.autocompleteSearchHandler} />
              </div>
          </div>
        </div>
      </div>
      </div >
    );
  }
}

export default GoogleReceiver;
