import axios from 'axios'

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

axios.defaults.baseURL = API_BASE_URL
axios.defaults.headers.common['Content-Type'] = 'application/json'

export default axios
