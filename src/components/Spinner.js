import React, { Component } from 'react'

class Spinner extends Component {

    constructor(props) {
        super(props);
        this.state = {
            type: props.type
        }
    }
    render() {
        if (this.state.type === 'table') {
            return (
                <tbody className="spinner-border text-light text-center"></tbody>)
        } else {
            return (<div className="spinner-border text-light text-center"></div>)
        }
    }
}

export default Spinner;
