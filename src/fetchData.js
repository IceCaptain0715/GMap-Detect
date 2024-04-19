import { useEffect, useState } from 'react'
import axios from 'axios'; // Import Axios

export default function FetchCSVData(props) {
    const [csvData, setCsvData] = useState([]);

    useEffect(() => {
        fetchCSVData();    // Fetch the CSV data when the component mounts
    }, []); // The empty array ensures that this effect runs only once, like componentDidMount

    const fetchCSVData = () => {
        
    }

    
    return csvData;
}