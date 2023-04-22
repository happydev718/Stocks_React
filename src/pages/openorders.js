import React, { } from 'react';
import AllOpenOrders from '../components/AllOpenOrders';
import Login from './login';
import { connect } from 'react-redux';

const OpenOrders = () => {

    let uid = localStorage.getItem("account-info");
    let account = localStorage.getItem("account-address");
    return (
        <>
            {
                uid && account ? (
                    <div className='fullpage'>
                        <div className="markets ptb15 fullpage">
                            {
                                // id.map((obj, key) => (
                                <AllOpenOrders />
                                // )
                                // )
                            }
                        </div>
                    </div>)
                    : <Login />
            }
        </>
    );
}

function mapStateToProps(state) {
    return {
    };
}

export default connect(mapStateToProps)(OpenOrders);
