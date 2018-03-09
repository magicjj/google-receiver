import React, {Component} from 'react';

class Autocomplete extends Component {
    render() {
        if (this.props.autocompleteData === null) {
            return null;
        }

        let printList = [];
        for (var i = 0; i < this.props.autocompleteData.list.length; i++) {
            let str = this.props.autocompleteData.list[i];
            if (str.indexOf(this.props.autocompleteData.req) !== 0) {
                continue;
            }
            printList.push(str);
            if (printList.length >= 5) {
                break;
            }
        }

        return (
            <div jscontroller="Uox2uf" className="_ejs">
                <ul className="_Xhs" jsname="aajZCb" role="listbox">
                    {
                        printList.map(item => 
                            <li className="sbct" role="presentation" key={item}>
                                <div className="sbic sb43" onClick={() => this.props.searchHandler(item)}></div>
                                <div className="sbtc" role="option" onClick={() => this.props.searchHandler(item)}>
                                    <div className="sbl1">
                                        <span>{item.slice(0, this.props.autocompleteData.req.length)}
                                            <b>{item.slice(this.props.autocompleteData.req.length)}</b>
                                        </span>
                                    </div>
                                </div>
                                <div className="sbab">
                                    <div className="sbai sbqb" onClick={() => this.props.pushHandler(item + " ")}></div>
                                </div>
                            </li>
                        )
                    }
                </ul>
            </div>
        );

        // This goes after the UL but I think it's just for desktop 
        /* <div className="_Gmt _Imt"></div>
            <div className="_Yjt">
                <div jsname="bN97Pc" className="_fjt" role="dialog" tabindex="-1" jsaction="htU0tb:TvD9Pc">
                    <div jscontroller="kopZwe" className="_eis" jsaction="TWGMlf:Z7TNWb;rcuQ6b:npT2md">
                        <div className="_pjs" jsname="jVIZXb"></div>
                        <div className="_dis">
                            <div data-async-context="async_id:duf3-46;authority:0;card_id:;entry_point:0;feature_id:;header:0;open:0;suggestions:;suggestions_subtypes:;suggestions_types:;surface:0;type:46">
                                <div styleString="display:none" jsl="$t t-aTz9-_sUcEc;$x 0;" className="r-ijAXKwow0Dj8"></div>
                                <div id="duf3-46" data-jiis="up" data-async-type="duffy3" data-async-context-required="type,open,feature_id,async_id,entry_point,authority,card_id,header,suggestions,surface,suggestions_types,suggestions_subtypes"
                                    className="y yp" data-ved="0ahUKEwjUrITOzt7ZAhWBjVkKHQcsBxoQ-0EICw"></div>
                                <div jsname="k1A8Ye" className="button _H1m _J5m" styleString="display:none;color:#4285f4" jsaction="xlsitd"
                                    data-ved="0ahUKEwjUrITOzt7ZAhWBjVkKHQcsBxoQtw8IDA">SEND FEEDBACK</div>
                            </div>
                            <div jsname="jWDcpe" className="button _H1m _J5m" styleString="display:none;color:#4285f4" jsaction="r9DEDb">CANCEL</div>
                            <div jsname="kcdgPe" className="button _H1m _J5m" styleString="display:none;color:#4285f4" jsaction="r9DEDb">OK</div>
                            <div jsname="AFDdpc" className="button _H1m _J5m" styleString="display:none;color:#db4437">DELETE</div>
                        </div>
                    </div>
                </div>
        </div> 
        

            {this.state.autocompleteData !== null ?
              <ul>
                {
                  this.state.autocompleteData.list.map(item => <li key={item}>{item}</li>)
                }
              </ul> : ""
            }
        */
    }
}

export default Autocomplete;