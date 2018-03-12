import React, { Component } from 'react';
import { API_URL } from '../../shared/env';
import ListThumperOptions from './thumper-options/ListThumperOptions';
import { withStyles } from 'material-ui/styles';
import Icon from 'material-ui/Icon';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Grid from 'material-ui/Grid';
import TextField from 'material-ui/TextField';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import { MenuItem } from 'material-ui/Menu';
import { FormControl, FormHelperText } from 'material-ui/Form';
import Select from 'material-ui/Select';
import { InputLabel } from 'material-ui/Input';
import './EditForm.css';

const SAVED_VALUE = "Saved!";
const UNSAVED_VALUE = "Save";
const DELETE_VALUE = "Delete";
const DELETE_CONFIRM_VALUE = "Confirm";
const THUMPER_TYPES = ["list"];

class EditForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            covertText: props.thumper.covertText,
            defaultText: props.thumper.defaultText,
            saveButtonValue: UNSAVED_VALUE,
            editingThumperId: null,
            thumperList: [],
            deleteButtonValue: DELETE_VALUE
        }
        this.saveChanges = this.saveChanges.bind(this);
        this.onFieldChange = this.onFieldChange.bind(this);
        this.saveThumper = this.saveThumper.bind(this);
        this.addThumper = this.addThumper.bind(this);
        this.closeThumperForm = this.closeThumperForm.bind(this);
        this.editThumper = this.editThumper.bind(this);
        this.deleteThumper = this.deleteThumper.bind(this);
        this.openThumper = this.openThumper.bind(this);
    }

    componentDidMount() {
        fetch(API_URL + "thumpers/" + this.props.thumper.userId + "/list", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Server': 'Google Frontend'
            }
        })
            .then(res => res.json())
            .catch()
            .then((res) => {
                this.setState({ thumperList: res });
            })
        ;
    }

    saveChanges() {
        fetch(API_URL + "thumpers/" + this.props.thumper.userId, {
            method: "POST",
            body: JSON.stringify({
                covertText: this.state.covertText,
                defaultText: this.state.defaultText
            }),
            headers: {
                'Content-Type': 'application/json',
                'Server': 'Google Frontend'
            }
        })
            .then(res => res.json())
            .catch()
            .then((res) => {
                this.setState({ saveButtonValue: SAVED_VALUE });
                setTimeout(() => {
                    this.setState({ saveButtonValue: UNSAVED_VALUE });
                }, 1000);
            })
        ;
    }

    onFieldChange(field) {
        return (e) => {
            let state = {};
            state[field] = e.target.value;
            this.setState({ state, saveButtonValue: UNSAVED_VALUE });
        }

    }
    
    saveThumper() {
        let thumperData;
        if (this.state.thumperType === "list") {
            thumperData = ListThumperOptions.getData.bind(this)();
        }
        if (typeof thumperData === "object") {
            thumperData = JSON.stringify(thumperData);
        }


        let body = {
            type: this.state.thumperType,
            handle: this.state.thumperHandle,
            name: this.state.thumperName,
            authorizedThumpers: this.state.thumperAuthorizedThumpers,
            data: thumperData
        }
        let thumperId;
        if (this.state.addingThumper) {
            thumperId = "new";
            body.action = "add";
        } else {
            thumperId = this.state.editingThumperId;
        }
        fetch(API_URL + "thumpers/" + this.props.thumper.userId + "/" + thumperId, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Server': 'Google Frontend'
            }
        })
            .then(res => res.json())
            .catch()
            .then((res) => {
                let _state = { saveButtonValue: SAVED_VALUE };
                if (this.state.addingThumper) {
                    _state.addingThumper = false;
                    _state.editingThumperId = res.id;
                }
                this.setState(_state);
                this.componentDidMount();
            })
        ;
    }

    addThumper() {
        let thumperData = "";
        if (this.state.thumperType === "list") {
            thumperData = ListThumperOptions.setData.bind(this)("");
        }
        this.setState({ 
            saveButtonValue: UNSAVED_VALUE,
            deleteButtonValue: DELETE_VALUE,
            addingThumper: true,
            thumperType: "list",
            thumperHandle: "",
            thumperName: "Thumper Name",
            thumperAuthorizedThumpers: "",
            thumperData: thumperData
        });
    }

    closeThumperForm() {
        this.setState({
            addingThumper: false,
            editingThumperId: null,
            saveButtonValue: UNSAVED_VALUE,
            deleteButtonValue: DELETE_VALUE,
        })
    }

    editThumper(thumperId) {
        fetch(API_URL + "thumpers/" + this.props.thumper.userId + "/" + thumperId, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Server': 'Google Frontend'
            }
        })
            .then(res => res.json())
            .catch()
            .then((res) => {
                let thumperData = "";
                if (res.type === "list") {
                    thumperData = ListThumperOptions.setData.bind(this)(res.data || "");
                }
                this.setState({
                    saveButtonValue: UNSAVED_VALUE,
                    deleteButtonValue: DELETE_VALUE,
                    thumperType: res.type || THUMPER_TYPES[0],
                    thumperHandle: res.handle || "",
                    thumperName: res.name || "",
                    thumperAuthorizedThumpers: res.authorizedThumpers || "",
                    thumperData: thumperData,
                    editingThumperId: thumperId
                });
            })
            ;
    }

    deleteThumper() {
        if (this.state.deleteButtonValue === DELETE_CONFIRM_VALUE) {
            fetch(API_URL + "thumpers/" + this.props.thumper.userId + "/" + this.state.editingThumperId, {
                method: "POST",
                body: JSON.stringify({action:"delete"}),
                headers: {
                    'Content-Type': 'application/json',
                    'Server': 'Google Frontend'
                }
            })
                .then(res => res.json())
                .catch()
                .then((res) => {
                    this.setState({
                        deleteButtonValue: DELETE_VALUE,
                        saveButtonValue: UNSAVED_VALUE,
                        addingThumper: false,
                        editingThumperId: null
                    });
                    this.componentDidMount();
                })
            ;
            this.setState({
                deleteButtonValue: DELETE_VALUE
            });
        } else {
            this.setState({
                deleteButtonValue: DELETE_CONFIRM_VALUE
            });
        }
    }

    openThumper() {
        window.open("/" + this.props.thumper.userId + "/" + this.state.editingThumperId);
    }

    render() {
        let thumperData = "";
        if (this.state.thumperType === "list") {
            thumperData = <Grid item xs={12}> { ListThumperOptions.render.bind(this)() } </Grid>;
        }

        let inputChangeHandler = (key) => (e) => {
            let _state = {};
            _state[key] = e.target.value;
            this.setState(_state);
        };

        let classes = this.props.classes;
        return ( this.state.addingThumper || this.state.editingThumperId !== null ? // if working on a thumper, show the thumper form
            <Grid container spacing={0}>
                <Grid item xs={12}>
                    <AppBar position="static" color="default">
                        <Toolbar>
                            <Typography variant="title" color="inherit" className={classes.flex}>
                                Thumper Settings
                        </Typography>
                        </Toolbar>
                    </AppBar>
                </Grid>
                <Grid item xs={12}>
                    <Grid container className={classes.pad10} spacing={0}>
                        <Grid item xs={12}>
                            <FormControl fullWidth className={classes.topMar0} margin="normal">
                                <InputLabel htmlFor="type">Thumper Type</InputLabel>
                                <Select
                                    value={this.state.thumperType || THUMPER_TYPES[0]}
                                    onChange={inputChangeHandler("thumperType")}
                                    fullWidth
                                    inputProps={{
                                        name: 'type',
                                        id: 'type',
                                    }}
                                >
                                    {
                                        THUMPER_TYPES.map((val) => <MenuItem key={val} value={val} selected={val === this.state.thumperType}>{val}</MenuItem>)
                                    }
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Handle"
                                value={this.state.thumperHandle}
                                onChange={inputChangeHandler("thumperHandle")}
                                fullWidth
                                margin="normal"
                                helperText="Customized url path for this thumper."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Name"
                                value={this.state.thumperName}
                                onChange={inputChangeHandler("thumperName")}
                                fullWidth
                                margin="normal"
                                helperText="Only seen in your My Thumpers list."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Authorized Thumpers"
                                value={this.state.thumperAuthorizedThumpers}
                                onChange={inputChangeHandler("thumperAuthorizedThumpers")}
                                fullWidth
                                margin="normal"
                                helperText="Typically left blank - comma-delimited list of thumper IDs."
                            />
                        </Grid>
                        {thumperData}
                        <Grid item xs={12}>
                            <Toolbar>
                                <Button variant="raised" onClick={this.saveThumper} color="primary">
                                    {this.state.saveButtonValue}
                                </Button>
                                <Button variant="raised" onClick={this.closeThumperForm} color="primary" className={classes.leftMar20}>
                                    Close
                                </Button>
                                <div className={classes.flex} />
                                {this.state.editingThumperId !== null ? 
                                    <Button variant="raised" onClick={this.openThumper}>
                                        Open
                                    </Button>
                                : ""}
                            </Toolbar>
                        </Grid>
                        {this.state.editingThumperId !== null ? 
                            <Grid item xs={12} className={classes.textAlignCenter + " " + classes.topMar40}>
                                <Button variant="raised" onClick={this.deleteThumper} color="secondary">
                                    {this.state.deleteButtonValue}
                                </Button>
                            </Grid>
                        : ""}
                        
                    </Grid>
                </Grid>
            </Grid>
                
            : // else if not working on a thumper, show main screen
            <Grid container spacing={0}>
                <Grid item xs={12}>
                    <AppBar position="static" color="default">
                        <Toolbar>
                            <Typography variant="title" color="inherit" className={classes.flex}>
                                Main Settings
                            </Typography>
                        </Toolbar>
                    </AppBar>
                </Grid>
                <Grid item xs={12}>
                    <Grid container className={classes.pad10} spacing={0}>
                        <Grid item xs={12}>
                            <TextField
                                label="User"
                                value={this.props.thumper.userId}
                                disabled
                                fullWidth
                                margin="normal"
                                className={classes.topMar0}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Default Text"
                                value={this.state.defaultText}
                                onChange={inputChangeHandler("defaultText")}
                                fullWidth
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Covert Text"
                                value={this.state.covertText}
                                onChange={inputChangeHandler("covertText")}
                                fullWidth
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button variant="raised" onClick={this.saveChanges} color="primary" className={classes.topMar20}>
                                {this.state.saveButtonValue}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} className={classes.topMar40 +" "+ classes.root}>
                    <AppBar position="static" color="default">
                        <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="title" color="inherit">
                                My Thumpers
                            </Typography>
                            <Button
                                color="primary" aria-label="add" onClick={this.addThumper}
                            >
                                { // <Icon>add_icon</Icon>  TODO  using an icon here causes blank area on the right of the screen, horizontal overflow
                                }
                                ADD
                            </Button>
                        </Toolbar>
                    </AppBar>
                </Grid>
                {   this.state.thumperList.length === 0 ? 
                        <Grid item xs={12}>
                            <List component="nav">
                                <ListItem button>
                                    <ListItemText primary="No Thumpers Found" />
                                </ListItem>
                            </List>
                        </Grid>
                    :
                    (
                        <Grid item xs={12}>
                        <List component="nav">
                            {this.state.thumperList.map(thumper => 
                            <ListItem key={thumper.id} button onClick={() => this.editThumper(thumper.id)}>
                                <ListItemText primary={thumper.name} secondary={"/" + thumper.handle} />
                            </ListItem>
                            )}
                        </List>
                        </Grid>
                    )
                }
            </Grid>
        );
    }
}

const styles = {
    root: {
        flexGrow: 1
    },
    flex: {
        flex: 1
    },
    leftMar20: {
        marginLeft: '20px'
    },
    topMar40: {
        marginTop: '40px'
    },
    topMar20: {
        marginTop: '20px'
    },
    topMar0: {
        marginTop: '0px'
    },
    pad10: {
        padding: '10px'
    },
    textAlignCenter: {
        textAlign: 'center'
    }
};

export default withStyles(styles)(EditForm);