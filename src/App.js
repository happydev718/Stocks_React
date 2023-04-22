import React, {Component} from 'react';
import {BrowserRouter, Route} from 'react-router-dom';
import {ThemeProvider} from './context/ThemeContext';
import Index from './pages';
import ReactGA from 'react-ga';
import Swal from 'sweetalert2';

const TRACKING_ID = "G-62H1HT2XC9";
ReactGA.initialize(TRACKING_ID);


export default class App extends Component {

    state = {
        theme: 'dark',
    };

    componentDidMount() {
        // console.log("app.js componentDidMount = : ", this.state.theme);
        if (this.state.theme === 'dark') {
            if ( !document.body.classList.contains("dark")) {
                document.body.classList.add('dark');    
            }
            if ( document.body.classList.contains("light")) {
                document.body.classList.remove('light');    
            }
        } else {
            if ( document.body.classList.contains("dark")) {
                document.body.classList.remove('dark');    
            }
            if ( !document.body.classList.contains("light")) {
                document.body.classList.add('light');    
            }
        }
        let visited = localStorage["alreadyVisited"];
        if (visited) {
            //  this.setState({ viewPopup: false })
            //do not view Popup
        } else {
            //this is the first time
            localStorage["alreadyVisited"] = true;
            this.showPopup();
            //  this.setState({ viewPopup: true});
        }
    }

    showPopup = () => {
        Swal.fire({
            title: 'Announcement',
            html:
                'The StocksFC Beta Test has restarted and will remain open until the live launch!' +
                '<p/>' +
                'The real crypto platform will launch soon.' +
                '<br/>' +
                'Create an account now to gain access to the private Pre-IPO round.' +
                '<br/>' +
                '<br/></p>' +
                '<a href="https://discord.gg/nCgkhNZesZ">Discord</a><br>' +
                '<a href="https://twitter.com/stocks_fc">Twitter</a><br>' +
                '<a href="https://link.medium.com/iurre80R4mb">Medium</a>',
            confirmButtonText: 'Confirm',
            showCloseButton: true,
            closeButtonHtml: `<button class="btn-close btn-close-white"></button>`,
        }).then((result) => {
            if (result.isConfirmed) {
            }
        })
    }

    render() {
        return (
            <>
                <BrowserRouter>
                    <Route component={ScrollToTop} />
                    <ThemeProvider
                        value={{
                            data: this.state,
                            update: () => {
                                this.setState((state) => ({
                                    theme:
                                        state.theme === 'light'
                                            ? (this.theme = 'dark')
                                            : (this.theme = 'light'),
                                }));
                                var themestr = this.state.theme, index;
                                index = themestr.indexOf('dark');
                                if (index !== -1) {
                                    localStorage.setItem('theme', 'light');
                                } else {
                                    localStorage.setItem('theme', 'dark');
                                }
                            },
                        }}
                    >
                        <Index />
                    </ThemeProvider>
                </BrowserRouter>
            </>
        );
    }
}

const ScrollToTop = () => {
    window.scrollTo(0, 0);
    return null;
};


