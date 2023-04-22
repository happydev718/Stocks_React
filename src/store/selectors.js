import { get, groupBy, maxBy, minBy } from 'lodash'
import { createSelector } from 'reselect'
import moment from 'moment'
import { GREEN, RED, ether } from '../helpers'

// TODO: Move me to helpers file
const precision = 100;
export const formatBalance = (balance) => {
    let updated = 0;
    if (balance > 10 ^ 20) {
        updated = balance;
    } else {
        updated = parseFloat(balance).toFixed(2) // Use 2 decimal places
    }
    return updated
}

const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const web3 = state => get(state, 'web3.connection')
export const web3Selector = createSelector(web3, w => w)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tl => tl)

const token = state => get(state, 'token.contract')
export const tokenSelector = createSelector(token, t => t)

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, el => el)

const exchange = state => get(state, 'exchange.contract')
export const exchangeSelector = createSelector(exchange, e => e)

export const contractsLoadedSelector = createSelector(
    account,
    (a) => (a)
)
// All Orders
const openOrdersLoaded = state => get(state, 'exchange.openOrders.loaded', false)
const openOrders = state => get(state, 'exchange.openOrders.data', [])

const allOrdersLoaded = state => get(state, 'exchange.allOrders.loaded', false)
// const allOrders = state => get(state, 'exchange.allOrders.data', [])

// Cancelled orders
const cancelledOrdersLoaded = state => get(state, 'exchange.cancelledOrders.loaded', false)
export const cancelledOrdersLoadedSelector = createSelector(cancelledOrdersLoaded, loaded => loaded)

const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
export const cancelledOrdersSelector = createSelector(cancelledOrders, o => o)

// Filled Orders
const filledOrdersLoaded = state => get(state, 'exchange.filledOrders.loaded', false)
export const filledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

const filledOrders = state => get(state, 'exchange.filledOrders.data', [])
export const filledOrdersSelector = createSelector(
    filledOrders,
    (orders) => {
        // Sort orders by date ascending for price comparison
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)
        // Decorate the orders
        orders = decorateFilledOrders(orders)
        // Sort orders by date descending for display
        orders = orders.sort((a, b) => b.timestamp - a.timestamp)
        return orders
    }
)

const decorateFilledOrders = (orders) => {
    // Track previous order to compare history
    let previousOrder = orders[0]
    return (
        orders.map((order) => {
            order = decorateFilledOrder(order, previousOrder)
            previousOrder = order // Update the previous order once it's decorated
            return (order)
        })
    )
}

const decorateOrder = (order) => {
    // Calculate token price to 5 decimal places
    let tokenPrice = Math.round(ether(order._priceInWei) * precision) / precision
    return ({
        ...order,
        etherAmount: tokenPrice * ether(order._amountInWei),
        tokenAmount: ether(order._amountInWei),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')
    })
}

const decorateFilledOrder = (order, previousOrder) => {
    let tokenPrice = Math.round(ether(order._priceInWei) * precision) / precision
    return ({
        ...order,
        tokenPriceClass: tokenPriceClass(order, previousOrder),
        etherAmount: ether(order._amountInWei) * ether(order._priceInWei),
        tokenAmount: ether(order._amountInWei),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')
    })
}

const tokenPriceClass = (order, preOrder) => {
    // Show green price if order price higher than previous order
    // Show red price if order price lower than previous order
    if (order.orderType === "buy") {
        return GREEN // success
    } else {
        return RED // danger
    }
}

const orderBookLoaded = state => openOrdersLoaded(state) && allOrdersLoaded(state) && filledOrdersLoaded(state) && cancelledOrdersLoaded(state)
export const orderBookLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

export const orderBookSelector = createSelector(
    openOrders,
    (orders) => {
        // Decorate orders
        orders.map((order) => {
            order = decorateOrder(order)
            order = { ...order, orderTypeClass: (order.orderType === 'buy' ? GREEN : RED), orderFillAction: order.orderType === 'buy' ? 'sell' : 'buy' }
            return (order)
        })
        orders = groupBy(orders, 'orderType')
        // Fetch buy orders
        const buyOrders = get(orders, 'buy', [])
        // Sort buy orders by token price
        orders = {
            ...orders,
            buyOrders: buyOrders.sort((a, b) => a._priceInWei - b._priceInWei)
        }
        // Fetch sell orders
        const sellOrders = get(orders, 'sell', [])
        // Sort sell orders by token price
        orders = {
            ...orders,
            sellOrders: sellOrders.sort((a, b) => b._priceInWei - a._priceInWei)
        }
        return orders
    }
)

export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

export const myFilledOrdersSelector = createSelector(
    account,
    filledOrders,
    (account, orders) => {
        // Find our orders
        orders = orders.filter((o) => o._who === account)
        orders = decorateMyFilledOrders(orders, account)
        return orders
    }
)

const decorateMyFilledOrders = (orders, account) => {
    return (
        orders.map((order) => {
            if (order._who === account) {
                order = decorateOrder(order)
                order = decorateMyFilledOrder(order, account)
                return (order);
            }
            return {};
        })
    )
}

const decorateMyFilledOrder = (order) => {
    let orderType = order.orderType;

    return ({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED),
        orderSign: (orderType === 'buy' ? '+' : '-')
    })
}

export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

