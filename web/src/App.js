import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTable, useFlexLayout, useSortBy } from "react-table";
import { toHumanString } from "human-readable-numbers";
import { withRouter, useHistory } from "react-router-dom";

const Styles = styled.div`
    margin-left: 2%;
    margin-right: 2%;
    margin-top: 20px;

    .table {
        border: 0px solid #000;
    }

    .header {
        font-weight: bold;
    }

    .rows {
        overflow-y: auto;
    }

    .row {
        border-bottom: 1px solid #000;
        height: 32px;

        &.header-group {
            :first-child {
                border: 0;
            }
        }

        &.body {
            :last-child {
                border: 0;
            }
        }
    }

    .cell {
        height: 100%;
        line-height: 30px;
        border-right: 0px solid #000;
        text-align: left;

        :nth-child(9) {
        }
    }
`;

function Table({ columns, data, props }) {
    const defaultColumn = React.useMemo(
        () => ({
            width: 100
        }),
        []
    );
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = useTable(
        {
            columns,
            data,
            defaultColumn,
            initialState: {
                sortBy: [
                    {
                        id: "cap",
                        desc: true
                    }
                ]
            }
        },
        useFlexLayout,
        useSortBy
    );

    return (
        <div {...getTableProps()} className="table">
            <div>
                {headerGroups.map(headerGroup => (
                    <div
                        {...headerGroup.getHeaderGroupProps()}
                        className="row header-group"
                    >
                        {headerGroup.headers.map(column => (
                            <div
                                {...column.getHeaderProps(
                                    column.getSortByToggleProps()
                                )}
                                className="cell header"
                            >
                                {column.render("Header")}
                                <span>
                                    {column.isSorted
                                        ? column.isSortedDesc
                                            ? ""
                                            : ""
                                        : ""}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="rows" {...getTableBodyProps()}>
                {rows.map((row, i) => {
                    prepareRow(row);
                    return (
                        <div {...row.getRowProps()} className="row body">
                            {row.cells.map((cell, index) => (
                                <div
                                    {...cell.getCellProps()}
                                    key={index}
                                    className={"cell"}
                                >
                                    {cell.render("Cell")}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const red = "#D50000";
const green = "#228B53";

function cellColor(c, v) {
    return <div style={{ color: c.includes("-") ? red : green }}>{v}</div>;
}

function peCellColor(c, v) {
    switch (true) {
        case c < 0 || c > 40:
            return <div style={{ color: red }}>{v}</div>;
        case c < 10:
            return <div style={{ color: green }}>{v}</div>;
        default:
            return <div>{v}</div>;
    }
}

function App() {
    const humanString = i => (i ? toHumanString(i).replace("G", "B") : null);

    const simpleColor = i =>
        i === "-" ? (
            i
        ) : i.includes("-") ? (
            <div style={{ color: red }}>{i}</div>
        ) : (
            <div style={{ color: green }}>+{i}</div>
        );

    const shortColor = i =>
        i.length > 5 ? <div style={{ color: red }}>{i}</div> : <div>{i}</div>;

    const psColor = i =>
        i === "-" ? (
            i
        ) : i > 40 ? (
            <div style={{ color: red }}>{i}</div>
        ) : (
            <div>{i}</div>
        );

    const columns = React.useMemo(
        () => [
            {
                Header: "  ",
                columns: [
                    {
                        Header: "Symbol",
                        accessor: "symbol", // accessors are required for sort
                        maxWidth: 80,
                        Cell: ({ row: { original } }) =>
                            cellColor(original.change, original.symbol)
                    },
                    {
                        Header: "Price",
                        maxWidth: 70,
                        Cell: ({
                            row: {
                                original: { latestPrice }
                            }
                        }) => latestPrice
                    },
                    {
                        Header: "Change",
                        accessor: "change",
                        maxWidth: 70,
                        Cell: ({
                            row: {
                                original: { changeDiff }
                            }
                        }) => simpleColor(changeDiff)
                    },
                    {
                        Header: "Change%",
                        accessor: "changePercent",
                        maxWidth: 80,
                        Cell: ({
                            row: {
                                original: { change }
                            }
                        }) => simpleColor(change)
                    },
                    {
                        Header: "P/E",
                        accessor: "peRatio",
                        maxWidth: 55,
                        Cell: ({
                            row: {
                                original: { peRatio }
                            }
                        }) =>
                            peCellColor(
                                peRatio,
                                peRatio !== "-"
                                    ? parseFloat(peRatio).toFixed(1)
                                    : "-"
                            )
                    },
                    {
                        Header: "P/FCF",
                        accessor: "priceFcfRatio",
                        maxWidth: 55,
                        Cell: ({
                            row: {
                                original: { priceFcfRatio }
                            }
                        }) =>
                            peCellColor(
                                priceFcfRatio - 10,
                                priceFcfRatio !== "-"
                                    ? parseFloat(priceFcfRatio).toFixed(1)
                                    : "-"
                            )
                    },
                    {
                        Header: "P/S",
                        accessor: "priceToSales",
                        maxWidth: 55,
                        Cell: ({
                            row: {
                                original: { psRatio }
                            }
                        }) =>
                            psColor(
                                psRatio !== "-"
                                    ? parseFloat(psRatio).toFixed(1)
                                    : "-"
                            )
                    },
                    {
                        Header: "Short",
                        accessor: "shortFloat",
                        maxWidth: 70,
                        Cell: ({
                            row: {
                                original: { shortFloat }
                            }
                        }) => shortColor(shortFloat)
                    },
                    {
                        Header: "Sales5Y/Y",
                        accessor: "salesPast5Y",
                        maxWidth: 80,
                        Cell: ({
                            row: {
                                original: { salesPast5Y }
                            }
                        }) => simpleColor(salesPast5Y.replace("0%", "%"))
                    },
                    {
                        Header: "SalesQ/Q",
                        accessor: "salesQoQ",
                        maxWidth: 80,
                        Cell: ({
                            row: {
                                original: { salesQoQ }
                            }
                        }) => simpleColor(salesQoQ.replace("0%", "%"))
                    },
                    {
                        Header: "PerfY",
                        accessor: "perfYear",
                        maxWidth: 65,
                        Cell: ({
                            row: {
                                original: { perfYear }
                            }
                        }) => simpleColor(perfYear)
                    },
                    {
                        Header: "Perf5Y",
                        accessor: "fiveYearsPerf",
                        maxWidth: 65,
                        Cell: ({
                            row: {
                                original: { fiveYearsPerf }
                            }
                        }) => simpleColor(fiveYearsPerf)
                    },
                    {
                        Header: "Perf10Y",
                        accessor: "tenYearsPerf",
                        maxWidth: 65,
                        Cell: ({
                            row: {
                                original: { tenYearsPerf }
                            }
                        }) => simpleColor(tenYearsPerf)
                    },
                    {
                        Header: "200DAvg",
                        accessor: "sma200",
                        maxWidth: 80,
                        Cell: ({
                            row: {
                                original: { sma200 }
                            }
                        }) => (sma200 ? simpleColor(sma200) : "")
                    },
                    {
                        Header: "Cap",
                        accessor: "cap",
                        id: "cap",
                        maxWidth: 60,
                        Cell: ({
                            row: {
                                original: { cap }
                            }
                        }) => (cap ? humanString(cap) : "-")
                    }
                ]
            }
        ],
        []
    );

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

    const history = useHistory();
    const path = history.location.hash.replace("#", "");

    let array = path.slice(1) ? path.slice(1).split(",") : [];

    history.listen(async (location, action) => {
        let path = history.location.hash.replace("#", "");

        let array = path.slice(1) ? path.slice(1).split(",") : [];
        fetchData(array);
    });

    useEffect(() => {
        if (array.length > 1) fetchData(array);
    }, []); // eslint-disable-line

    return (
        <Styles>
            <Table columns={columns} defaultPageSize={10} data={result} />
        </Styles>
    );
}

export default withRouter(App);
