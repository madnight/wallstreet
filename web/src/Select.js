import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import AsyncSelect from "react-select/async";
import axios from "axios";
import styled from "styled-components";

const Styles = styled.div`
    margin-left: 10%;
    margin-right: 10%;
    margin-top: 20px;
`;

class Select extends Component<*, State> {
    state = {
        inputValue: null,
        symbols: null,
        selected: { value: null, label: null }
    };

    async filterSymbolss(inputValue: string) {
        if (inputValue.length < 1) return false;
        return this.state.symbols.filter(i =>
            i.label.toLowerCase().startsWith(inputValue.toLowerCase())
        );
    }

    async componentDidMount() {
        const symbols = (
            await axios.get("https://finance.beuke.org/symbols")
        ).data.map(i => ({ value: i, label: i }));
        this.setState({ symbols });

        const path = this.props.history.location.hash.replace("#", "");

        const result = path.slice(1)
            ? path
                  .slice(1)
                  .split(",")
                  .map(x => ({ value: x, label: x }))
            : [];

        this.setState({
            techFilter: result.length < 1 ? [] : result
        });
    }

    handleInputChange = (newValue: string) => {
        if (newValue.length < 1) return false;
        const inputValue = newValue.replace(/\W/g, "");
        this.setState({ inputValue });
        return inputValue;
    };

    textChange = inputValue => {
        this.setState({ techFilter: inputValue });
        this.props.history.push(
            inputValue
                ? "/wallstreet/#/" + inputValue.map(x => x.value).toString()
                : ""
        );
    };

    render() {
        const promiseOptions = async inputValue =>
            await this.filterSymbolss(inputValue);

        return (
            <Styles>
                <AsyncSelect
                    isMulti
                    cacheOptions
                    value={this.state && this.state.techFilter}
                    placeholder="Stock Symbols"
                    onChange={(...args) => this.textChange(...args)}
                    defaultOptions
                    loadOptions={promiseOptions}
                />
            </Styles>
        );
    }
}

export default withRouter(Select);
