import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import Select from "./Select";
import Table from "./Table";

function App(props) {
    const [result, setResult] = useState([]);

    const fetchData = async array => {
        if (array.length < 1) {
            setResult([]);
            return;
        }

        const production = true;
        const getAllUrls = async urls => {
            try {
                var data = await Promise.all(
                    urls.map(url =>
                        fetch(url).then(response => response.json())
                    )
                );

                return data;
            } catch (error) {
                console.log(error);

                throw error;
            }
        };

        const API = production
            ? "https://finance.beuke.org"
            : "http://localhost:3000";

        const responses = await getAllUrls([
            API + `/chart/batch/${array.toString()}`,
            API + `/quote/batch/${array.toString()}`
        ]);

        const yahooResult = responses[0].map(x => {
            const len = x.quote.length;
            const q = x.quote;
            return {
                symbol: x.symbol,
                fiveYearsPerf: q && len > 19 && x.quote[parseInt(len / 2)],
                tenYearsPerf: q && len > 39 && x.quote[0]
            };
        });

        setResult(
            responses[1].map(x => {
                const hit = yahooResult.filter(y => y.symbol === x.symbol)[0];

                const toPerf = x => y =>
                    y ? ((x / y) * 100).toFixed(0) + "%" : "-";

                return {
                    latestPrice: x.price,
                    tenYearsPerf: hit ? toPerf(x.price)(hit.tenYearsPerf) : "-",
                    fiveYearsPerf: hit
                        ? toPerf(x.price)(hit.fiveYearsPerf)
                        : "-",
                    changePercent: x.change,
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
