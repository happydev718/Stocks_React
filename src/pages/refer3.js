import React, { useEffect, useState } from "react";
import { Tab, Row, Col, Nav } from "react-bootstrap";
import { auth } from "../components/firebase/firebase";
import { doGetAnUser } from "../components/firebase/auth";
import { useHistory } from "react-router-dom";

export default function Refer() {
  const [user, setUser] = useState(null);
  const account = localStorage.getItem("account-info");
  const history = useHistory();
  const currentUser = auth.currentUser;
  useEffect(() => {
    if (!account) {
      localStorage.clear();
      history.push("/login");
    }
    doGetAnUser(account).then((query) => {
      if (query.docs.length !== 0) {
        let res = query.docs[0].data();
        setUser(res);
      }
    });
  }, []);
  return (
    <>
      <div className="settings mtb15">
        <div className="container-fluid">
          <Tab.Container defaultActiveKey="refer-a-friend">
            <Row>
             
              <Col lg={9}>
                <Tab.Content>
                  <Tab.Pane eventKey="refer-a-friend">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">Your Unique Referral Links:</h5>
                        <div className="Refer-a-Friend">
                          <form>

                            <div className="form-row mt-4">
                              <div className="col-md-12">
                               <label htmlFor="formFirst">Link to Signup Page</label>
                                <input
                                  id="ReferralID"
                                  type="text"
                                  className="form-control"
                                  placeholder="ReferralID"
                                  value={"https://beta.stocksfc.com/signup?r=" + user?.uid}
                                />
                              </div>
                              </div>
                             <div className="form-row mt-4">
                              <div className="col-md-12">
                               <label htmlFor="formFirst">Link to StocksFC.com Homepage</label>
                                <input
                                  id="ReferralID"
                                  type="text"
                                  className="form-control"
                                  placeholder="ReferralID"
                                  value={"https://beta.stocksfc.com/r?r=" + user?.uid}
                                />
                              </div>


                              <div className="col-md-12">
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </div>
      </div>
    </>
  );
}
