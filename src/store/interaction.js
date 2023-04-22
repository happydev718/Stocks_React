import {
    cancelledOrdersLoaded,
    filledOrdersLoaded,
    allOrdersLoaded,
    openOrdersLoaded,
} from './actions';
import Swal from 'sweetalert2';
import axios from 'axios';
import { backUrl } from "../components/constants/routes";
import firebase from "firebase";

export const loadAllOrders = async (dispatch, allOrders_result) => {
    try {
        await dispatch(cancelledOrdersLoaded(allOrders_result.cancelledOrders));
        await dispatch(filledOrdersLoaded(allOrders_result.filledOrders));
        await dispatch(allOrdersLoaded(allOrders_result.allOrders));
    } catch (error) {
        return;
    }
}


