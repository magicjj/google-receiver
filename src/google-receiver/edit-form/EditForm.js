import React, { Component } from 'react';
import { API_URL } from '../../shared/env';

const SAVED_VALUE = "Saved!";
const UNSAVED_VALUE = "Save";

class EditForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            covertText: props.thumper.covertText,
            defaultText: props.thumper.defaultText,
            saveButtonValue: UNSAVED_VALUE
        }
        this.saveChanges = this.saveChanges.bind(this);
        this.onFieldChange = this.onFieldChange.bind(this);
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

    render() {
        return <form>
            <div>
                User: {this.props.thumper.userId}
            </div>
            <div>
                <label>Default Text <input type="text" value={this.state.defaultText} onChange={(e) => this.setState({ defaultText: e.target.value })} /></label>
            </div>
            <div>
                <label>Covert Text <input type="text" value={this.state.covertText} onChange={(e) => this.setState({ covertText: e.target.value })} /></label>
            </div>
            <div>
                <input type="button" value={this.state.saveButtonValue} onClick={this.saveChanges} />
            </div>
        </form>
    }
}

export default EditForm;