export const myOpenOrdersSelector = createSelector(
    account,
    openOrders,
    (account, orders) => {
        // Filter orders created by current account
        orders = orders.filter((o) => o._who === account)
        // Decorate orders - add display attributes
        orders = decorateMyOpenOrders(orders)
        // Sort orders by date descending
        orders = orders.sort((a, b) => b.timestamp - a.timestamp)
        return orders
    }
)

const decorateMyOpenOrders = (orders, account) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order)
            order = decorateMyOpenOrder(order, account)
            return (order)
        })
    )
}

const decorateMyOpenOrder = (order) => {
    return ({
        ...order,
        orderTypeClass: (order.orderType === 'buy' ? GREEN : RED)
    })
}

export const priceChartLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

export const priceChartSelector = createSelector(
    filledOrders,
    (orders) => {
        // Sort orders by date ascending to compare history
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)
        // Decorate orders - add display attributes
        // Get last 2 order for final price & price change
        let secondLastOrder, lastOrder
        [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)
        // get last order price
        const lastPrice = ether(get(lastOrder, '_priceInWei', 0))
        // get second last order price
        const secondLastPrice = ether(get(secondLastOrder, '_priceInWei', 0))
        return ({
            lastPrice,
            lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
            series: [{
                name: "Price",
                data: buildGraphData(orders)
            }]
        })
    }
)

export const buildGraphData = (orders) => {
    // Group the orders by hour for the graph
    orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())
    // Get each hour where data exists
    const hours = Object.keys(orders)
    // Build the graph series
    const graphData = hours.map((hour) => {
        // Fetch all the orders from current hour
        const group = orders[hour]
        // Calculate price values - open, high, low, close
        var open = group[0] // first order
        var high = maxBy(group, '_priceInWei') // high price
        var low = minBy(group, '_priceInWei') // low price
        var close = group[group.length - 1] // last order
        open = parseFloat(ether(open._priceInWei)).toFixed(2);
        high = parseFloat(ether(high._priceInWei)).toFixed(2);
        low = parseFloat(ether(low._priceInWei)).toFixed(2);
        close = parseFloat(ether(close._priceInWei)).toFixed(2);
        return ({
            x: new Date(hour),
            y: [open, high, low, close]
        })
    })

    return graphData
}

const orderCancelling = state => get(state, 'exchange.orderCancelling', false)
export const orderCancellingSelector = createSelector(orderCancelling, status => status)

const orderFilling = state => get(state, 'exchange.orderFilling', false)
export const orderFillingSelector = createSelector(orderFilling, status => status)

// BALANCES
const balancesLoading = state => get(state, 'exchange.balancesLoading', true)
export const balancesLoadingSelector = createSelector(balancesLoading, status => status)

const etherBalance = state => get(state, 'web3.balance', 0)
export const etherBalanceSelector = createSelector(
    etherBalance,
    (balance) => {
        return formatBalance(balance)
    }
)

const tokenBalance = state => get(state, 'token.balance', 0)
export const tokenBalanceSelector = createSelector(
    tokenBalance,
    (balance) => {
        return formatBalance(balance)
    }
)

const exchangeEtherBalance = state => get(state, 'exchange.etherBalance', 0)
export const exchangeEtherBalanceSelector = createSelector(
    exchangeEtherBalance,
    (balance) => {
        return formatBalance(balance)
    }
)

const exchangeTokenBalance = state => get(state, 'exchange.tokenBalance', 0)
export const exchangeTokenBalanceSelector = createSelector(
    exchangeTokenBalance,
    (balance) => {
        return formatBalance(balance)
    }
)

const etherDepositAmount = state => get(state, 'exchange.etherDepositAmount', null)
export const etherDepositAmountSelector = createSelector(etherDepositAmount, amount => amount)

const etherWithdrawAmount = state => get(state, 'exchange.etherWithdrawAmount', null)
export const etherWithdrawAmountSelector = createSelector(etherWithdrawAmount, amount => amount)

const tokenDepositAmount = state => get(state, 'exchange.tokenDepositAmount', null)
export const tokenDepositAmountSelector = createSelector(tokenDepositAmount, amount => amount)

const tokenWithdrawAmount = state => get(state, 'exchange.tokenWithdrawAmount', null)
export const tokenWithdrawAmountSelector = createSelector(tokenWithdrawAmount, amount => amount)

const buyOrder = state => get(state, 'exchange.buyOrder', {})
export const buyOrderSelector = createSelector(buyOrder, order => order)

const sellOrder = state => get(state, 'exchange.sellOrder', {})
export const sellOrderSelector = createSelector(sellOrder, order => order)

// exchange order show flag
const updateOrderShowFlagFalse = state => get(state, 'exchange.updateOrderShowFlagFalse', false)
export const updateOrderShowFlagFalseSelector = createSelector(updateOrderShowFlagFalse, state => state)

// loggedin user selectors
const loginUserName = state => get(state, 'user.name', null)
export const userNameSelector = createSelector(loginUserName, name => name)

const loginUserEmail = state => get(state, 'user.email', null)
export const userEmailSelector = createSelector(loginUserEmail, email => email)

const loginUserUid = state => get(state, 'user.uid', null)
export const userUidSelector = createSelector(loginUserUid, uid => uid)

const endTimer = state => get(state, 'timer.status', null)
export const timerSelector = createSelector(endTimer, status => status)

const allOrderList = state => get(state, 'allOrder.list', null)
export const orderListSelector = createSelector(allOrderList, list => list)
