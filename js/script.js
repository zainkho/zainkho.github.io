// Scripts

// VARIABLES
let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'


// WEATHER
function getWeather() {

    // Get visitor location
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            let country = data.country_name
            let city = data.city

            // Get weather by visitor city
            fetch('https://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=' + ((country == 'United States') ? 'imperial' : 'metric') + '&appid=d7c645ac37d857bc38af8edc24727a66')
            .then(response => response.json())
            .then(data => {
                // Returned API call
                // console.log(data)

                let temp = Math.round(data.main.temp)
                let openweather_weather = data.weather[0].main
                let sunset = data.sys.sunset + '000'

                openweather_weather = 'Clouds' //testing
                
                // Show weather div
                document.querySelector('.weather-effect').style.display = 'block'


                // Particle effect weather
                if (['Thunderstorm', 'Drizzle', 'Rain'].includes(openweather_weather)) {
                    icon = 'umbrella'
                    effect = 'rain'
                    document.querySelector('.weather-effect').id = effect
                    document.querySelector('#splash').style.display = 'block'
                }
                else if (openweather_weather == 'Snow') {
                    icon = 'snowflake'
                    effect = 'snow'
                    document.querySelector('.weather-effect').id = effect
                }
                else if (['Mist', 'Smoke', 'Haze', 'Dust', 'Fog', 'Sand', 'Ash', 'Squall', 'Tornado', 'Clouds'].includes(openweather_weather)) {
                    icon = 'cloud'
                    effect = 'cloudy'
                    document.querySelector('.weather-effect').id = effect
                }
                else {
                    if (new Date().getTime() > sunset) {
                        console.log(new Date().getTime())
                        console.log(sunset)
                        icon = 'moon'
                        effect = 'moon'
                        document.querySelector('.weather-effect').id = effect
                    }
                    else {
                        icon = 'sun'
                        effect = 'sun'
                        document.querySelector('.weather-effect').id = effect
                    }
                }

                // Data for weather badge
            document.querySelector('#weather-icon').innerHTML = '<use href=\'images/icons/sprites.svg#' + icon + '\'></use>'
                document.querySelector('#weather_description').innerHTML = temp + '° & ' + openweather_weather

                // Swap SVG for weather icon animation
                currentIcon = icon
                setInterval(() => {
                    currentIcon = currentIcon == icon ? icon + '-animated' : icon;
                    document.querySelector('#weather-icon').innerHTML = '<use href=\'images/icons/sprites.svg#' + currentIcon + '\'></use>'
                }, 1000)

                // Initiate particle effect
                tsParticles.loadJSON(effect, 'js/' + effect + theme + '.json', function() {});

                // If rain, add splahes
                if (effect == 'rain') { 
                    tsParticles.loadJSON('splash', 'js/splash' + theme + '.json', function() {}); 
                }

                // Update particle colors if theme changes
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                    if (event.matches) { theme = 'Dark' } 
                    else { theme = 'Light' }

                    tsParticles.loadJSON(effect, 'js/' + effect + theme + '.json', function() {});
                    if (effect == 'rain') { 
                        tsParticles.loadJSON('splash', 'js/splash' + theme + '.json', function() {}); 
                    }
                })

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