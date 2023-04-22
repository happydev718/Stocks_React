import React, { Suspense, lazy } from 'react';
import { Switch, Route } from "react-router-dom";
import Layout from '../components/Layout';
import IpoRouting from './Iporouting';
import Routing from './routing';
import PlayerStateRouting from './playerstaterouting';
import RoutingForPortfolio from './routingforportfolio';
// import "bootstrap/dist/css/bootstrap.css";
const OpenOrders = lazy(() => import('./openorders'));
const Recent = lazy(() => import('./recent'));
const Myrewards = lazy(() => import('./myrewards'));
const Players = lazy(() => import('../pages/players'));
//const Portfolio = lazy(() => import('../pages/portfolio'));
const Rankings = lazy(() => import('../pages/rankings'));
const TeamOfTheWeek = lazy(() => import('../pages/teamoftheweek'));
const TeamOfTheMonth = lazy(() => import('../pages/teamofthemonth'));
const TeamOfTheSeason = lazy(() => import('../pages/teamoftheseason'));
const Payouts = lazy(() => import('../pages/payouts'));
const Profile = lazy(() => import('./profile'));
const Wallet = lazy(() => import('./wallet'));
const Settings = lazy(() => import('./settings'));
const Login = lazy(() => import('./login'));
const Change = lazy(() => import('./change'));
const Reset = lazy(() => import('./reset'));
const OtpVerify = lazy(() => import('./otp-verify'));
const OtpNumber = lazy(() => import('./otp-number'));
const Lock = lazy(() => import('./lock'));
const TermsAndConditions = lazy(() => import('./terms-and-conditions'));
const MarketRules = lazy(() => import('./market-rules'));
const PrivacyPolicy = lazy(() => import('./privacy-policy'));
const News = lazy(() => import('./news'));
const Signup = lazy(() => import('./signup'));
const Notfound = lazy(() => import('./notfound'));
const Ipos = lazy(() => import('./ipos'));
// const PlayerStats = lazy(() => import('./playerstats'));
const Inplay = lazy(() => import('./inplay'));
const ReferUser = lazy(() => import('./r'));
const ReferUser2 = lazy(() => import('./refer'));

export default function index() {
    return (
        <>
            <Layout>
                <Suspense fallback={<div>Loading...</div>}>
                    <Switch>
                        <Route exact path="/players/:id">
                            <Routing />
                        </Route>
                        <Route path="/ipo/:id">
                            <IpoRouting />
                        </Route>
                        <Route path="/players">
                            <Players />
                        </Route>
                        <Route path="/openorders">
                            <OpenOrders />
                        </Route>
                        <Route path="/recents">
                            <Recent />
                        </Route>
                        <Route path="/myrewards">
                            <Myrewards />
                        </Route>
                        <Route path="/portfolio">
                            <RoutingForPortfolio />
                        </Route>
                        <Route path="/rankings">
                            <Rankings />
                        </Route>
                        <Route path="/teamoftheweek">
                            <TeamOfTheWeek />
                        </Route>
                        <Route path="/teamofthemonth">
                            <TeamOfTheMonth />
                        </Route>
                        <Route path="/teamoftheseason">
                            <TeamOfTheSeason />
                        </Route>
                        <Route path="/payouts">
                            <Payouts />
                        </Route>
                        <Route path="/profile">
                            <Profile />
                        </Route>
                        <Route path="/wallet">
                            <Wallet />
                        </Route>
                        <Route path="/settings">
                            <Settings />
                        </Route>
                        <Route path="/signup">
                            <Signup />
                        </Route>
                        <Route path="/reset">
                            <Reset />
                        </Route>
                        <Route path="/change">
                            <Change />
                        </Route>
                        <Route path="/otp-verify">
                            <OtpVerify />
                        </Route>
                        <Route path="/otp-number">
                            <OtpNumber />
                        </Route>
                        <Route path="/lock">
                            <Lock />
                        </Route>
                        <Route path="/terms-and-conditions">
                            <TermsAndConditions />
                        </Route>
                        <Route path="/news">
                            <News />
                        </Route>
                        <Route path="/notfound">
                            <Notfound />
                        </Route>
                        <Route path="/ipos">
                            <Ipos />
                        </Route>
                        <Route path="/playerstats/:id">
                            <PlayerStateRouting />
                        </Route>
                        <Route path="/inplay">
                            <Inplay />
                        </Route>
                        <Route path="/r">
                            <ReferUser />
                        </Route>
                        <Route path="/market-rules">
                            <MarketRules />
                        </Route>
                        <Route path="/privacy-policy">
                            <PrivacyPolicy />
                        </Route>
                        <Route path="/refer">
                            <ReferUser2 />
                        </Route>
                        <Route >
                            <Login />
                        </Route>
                    </Switch>
                </Suspense>
            </Layout>
        </>
    );
}
