import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000/api';
export const getInventory = async () => {
    const response = await axios.get(`${API_BASE_URL}/inventory`);
    return response.data;
};
export const addProduct = async (productData) => {
    const response = await axios.post(`${API_BASE_URL}/add-catalog`, productData);
    return response.data;
};
export const processInput = async (text) => {
    const response = await axios.post(`${API_BASE_URL}/process-input`, { text });
    return response.data;
};
export const processPrescriptionInput = async (text) => {
    const response = await axios.post(`${API_BASE_URL}/process-prescription`, { text });
    return response.data;
};
export const commitStock = async (grnData) => {
    const response = await axios.post(`${API_BASE_URL}/commit-stock`, grnData);
    return response.data;
};
export const uploadPDF = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await axios.post(`${API_BASE_URL}/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
export const transcribeAudio = async (blob) => {
    const formData = new FormData();
    formData.append('audio', blob, 'voice.wav');
    const response = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
export const deleteProduct = async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/inventory/${id}`);
    return response.data;
};
export const updateProduct = async (id, productData) => {
    const response = await axios.put(`${API_BASE_URL}/inventory/${id}`, productData);
    return response.data;
};
export const getSuppliers = async () => {
    const response = await axios.get(`${API_BASE_URL}/suppliers`);
    return response.data;
};
export const addSupplier = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/suppliers`, data);
    return response.data;
};
export const settleSupplierPayment = async (id) => {
    const response = await axios.put(`${API_BASE_URL}/suppliers/${id}/settle`);
    return response.data;
};
export const updateSupplier = async (id, data) => {
    const response = await axios.put(`${API_BASE_URL}/suppliers/${id}`, data);
    return response.data;
};
export const deleteSupplier = async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/suppliers/${id}`);
    return response.data;
};
export const getPurchaseOrdersList = async () => {
    const response = await axios.get(`${API_BASE_URL}/purchase-orders`);
    return response.data;
};
export const getDashboardStats = async () => {
    const response = await axios.get(`${API_BASE_URL}/dashboard-stats`);
    return response.data;
};
export const savePrescription = async (prescriptionData) => {
    const response = await axios.post(`${API_BASE_URL}/save-prescription`, prescriptionData);
    return response.data;
};
export const getPrescriptions = async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/prescriptions`, { params });
    return response.data;
};
export const getPrescriptionById = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/prescriptions/${id}`);
    return response.data;
};
export const getWardRequestsList = async () => {
    const response = await axios.get(`${API_BASE_URL}/ward-requests`);
    return response.data;
};
export const createWardRequest = async (requestData) => {
    const response = await axios.post(`${API_BASE_URL}/ward-requests`, requestData);
    return response.data;
};
export const updateWardRequestStatus = async (id, statusData) => {
    const response = await axios.put(`${API_BASE_URL}/ward-requests/${id}/status`, statusData);
    return response.data;
};
export const acknowledgeWardRequest = async (id) => {
    const response = await axios.put(`${API_BASE_URL}/ward-requests/${id}/acknowledge`);
    return response.data;
};
export const getShortageClaims = async () => {
    const response = await axios.get(`${API_BASE_URL}/shortage-claims`);
    return response.data;
};
export const login = async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
    return response.data;
};
export const getAccountingExceptions = async () => {
    const response = await axios.get(`${API_BASE_URL}/accounting/exceptions`);
    return response.data;
};
export const retryAccountingSync = async (id) => {
    const response = await axios.post(`${API_BASE_URL}/accounting/retry/${id}`);
    return response.data;
};
export const getZohoConfig = async () => {
    const response = await axios.get(`${API_BASE_URL}/accounting/config`);
    return response.data;
};
export const saveZohoConfig = async (config) => {
    const response = await axios.post(`${API_BASE_URL}/accounting/config`, config);
    return response.data;
};
export const autoProcessGRN = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await axios.post(`${API_BASE_URL}/grn/auto-process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000  
    });
    return response.data;
};
