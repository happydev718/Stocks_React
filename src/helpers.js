import Web3 from 'web3';

const web3 = new Web3(new Web3.providers.HttpProvider('https:data.stocksfc.com:3200'));

export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000';
export const GREEN = 'success'
export const RED = 'danger'
// Shortcut to avoid passing around web3 connection
export const ether = (wei) => {
    if (wei) {
        return parseFloat(web3.utils.fromWei(web3.utils.toBN(wei), "ether"));
    }
}
export const tokens = ether
// Get account
export const create_account = () => {
    return web3.eth.accounts.create();
}
