import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { toHumanString } from "human-readable-numbers";
import { withRouter, useHistory } from "react-router-dom";
import Select from "./Select";

import { useParams } from "react-router-dom";

import Table from "./Table";

const whyDidYouRender = require("@welldone-software/why-did-you-render");

whyDidYouRender(React, {
    trackAllPureComponents: true
});

function App(props) {
    const [result, setResult] = useState([]);

    const fetchData = async array => {
        if (array.length < 1) {
            setResult([]);
            return;
        }

        const production = true;

        const yahoo = await fetch(
            production
                ? `https://finance.beuke.org/chart/batch/${array.toString()}`
                : `https://localhost:3000/chart/batch/${array.toString()}`
        );

        const abc = (await yahoo.json()).map(x => {
            const len = x.quote.length;
            const q = x.quote;
            return {
                symbol: x.symbol,
                fiveYearsPerf: q && len > 19 && x.quote[parseInt(len / 2)],
                tenYearsPerf: q && len > 39 && x.quote[0]
            };
        });

        const response = await fetch(
            production
                ? `https://finance.beuke.org/quote/batch/${array.toString()}`
                : `http://localhost:3000/quote/batch/${array.toString()}`
        );

        const json = await response.json();
        setResult(
            json.map(x => {
                const hit = abc.filter(y => y.symbol === x.symbol)[0];

                const toPerf = x => y =>
                    y ? ((x / y) * 100).toFixed(0) + "%" : "-";

                return {
                    latestPrice: x.price,
                    tenYearsPerf: hit ? toPerf(x.price)(hit.tenYearsPerf) : "-",
                    fiveYearsPerf: hit
                        ? toPerf(x.price)(hit.fiveYearsPerf)
                        : "-",
                    changePercent: x.change,
                    change: "asd",
                    week52Low: 0,
                    week52High: 0,
                    changeDiff: (x.price - x.prevClose).toFixed(2).toString(),
                    ...x,
                    cap:
                        x.cap !== "-"
                            ? parseFloat(x.cap.slice(0, -1)) * 1000000000
                            : null
                };
            })
        );
    };

    const path = props.location.pathname;

    let array = path.slice(1) ? path.slice(1).split(",") : [];

    useEffect(() => {
        if (array.length > 1) fetchData(array);
    }, []); // eslint-disable-line

    return (
        <div>
            <Select handler={fetchData} />
            <Table data={result} />
        </div>
    );
}

export default withRouter(App);

App.whyDidYouRender = true;
