import React, {useEffect} from 'react';
import Recentall from '../components/Recentall';
import Login from './login';
import {connect} from 'react-redux'
// import { db } from "../components/firebase/firebase";

const Recent = () => {
    let uid = localStorage.getItem("account-info");
    // const [id, setId] = useState([]);
    // let ids = []
    useEffect(() => {
        async function fetchID() {
            // if (uid) {
            //     const ref = db.collection("tokens");
            //     const snapshot = await ref.get();
            //     snapshot.forEach(doc => {
            //         ids.push(doc.data().exchangeName);
            //     });
            //     // setId(ids);
            // }
        }
        fetchID();
    }, []);


    return (
        <>
            {
                uid ? (
                    <div className='fullpage'>
                        <div className="markets ptb15 fullpage">
                            {
                                // id.map((obj, key) => (
                                <Recentall />
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

export default connect(mapStateToProps)(Recent);
