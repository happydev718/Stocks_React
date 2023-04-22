import React, { Component } from 'react';
import { connect } from 'react-redux'
import Spinner from './Spinner'
import {
    tokenBalanceSelector,
    accountSelector,
    etherBalanceSelector,
} from '../store/selectors';

import {
    balancesLoading,
    balancesLoaded,
    etherBalanceLoaded,
    tokenBalanceLoaded,
    orderCancelling,
    updateOrderCancellingFlagFalse,
} from '../store/actions'
import { db } from "./firebase/firebase";
import { Tabs, Tab, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import config from "../config/wallets.json";

import axios from 'axios';
import { backUrl } from './constants/routes';
import { ether } from '../helpers';

class MarketTrade extends Component {

    constructor(props) {
        super(props);
        this.state = {
            orderBookBuy: props.orderBookBuy,
            orderBookSell: props.orderBookSell,
            showMarketSellButtonFlag: false,
            showMarketBuyButtonFlag: false,
            showbuttonFlag: true,
            ethAmount: "",
            ethPrice: "",
            sellethAmount: "",
            sellethPrice: "",
            methAmount: "",
            methPrice: "",
            msellethAmount: "",
            msellethPrice: "",
        };
        this.unsubscribe = null;
        this.unsubscribe_fill = null;
    }

    componentDidUpdate(prevProps) {
        // console.log(" ----------------------+++ ", this.props.orderBookBuy, this.props.orderBookSell);
        if (prevProps.orderBookBuy !== this.props.orderBookBuy) {
            this.setState({ orderBookBuy: this.props.orderBookBuy });
            if (Object.keys(this.props.orderBookBuy).includes("buy")) {
                if (this.props.orderBookBuy.length > 0) {
                    this.setState({ showMarketSellButtonFlag: true });
                }
                else {
                    this.setState({ showMarketSellButtonFlag: false });
                }
            }
        }
        if (prevProps.orderBookSell !== this.props.orderBookSell) {
            this.setState({ orderBookSell: this.props.orderBookSell });
            if (Object.keys(this.props.orderBookSell).includes("sell")) {
                if (this.props.orderBookSell.length > 0) {
                    this.setState({ showMarketBuyButtonFlag: true });
                }
                else {
                    this.setState({ showMarketBuyButtonFlag: false });
                }
            }
        }
    }

    async componentDidMount() {
        await this.updatebalance(this.props.dispatch, this.props.account);
        this.unsubscribe_fill = db.collection('fill').doc(this.props.account).onSnapshot((snap) => {
            if (snap.data()) {
                let { price, amount, ordertype } = snap.data();
                const { account } = this.props;
                if (ordertype === "buy") {
                    if (this.state.ethPrice !== price) {
                        this.setState({ ethPrice: price });
                        db.collection('fill').doc(account).set({
                            ordertype: 0,
                            price: 0,
                            amount: 0,
                            flag: 0
                        })
                    }
                    if (this.state.ethAmount !== amount) {
                        this.setState({ ethAmount: amount });
                        db.collection('fill').doc(account).set({
                            ordertype: 0,
                            price: 0,
                            amount: 0,
                            flag: 0
                        })
                    }
                }
                if (ordertype === "sell") {
                    if (this.state.sellethAmount !== price) {
                        this.setState({ sellethPrice: price });
                        db.collection('fill').doc(account).set({
                            ordertype: 0,
                            price: 0,
                            amount: 0,
                            flag: 0
                        })
                    }
                    if (this.state.sellethPrice !== amount) {
                        this.setState({ sellethAmount: amount });
                        db.collection('fill').doc(account).set({
                            ordertype: 0,
                            price: 0,
                            amount: 0,
                            flag: 0
                        })
                    }
                }
            }
        });
        this.unsubscribe = db.collection('stateRealtime').doc('changeState').onSnapshot(async (snap) => {
            await this.updatebalance();
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe !== null) {
            this.unsubscribe();
        }
        if (this.unsubscribe_fill !== null) {
            this.unsubscribe_fill();
        }
    }

    onbuyChangeEthAmount(e) {
        let realvalue = e.target.value;
        if (realvalue) {
            realvalue = parseInt(realvalue);
            if (realvalue < 0)
                realvalue = 0;
            else if (realvalue > 999999)
                realvalue = 999999;
        }
        this.setState({ ethAmount: realvalue });
    }

    onbuyChangeEthPrice(e) {
        let realvalue = e.target.value;
        if (realvalue) {
            realvalue = (parseFloat(realvalue)).toFixed(2);
            // if (realvalue < 0.01) {
            //     realvalue = 0.01;
            // }
            if (realvalue < 0) {
                realvalue = 0.01;
            }
            else if (realvalue > 9999.99) {
                realvalue = 9999.99;
            }
        }
        this.setState({ ethPrice: realvalue });
    }

    onsellChangeEthAmount(e) {
        let realvalue = e.target.value;
        if (realvalue) {
            realvalue = parseInt(realvalue);
            if (realvalue < 0)
                realvalue = 0;
            else if (realvalue > 999999)
                realvalue = 999999;
        }
        this.setState({ sellethAmount: realvalue });
    }

    onsellChangeEthPrice(e) {
        let realvalue = e.target.value;
        if (realvalue) {
            realvalue = (parseFloat(realvalue)).toFixed(2);
            // if (realvalue < 0.01) {
            //     realvalue = 0.01;
            // }
            if (realvalue < 0) {
                realvalue = 0.01;
            }
            else if (realvalue > 9999.99) {
                realvalue = 9999.99;
            }
        }
        this.setState({ sellethPrice: realvalue });
    }

    onbuyChangeEthAmountMarket(e) {
        this.setState({ methAmount: parseFloat(e.target.value) });
        var minprice = 0.01;
        if (this.props.orderBookSell.length > 0) {
            minprice = parseFloat(ether(this.props.orderBookSell[0]._priceInWei));
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "Price must be higher than 0!",
            });
            return;
        }
        for (var i = 0; i < this.props.orderBookSell.length; i++) {
            if (minprice > parseFloat(ether(this.props.orderBookSell[i]._priceInWei))) {
                minprice = parseFloat(ether(this.props.orderBookSell[i]._priceInWei));
            }
        }
        this.setState({ methPrice: minprice });
    }

    onsellChangeEthAmountMarket(e) {
        this.setState({ msellethAmount: e.target.value });
        var maxprice = 0.01;
        if (this.props.orderBookBuy.length > 0) {
            maxprice = ether(parseFloat(this.props.orderBookBuy[0]._priceInWei));
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "Price must be higher than 0!",
            })
            return;
        }
        for (var i = 0; i < this.props.orderBookBuy.length; i++) {
            if (maxprice < ether(parseFloat(this.props.orderBookBuy[i]._priceInWei))) {
                maxprice = ether(parseFloat(this.props.orderBookBuy[i]._priceInWei));
            }
        }
        this.setState({ msellethPrice: maxprice });
    }

    async updatebalance() {
        let id = this.props.id;
        if (id === null || id === undefined) {
            id = "cronaldo";
        }
        var res = await axios.post(backUrl + "account/user_load_balance", { uid: localStorage.getItem("account-info"), id: id });
        if (res.data !== null && res.data.status && res.data.balance !== null && res.data.balance !== []) {
            this.props.dispatch(etherBalanceLoaded(res.data.balance[0]));
            this.props.dispatch(tokenBalanceLoaded(res.data.balance[1]));
        }
        this.setState({ showbuttonFlag: true });
        this.reset_values();
    }

    reset_values() {
        this.setState({ ethAmount: "" });
        this.setState({ sellethAmount: "" });
        this.setState({ ethPrice: "" });
        this.setState({ sellethPrice: "" });
        this.setState({ methAmount: "" });
        this.setState({ methPrice: "" });
        this.setState({ msellethAmount: "" });
        this.setState({ msellethPrice: "" });
    }

    async orderResProcess(res) {
        this.props.dispatch(balancesLoading());
        if (res === null) {
            Swal.fire({
                icon: 'error',
                title: 'Error...',
                text: "Error 404 - connection error!",
            });
        }
        else {
            if (res.status) {
                await this.updatebalance();
                let result_text = "Your order has been added to the orderbook as there is currently no matching offer for your bid. You can wait for another user to fill your order or you can cancel it.";
                if (res.result === "FullFill") {
                    result_text = "Your order was filled and executed and the tokens or cash have been added to your portfolio.";
                }
                else if (res.result === "PartFill") {
                    result_text = "Part of your order was filled instantly and the remainder was added to the orderbook as an offer. You can wait for another user to fill the order or you can cancel it.";
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Order Success',
                    text: `${result_text}`,
                });
            }
            else {
                if (res.error === "amount") {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: "The balance is not enough to execute this order!",
                    });
                }
                else if (res.error === "interaction") {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error...',
                        text: "The server is busy, please try again!",
                    });
                }
                else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: "Error interaction - please contact to admin!",
                    });
                }
            }
        }
        this.props.dispatch(balancesLoaded());
    }

    async send_makeBuyOrder(buyOrder, account, tokenBalance, etherBalance, id) {
        if (buyOrder.amount * buyOrder.price > etherBalance) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "The Cash balance is not enough to execute this order!",
            });
            this.reset_values();
            return;
        }
        this.props.dispatch(orderCancelling());
        this.setState({ showbuttonFlag: false });
        var makeBuyOrder_res = await axios.post(backUrl + "order/buy_order", { order: buyOrder, account: account, tokenbal: tokenBalance, etherbal: etherBalance, id: id, uid: localStorage.getItem("account-info") });
        await this.orderResProcess(makeBuyOrder_res.data);
        this.props.dispatch(updateOrderCancellingFlagFalse());
        this.setState({ showbuttonFlag: true });
    }

    async send_makeSellOrder(sellOrder, account, tokenBalance, etherBalance, id) {
        if (sellOrder.amount > tokenBalance) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: "The token balance is not enough to execute this order!",
            });
            this.reset_values();
            return;
        }
        this.props.dispatch(orderCancelling());
        this.setState({ showbuttonFlag: false });
        var makeSellOrder_res = await axios.post(backUrl + "order/sell_order", { order: sellOrder, account: account, tokenbal: tokenBalance, etherbal: etherBalance, id: id, uid: localStorage.getItem("account-info") });
        await this.orderResProcess(makeSellOrder_res.data);
        this.props.dispatch(updateOrderCancellingFlagFalse());
        this.setState({ showbuttonFlag: true });
    }

    renderShowForm() {
        const { id, account, tokenBalance, etherBalance } = this.props;
        return (
            <>
                {this.state.showbuttonFlag ? <Tabs defaultActiveKey="limit">
                    <Tab eventKey="limit" title="Limit">
                        <b>About Limit Orders</b>&nbsp;
                        <i className="fas fa-info-circle" style={{ cursor: "pointer" }} onClick={(event) => {
                            Swal.fire({
                                html:
                                    '<ul>' +
                                    `<h6>A limit order allows you to set the price that you would like to buy or sell a token for. If there is a matching offer on the orderbook for your price or better, the trade will be executed and you will receive your tokens or cash instantly. However, if there is no matching order your bid will be added to the orderbook where it will remain until another user fills the order or you cancel your order.</h6>` +
                                    '</ul>',
                                title: `Limit Order`,
                                showCancelButton: false,
                                confirmButtonColor: '#26de81',
                                // cancelButtonColor: '#d33',
                                confirmButtonText: 'OK'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                }
                            })
                        }}></i>
                        <div className="d-flex justify-content-between">
                            <div className="market-trade-buy">
                                <form action="#" onSubmit={(event) => {
                                    event.preventDefault(id);
                                    Swal.fire({
                                        html:
                                            '<ul>' +
                                            `<li> Order Type: Buy</li>` +
                                            `<li> Token:  ${id}</li>` +
                                            `<li> Price: £${(parseFloat(this.state.ethPrice)).toFixed(2)}</li>` +
                                            `<li> Amount: ${(parseFloat(this.state.ethAmount)).toFixed(2)}</li>` +
                                            `<li><b>Total: £${((Math.round(parseFloat(this.state.ethPrice) * parseFloat(this.state.ethAmount) * 1000)) / 1000).toFixed(2)}</li>` +
                                            '</ul>',
                                        title: 'Are you sure?',
                                        showCancelButton: true,
                                        confirmButtonColor: '#26de81',
                                        cancelButtonColor: '#d33',
                                        confirmButtonText: 'Confirm'
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            this.send_makeBuyOrder({ price: this.state.ethPrice, amount: this.state.ethAmount }, account, tokenBalance, etherBalance, id);
                                        }
                                    })
                                }}>
                                    <p>Cash Balance £{etherBalance ? (parseFloat(etherBalance)).toFixed(2) : ""}</p>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            onChange={(e) => this.onbuyChangeEthPrice(e)}
                                            placeholder="Price"
                                            value={this.state.ethPrice}
                                            // defaultValue={ethPrice}
                                            max="9999.99"
                                            min="0.01"
                                            required
                                            strict="true"
                                            step="0.01"
                                        />
                                        {/* <MaskedInput
                            className="form-control"
                            placeholder="Price"
                            // mask="00.00"
                            size="7"
                            value={ethPrice}
                            onChange={(e) => onbuyChangeEthPrice(e)}
                        /> */}
                                        <div className="input-group-append">
                                            <span className="input-group-text">Price</span>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Amount"
                                            onChange={(e) => this.onbuyChangeEthAmount(e)}
                                            value={this.state.ethAmount}
                                            // defaultValue={ethAmount}
                                            min="0"
                                            max="100000"
                                            mask="999999"
                                            required
                                            strict="true"
                                        />
                                        <span className="input-group-text">Amount</span>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Total"
                                            value={(this.state.ethPrice * this.state.ethAmount).toFixed(2)}
                                            required
                                            strict="true"
                                            disabled={true}
                                        />
                                        <span className="input-group-text">TOTAL</span>
                                    </div>
                                    <p>Shareburn={config.shareburnFee}%</p>
                                    {
                                        this.state.ethAmount ? <p>You will receive = {(parseFloat(this.state.ethAmount * (1 - 0.01 * parseInt(config.shareburnFee)))).toFixed(2)} Tokens</p> : <></>
                                    }
                                    <button type="submit" className="btn buy" id="btn-buy">
                                        Buy
                                    </button>
                                </form>
                            </div>
                            <div className="market-trade-sell">
                                <form action="#" onSubmit={(event) => {
                                    event.preventDefault();
                                    Swal.fire({
                                        html:
                                            '<ul>' +
                                            `<li> Order Type: Sell</li>` +
                                            `<li> Token:  ${id}</li>` +
                                            `<li> Price: £${(parseFloat(this.state.sellethPrice)).toFixed(2)}</li>` +
                                            `<li> Amount: ${(parseFloat(this.state.sellethAmount)).toFixed(2)}</li>` +
                                            `<li><b>Total: £${((Math.round(parseFloat(this.state.sellethPrice) * parseFloat(this.state.sellethAmount) * 1000)) / 1000).toFixed(2)}</li>` +
                                            '</ul>',
                                        title: 'Are you sure?',
                                        showCancelButton: true,
                                        confirmButtonColor: '#26de81',
                                        cancelButtonColor: '#d33',
                                        confirmButtonText: 'Confirm'
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            this.send_makeSellOrder({ price: this.state.sellethPrice, amount: this.state.sellethAmount }, account, tokenBalance, etherBalance, id);
                                        }
                                    })
                                }
                                }>
                                    <p>Available Tokens {tokenBalance ? (parseFloat(tokenBalance)).toFixed(2) : ""}</p>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Price"
                                            value={this.state.sellethPrice}
                                            // defaultValue={sellethPrice}
                                            onChange={(e) => this.onsellChangeEthPrice(e)}
                                            max="9999.99"
                                            min="0.01"
                                            required
                                            strict="true"
                                            step="0.01"
                                        />
                                        <div className="input-group-append">
                                            <span className="input-group-text">Price</span>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Amount"
                                            value={this.state.sellethAmount}
                                            // defaultValue={sellethAmount}
                                            onChange={(e) => this.onsellChangeEthAmount(e)}
                                            min="0"
                                            max="100000"
                                            required
                                            strict="true"

                                        />
                                        <span className="input-group-text">Amount</span>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Total"
                                            value={(this.state.sellethAmount * this.state.sellethPrice).toFixed(2)}
                                            required
                                            strict="true"
                                            disabled={true}
                                        />
                                        <span className="input-group-text">TOTAL</span>
                                    </div>
                                    <p>Fee={config.feesFee}%</p>
                                    {
                                        this.state.sellethAmount ? <p>You will receive = £{(parseFloat(this.state.sellethAmount * this.state.sellethPrice * (1 - 0.01 * parseInt(config.feesFee)))).toFixed(2)}</p> : <></>
                                    }
                                    <button type="submit" className="btn sell" id="btn-sell">Sell</button>
                                </form>
                            </div>
                        </div>
                    </Tab>
                    <Tab eventKey="market" title="Market">
                        <b>About Market Orders</b>&nbsp;
                        <i className="fas fa-info-circle" style={{ cursor: "pointer" }} onClick={(event) => {
                            Swal.fire({
                                html:
                                    '<ul>' +
                                    `<h6>A market order will execute at the best available price. Market orders are only available when there are offers on the orderbook.</h6>` +
                                    '</ul>',
                                title: `Market Order`,
                                showCancelButton: false,
                                confirmButtonColor: '#26de81',
                                // cancelButtonColor: '#d33',
                                confirmButtonText: 'OK'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                }
                            })
                        }}></i>
                        <div className="d-flex justify-content-between">
                            <div className="market-trade-buy">
                                <form action="#" onSubmit={(event) => {
                                    event.preventDefault();
                                    Swal.fire({
                                        html:
                                            '<ul>' +
                                            `<li> Order Type: Buy</li>` +
                                            `<li> Token:  ${id}</li>` +
                                            `<li> Price: £${(parseFloat(this.state.methPrice)).toFixed(2)}</li>` +
                                            `<li> Amount: ${(parseFloat(this.state.methAmount)).toFixed(2)}</li>` +
                                            `<li><b>Total: £${((Math.round(parseFloat(this.state.methPrice) * parseFloat(this.state.methAmount) * 1000)) / 1000).toFixed(2)}</li>` +
                                            '</ul>',
                                        title: 'Are you sure?',
                                        showCancelButton: true,
                                        confirmButtonColor: '#26de81',
                                        cancelButtonColor: '#d33',
                                        confirmButtonText: 'Confirm'
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            this.send_makeBuyOrder({ price: this.state.methPrice, amount: this.state.methAmount }, account, tokenBalance, etherBalance, id);
                                        }
                                    })
                                }}>
                                    <p>Cash balance £{etherBalance ? (parseFloat(etherBalance)).toFixed(2) : ""}</p>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Amount"
                                            value={this.state.methAmount}
                                            // defaultValue={sellethAmount}
                                            onChange={(e) => this.onbuyChangeEthAmountMarket(e)}
                                            min="0"
                                            max="100000"
                                            required
                                            strict="true"
                                            disabled={!this.state.showMarketBuyButtonFlag}
                                        />
                                        <span className="input-group-text">SHARES</span>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Total"
                                            value={((Math.round(parseFloat(this.state.methPrice * this.state.methAmount) * 1000)) / 1000).toFixed(2)}
                                            required
                                            strict="true"
                                            disabled={true}
                                        />
                                        <span className="input-group-text">TOTAL</span>
                                    </div>
                                    <p>Shareburn={config.shareburnFee}%</p>
                                    {
                                        this.state.methAmount ? <p>You will receive = {(parseFloat(this.state.methAmount * (1 - 0.01 * parseInt(config.shareburnFee)))).toFixed(2)} Tokens</p> : <></>
                                    }
                                    {
                                        this.state.showMarketBuyButtonFlag ? <button type="submit" className="btn buy" >
                                            Buy
                                        </button> : <Button variant="warning" className='btn' style={{
                                            textTransform: "uppercase", padding: "10px", marginTop: "30px", width: "100%", boxShadow: "0px 0px 15px 0px #ffc107ad"
                                        }}>Unavailable</Button>
                                    }
                                </form>
                            </div>
                            <div className="market-trade-sell">
                                <form action="#" onSubmit={(event) => {
                                    event.preventDefault();
                                    Swal.fire({
                                        html:
                                            '<ul>' +
                                            `<li> Order Type: Sell</li>` +
                                            `<li> Token:  ${id}</li>` +
                                            `<li> Price: £${(parseFloat(this.state.msellethPrice)).toFixed(2)}</li>` +
                                            `<li> Amount: ${(parseFloat(this.state.msellethAmount)).toFixed(2)}</li>` +
                                            `<li><b>Total: £${((Math.round(parseFloat(this.state.msellethPrice) * parseFloat(this.state.msellethAmount) * 1000)) / 1000).toFixed(2)}</li>` +
                                            '</ul>',
                                        title: 'Are you sure?',
                                        showCancelButton: true,
                                        confirmButtonColor: '#26de81',
                                        cancelButtonColor: '#d33',
                                        confirmButtonText: 'Confirm'
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            this.send_makeSellOrder({ price: this.state.msellethPrice, amount: this.state.msellethAmount }, account, tokenBalance, etherBalance, id);
                                        }
                                    })
                                }}>
                                    <p>Available Tokens {tokenBalance ? (parseFloat(tokenBalance)).toFixed(2) : ""}</p>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Amount"
                                            value={this.state.msellethAmount}
                                            // defaultValue={sellethAmount}
                                            onChange={(e) => this.onsellChangeEthAmountMarket(e)}
                                            min="0"
                                            max="100000"
                                            required
                                            strict="true"
                                            disabled={!this.state.showMarketSellButtonFlag}
                                        />
                                        <span className="input-group-text">SHARES</span>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Total"
                                            value={((Math.round(parseFloat(this.state.msellethAmount * this.state.msellethPrice) * 1000)) / 1000).toFixed(2)}
                                            required
                                            strict="true"
                                            disabled={true}
                                        />
                                        <span className="input-group-text">TOTAL</span>
                                    </div>
                                    <p>Fee={config.feesFee}%</p>
                                    {
                                        this.state.msellethAmount ? <p>You will receive = £{(parseFloat(this.state.msellethAmount * this.state.msellethPrice * (1 - 0.01 * parseInt(config.feesFee)))).toFixed(2)}</p> : <></>
                                    }
                                    {
                                        this.state.showMarketSellButtonFlag ? <button type="submit" className="btn sell">
                                            Sell
                                        </button> : <Button variant="warning" className='btn' style={{
                                            textTransform: "uppercase", padding: "10px", marginTop: "30px", width: "100%", boxShadow: "0px 0px 15px 0px #ffc107ad"
                                        }}>Unavailable</Button>
                                    }
                                </form>
                            </div>
                        </div>
                    </Tab>
                </Tabs> : <div className='market-trade-buy market_trade_wait_panel'>
                    <div>
                        <p className="market_trade_wait_text markets" style={{ fontSize: "25px", marginTop: "0px" }}>Please wait - executing order&nbsp; </p>
                        <Spinner />
                    </div>
                </div>}
            </>
        )
    }

    render() {
        return (
            <>
                <div className="market-trade">
                    {this.renderShowForm()}
                </div>
            </>
        );
    }
}

function mapStateToProps(state) {
    return {
        tokenBalance: tokenBalanceSelector(state),
        account: accountSelector(state),
        etherBalance: etherBalanceSelector(state),
    }
}

export default connect(mapStateToProps)(MarketTrade)
