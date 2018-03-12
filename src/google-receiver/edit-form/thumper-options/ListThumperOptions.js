import React from 'react';

import Grid from 'material-ui/Grid';
import TextField from 'material-ui/TextField';

import { MenuItem } from 'material-ui/Menu';
import { FormControl, FormHelperText } from 'material-ui/Form';
import Select from 'material-ui/Select';
import { InputLabel } from 'material-ui/Input';


export const HEADER_TYPES = ["Stanford", "Buzzfeed"];

class ListThumperOptions {
    static setData(data) {
        let dataObj = null;
        try {
            dataObj = JSON.parse(data);
        } catch (e) {}

        if (dataObj === null) {
            dataObj = {
                header: "Stanford",
                title: "",
                list: data || "",
                showAd: "false"
            }
        } else {
            // had issues with true booleans on front end, translate them to strings here
            if (dataObj.showAd) {
                dataObj.showAd = "true";
            } else {
                dataObj.showAd = "false";
            }

            if (!dataObj.list) {
                dataObj.list = [];
                dataObj.listText = "";
            } else {
                dataObj.listText = dataObj.list;

                // temporarily replace all ,, with special char
                let specialChar = String.fromCharCode(1445);
                while (dataObj.list.indexOf(",,") > -1) {
                    dataObj.list = dataObj.list.replace(",,", specialChar);
                }
                // split list based based on commas
                dataObj.list = dataObj.list.split(",");
                // now that it's split, replace all special chars with commas
                for (let i = 0; i < dataObj.list.length; i++) {
                    while (dataObj.list[i].indexOf(specialChar) > -1) {
                        dataObj.list[i] = dataObj.list[i].replace(specialChar, ",");
                    }
                    dataObj.list[i] = dataObj.list[i].trim();
                }
            }
        }
        this.setState({
            thumperData: dataObj
        });
        return dataObj;
    }

    static getData() {
        let dataObj = {...this.state.thumperData};
        if (dataObj.showAd === "true" || dataObj.showAd === true) {
            dataObj.showAd = true;
        } else {
            dataObj.showAd = false;
        }
        /* 
        for (let i = 0; i < dataObj.list.length; i++) {
            while (dataObj.list[i].indexOf(",") > -1) {
                dataObj.list[i] = dataObj.list[i].replace(",", ",,");
            }
        }
        dataObj.listText = dataObj.list.join(",");
         */

        // present the list attribute as text for saving
        dataObj.list = dataObj.listText;

        return dataObj;
    }

    static render() {
        let optChangeHandler = (e) => {
            let _thumperData = { ...this.state.thumperData };
            _thumperData.showAd = e.target.value === "true";
            this.setState({ thumperData: _thumperData })
        };
        let inputChangeHandler = (key) => (e) => {
            let _thumperData = { ...this.state.thumperData };
            _thumperData[key] = e.target.value;
            this.setState({ thumperData: _thumperData })
        };

        if (HEADER_TYPES.indexOf(this.state.thumperData.header) < 0) {
            let _thumperData = { ...this.state.thumperData };
            _thumperData.header = HEADER_TYPES[0];
            this.setState({ thumperData: _thumperData })
        }

        return <Grid container spacing={0}>
            <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                    <InputLabel htmlFor="header">Header</InputLabel>
                    <Select
                        value={this.state.thumperData.header || HEADER_TYPES[0]}
                        onChange={inputChangeHandler("header")}
                        fullWidth
                        inputProps={{
                            name: 'header',
                            id: 'header',
                        }}
                    >
                        {
                            HEADER_TYPES.map((val) => <MenuItem key={val} value={val}>{val}</MenuItem>)
                        }
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    label="Title"
                    value={this.state.thumperData.title}
                    onChange={inputChangeHandler("title")}
                    fullWidth
                    margin="normal"
                />
            </Grid>
            <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                    <InputLabel htmlFor="show-ad">Show Ad?</InputLabel>
                    <Select
                        value={this.state.thumperData.showAd === "true" || this.state.thumperData.showAd === true ? "true" : "false"}
                        onChange={optChangeHandler}
                        fullWidth
                        inputProps={{
                            name: 'showAd',
                            id: 'show-ad',
                        }}
                    >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    label="List"
                    value={this.state.thumperData.listText}
                    onChange={inputChangeHandler("listText")}
                    fullWidth
                    margin="normal"
                    helperText="Enter a list of items, separated by commas. If you want an item to include a comma, use two commas like &quot;,,&quot;."
                />
            </Grid>
        </Grid>;
    }
}

export default ListThumperOptions;