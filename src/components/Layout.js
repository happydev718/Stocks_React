import React, {useEffect} from "react";
import Header from "./Header";
import ReactGA from 'react-ga';
import {useHistory} from 'react-router-dom'

const TRACKING_ID = "UA-217788201-1";

ReactGA.initialize(TRACKING_ID);

export default function Layout({children}) {
  const history = useHistory()

  useEffect(() => {
    return history.listen((location) => {
      ReactGA.pageview(window.location.pathname + window.location.search);
    })
  }, [history])

  return (
    <>
      <Header />
      {children}
    </>
  );
}
