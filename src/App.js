import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import './App.css';

import { SET_PLACE_RESULTS, SET_SELECTED_PLACE, SET_BOUNDRY } from './reducers/MapAction';
import axios from 'axios';
import Map from './components/Map';
import ResultView from './components/ResultView';


class GeoUtil {
  static toRad(value) {
    return value * Math.PI / 180;
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    let R = 3959; // Radius of the Earth in miles
    let dLat = GeoUtil.toRad(lat2 - lat1);
    let dLon = GeoUtil.toRad(lon2 - lon1);
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(GeoUtil.toRad(lat1)) * Math.cos(GeoUtil.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // The distance in miles
  }
}

const styles = (theme) => ({
  root: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column-reverse',
    },
  },
  resultViewContainer: {
    width: 400,
    minWidth: 400,
    boxShadow: '-10px 0px 30px black',
    [theme.breakpoints.down('sm')]: {
      width: 300,
      minWidth: 300,
    },
    [theme.breakpoints.down('xs')]: {
      boxShadow: 'none',
      width: '100%',
      minWidth: '100%',
      height: '50vh',
    },
    transition: 'height 300ms ease-in',
  },
  mapContainer: {
    height: '100%',
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '50vh',
      opacity: 1,
      visibility: 'visible',
    },
    transition: 'opacity 300ms ease-in, visibility 300ms ease-in',
  },
});

class App extends Component {

  async componentDidMount() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS6vkFSX31BgJIP3EhZRHZyr-zB02eX1j_DriTYnpT1j2YZ61-1KpNP6aeCRIgLj-rIK8j8I_V-wrde/pub?output=csv'; // Replace with your Google Sheets CSV file URL

    axios.get(csvUrl)    // Use Axios to fetch the CSV data
      .then((response) => {
        let parsedCsvData = parseCSV(response.data);        // Parse the CSV data into an array of objects        
        parsedCsvData = parsedCsvData.map(e => ({ name: e.Name, location: { lat: e.Lat, lng: e.Lng, formattedAddress: e.Address } }))
        //Get Current Location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            let point = { center: { lat: latitude, lng: longitude }, zoom: 12 };
            this.props.setBoundry(point);
            parsedCsvData = parsedCsvData.filter(e => GeoUtil.calculateDistance(latitude, longitude, e.location.lat, e.location.lng) <= 10);
            parsedCsvData.push({name:"My Pos", location: {lat: latitude, lng: longitude, formattedAddress: "My Location"}});
            parsedCsvData.forEach((place, index) => {
              place.key = index;
            });
            this.props.setSearchResult(parsedCsvData);
          }, error);

        } else {
          console.log("Geolocation not supported");
        }
      })
      .catch((error) => {
        console.error('Error fetching CSV data:', error);
      });


    function error() {
      console.log("Unable to retrieve your location");
    }

    function parseCSV(csvText) {
      const rows = csvText.split(/\r?\n/);        // Use a regular expression to split the CSV text into rows while handling '\r'
      const headers = rows[0].split(',');        // Extract headers (assumes the first row is the header row)
      const data = [];        // Initialize an array to store the parsed data
      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i].split(',');          // Use the regular expression to split the row while handling '\r'
        const rowObject = {};
        for (let j = 0; j < headers.length; j++) {
          rowObject[headers[j]] = rowData[j];
        }
        data.push(rowObject);
      }
      return data;
    }

  }



  render() {
    const { classes, selected, width } = this.props;
    let isMobile = isWidthDown('xs', width);

    const resultViewStyles = {};
    const mapStyles = {};

    if (selected && isMobile) {
      resultViewStyles.height = '100vh';
      mapStyles.opacity = 0;
      mapStyles.visibility = 'hidden';
    }

    return (
      <div className={classes.root}>
        <div className={classes.resultViewContainer} style={resultViewStyles}>
          <ResultView />
        </div>
        <div className={classes.mapContainer} style={mapStyles}>
          <Map />
        </div>
      </div>
    );
  }
}

App.propTypes = {
  setSearchResult: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  selected: PropTypes.object,
  width: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  selected: state.map.selectedPlace,
});

const mapActionToProps = (dispatch) => ({
  setSearchResult: (places) =>
    dispatch({
      type: SET_PLACE_RESULTS,
      places,
    }),
  setSelectedPlace: (place) =>
    dispatch({
      type: SET_SELECTED_PLACE,
      place,
    }),
  setBoundry: (point) =>
    dispatch({
      type: SET_BOUNDRY,
      center: point.center,
      zoom: point.zoom
    }),
});

export default connect(
  mapStateToProps,
  mapActionToProps
)(withWidth()(withStyles(styles)(App)));
