/* Scripts */

/* Get weather from visitor's location */
function getWeather() {

    // Get visitor location
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            let country = data.country_name
            let city = data.city

            // Get weather by visitor city
            fetch('https://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=' + ((country = 'United States') ? 'imperial' : 'metric') + '&appid=d7c645ac37d857bc38af8edc24727a66')
            .then(response => response.json())
            .then(data => {
                // Returned API call
                console.log(data)

                let temp = data.main.temp
                let weather = data.weather[0].main
                console.log(temp + ', ' + weather)
            })
            .catch(error => {
                console.error('Error fetching weather data', error)
            })    
            
        })
        .catch(error => {
            console.error('Error fetching IP-based location:', error);
    });


}


getWeather()