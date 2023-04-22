import React, { useEffect } from "react";

const queryParams = new URLSearchParams(window.location.search);
const r = queryParams.get('r');

function ReferUser() {

    if (localStorage.getItem("referrer") === null) {
        localStorage.setItem('referrer', r);
    }
    // const referrer = localStorage.getItem('referrer');
    useEffect(() => {
        window.location.href = "https://stocksfc.com";
    }, []);

    return (
        <div>
            <h2>Redirecting</h2>
        </div>
    );
}

export default ReferUser;
