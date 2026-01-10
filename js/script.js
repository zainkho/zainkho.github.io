// Scripts

// VARIABLES
let theme = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'Dark'
  : 'Light';

// Update year label color based on scroll position
function updateYearLabelColor() {
  const yearLabels = document.querySelectorAll('.year-label');

  function handleScroll() {
    yearLabels.forEach((label) => {
      const rect = label.getBoundingClientRect();
      // When the element is at the top of the viewport (accounting for padding)
      if (rect.top <= 0 && rect.bottom > 0) {
        label.style.color = 'var(--darkerShade)';
      } else {
        label.style.color = 'var(--darkShade)';
      }
    });
  }

  // Add scroll listener
  window.addEventListener('scroll', handleScroll);
  // Initial check
  handleScroll();
}

// Call the function when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  updateYearLabelColor();
});

// META ELEMENTS
// Set favicon and OG image depending on theme
function setMetaElements() {
  theme = theme.toLowerCase();
  document
    .querySelector('#favicon')
    .setAttribute('href', 'images/zk-favicon-' + theme + '.ico');
  document
    .querySelector('.social-image')
    .setAttribute(
      'content',
      'https://zainkho.com/images/zk-screenshot-' + theme + '.png'
    );
}

// Update particle colors if theme changes
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (event) => {
    if (event.matches) {
      theme = 'Dark';
    } else {
      theme = 'Light';
    }

    document
      .querySelector('#favicon')
      .setAttribute('href', 'images/zk-favicon-' + theme + '.ico');
  });
setInterval(setMetaElements, 1000);

// WEATHER
function getWeather() {
  // Check if we're on localhost - skip API call and use default city
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  
  if (isLocalhost) {
    // Use default city for localhost testing
    const city = 'New York';
    const country = 'United States';
    fetchWeatherForCity(city, country);
    return;
  }
  
  // Get visitor location - using ip-api.com which has better CORS support
  fetch('https://ip-api.com/json/?fields=status,message,country,city')
    .then((response) => response.json())
    .then((data) => {
      // Check if API returned an error
      if (data.status === 'fail') {
        throw new Error(data.message || 'Failed to get location');
      }
      
      let country = data.country;
      let city = data.city;
      
      // Fallback if city is not available
      if (!city) {
        city = 'New York';
        country = 'United States';
      }
      
      fetchWeatherForCity(city, country);
    })
    .catch((error) => {
      console.error('Error fetching IP-based location:', error);
      // Fallback to default city on error
      fetchWeatherForCity('New York', 'United States');
    });
}

function fetchWeatherForCity(city, country) {
  // Get weather by visitor city
  fetch(
    'https://api.openweathermap.org/data/2.5/weather?q=' +
      city +
      '&units=' +
      (country == 'United States' ? 'imperial' : 'metric') +
      '&appid=d7c645ac37d857bc38af8edc24727a66'
  )
    .then((response) => response.json())
    .then((data) => {
      // Returned API call
      // console.log(data)

      let temp = Math.round(data.main.temp);
      let openweather_weather = data.weather[0].main;
      let sunset = data.sys.sunset + '000';
      let effect = '';

      // Show weather div
      document.querySelector('.weather-effect').style.display = 'block';

      // Set icon + copy + effect depending on weather
      if (
        ['Thunderstorm', 'Drizzle', 'Rain'].includes(openweather_weather)
      ) {
        icon = 'umbrella';
        effect = 'rain';
        document.querySelector('.weather-effect').id = effect;
        document.querySelector('#splash').style.display = 'block';
      } else if (openweather_weather == 'Snow') {
        icon = 'snowflake';
        effect = 'snow';
        document.querySelector('.weather-effect').id = effect;
      } else if (
        [
          'Mist',
          'Smoke',
          'Haze',
          'Dust',
          'Fog',
          'Sand',
          'Ash',
          'Squall',
          'Tornado',
          'Clouds',
        ].includes(openweather_weather)
      ) {
        icon = 'cloud';
        document.querySelector('.weather-effect').id = effect;
      } else {
        if (new Date().getTime() > sunset) {
          icon = 'moon';
          if (theme == 'Dark') {
            effect = 'stars';
          }
          document.querySelector('.weather-effect').id = effect;
        } else {
          icon = 'sun';
          document.querySelector('.weather-effect').id = effect;
        }
      }

      // Data for weather badge
      document.querySelector('#weather-icon').innerHTML =
        "<use href='images/sprites.svg#" + icon + "'></use>";
      document.querySelector('#weather_description').innerHTML =
        temp + '° & ' + openweather_weather;

      // Weather icon animation
      currentIcon = icon;
      setInterval(() => {
        currentIcon = currentIcon == icon ? icon + '-animated' : icon;
        document.querySelector('#weather-icon').innerHTML =
          "<use href='images/sprites.svg#" + currentIcon + "'></use>";
      }, 1000);

      // Initiate particle effect for snow, rain, or moon weather
      if (['rain', 'snow', 'stars'].includes(effect)) {
        console.log('Loading tsParticles for effect:', effect);
        
        tsParticles.loadJSON(
          effect,
          'js/' + effect + theme + '.json',
          function (container) {
            console.log('tsParticles callback fired for:', effect, container);
            
            // Function to resize canvas to viewport
            const resizeCanvasToViewport = function(canvasElement) {
              if (!canvasElement) {
                console.warn('Canvas element not found for effect:', effect);
                return;
              }
              
              const vw = window.innerWidth;
              const vh = window.innerHeight;
              
              // Set CSS display size
              canvasElement.style.width = vw + 'px';
              canvasElement.style.height = vh + 'px';
              canvasElement.style.maxWidth = 'none';
              canvasElement.style.position = 'absolute';
              canvasElement.style.top = '0';
              canvasElement.style.left = '0';
              
              // Set canvas internal resolution (width/height attributes)
              canvasElement.width = vw;
              canvasElement.height = vh;
              
              console.log('Canvas resized:', {
                effect: effect,
                cssWidth: canvasElement.style.width,
                cssHeight: canvasElement.style.height,
                canvasWidth: canvasElement.width,
                canvasHeight: canvasElement.height,
                viewportWidth: vw,
                viewportHeight: vh
              });
            };
            
            // Try multiple approaches to find and resize the canvas
            const tryResize = function() {
              // Method 1: Query by ID
              let canvas = document.querySelector('#' + effect + ' canvas');
              
              // Method 2: Query from container if provided
              if (!canvas && container) {
                canvas = container.querySelector('canvas');
              }
              
              // Method 3: Query from weather-effect
              if (!canvas) {
                const weatherEffect = document.querySelector('.weather-effect');
                if (weatherEffect) {
                  canvas = weatherEffect.querySelector('canvas');
                }
              }
              
              if (canvas) {
                resizeCanvasToViewport(canvas);
              } else {
                console.warn('Canvas not found, retrying...');
                setTimeout(tryResize, 50);
              }
            };
            
            // Try immediately and with delays
            tryResize();
            setTimeout(tryResize, 100);
            setTimeout(tryResize, 300);
            
            // Handle window resize
            const resizeHandler = function() {
              const canvas = document.querySelector('#' + effect + ' canvas') || 
                            document.querySelector('.weather-effect canvas');
              resizeCanvasToViewport(canvas);
            };
            window.addEventListener('resize', resizeHandler);
          }
        );

        // If rain, add splahes
        if (effect == 'rain') {
          tsParticles.loadJSON(
            'splash',
            'js/splash' + theme + '.json',
            function () {
              // Resize splash canvas to viewport
              setTimeout(function() {
                const splashCanvas = document.querySelector('#splash canvas');
                if (splashCanvas) {
                  const vw = window.innerWidth;
                  const vh = window.innerHeight;
                  splashCanvas.style.width = vw + 'px';
                  splashCanvas.style.height = vh + 'px';
                  splashCanvas.style.maxWidth = 'none';
                  splashCanvas.style.position = 'absolute';
                  splashCanvas.style.top = '0';
                  splashCanvas.style.left = '0';
                  splashCanvas.width = vw;
                  splashCanvas.height = vh;
                  
                  console.log('Splash canvas resized:', {
                    cssWidth: splashCanvas.style.width,
                    cssHeight: splashCanvas.style.height,
                    canvasWidth: splashCanvas.width,
                    canvasHeight: splashCanvas.height
                  });
                }
              }, 100);
            }
          );
        }

        // Update particle colors if theme changes
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', (event) => {
            if (event.matches) {
              theme = 'Dark';
            } else {
              theme = 'Light';
            }

            if (!((theme == 'Light') & (effect == 'stars'))) {
              tsParticles.loadJSON(
                effect,
                'js/' + effect + theme + '.json',
                function () {}
              );
              if (effect == 'rain') {
                tsParticles.loadJSON(
                  'splash',
                  'js/splash' + theme + '.json',
                  function () {}
                );
              }
            }
          });
      }
    })
    .catch((error) => {
      console.error('Error fetching weather data', error);
    });
}
getWeather();

// Project filtering
document.addEventListener('DOMContentLoaded', function () {
  const filterButtons = document.querySelectorAll('#project-filters .button');
  const yearGroups = document.querySelectorAll('.year-group');

  function filterProjects(year) {
    // Update button states
    filterButtons.forEach((button) => {
      if (button.dataset.filter === year) {
        button.id = 'selected';
      } else {
        button.id = '';
      }
    });

    // Show/hide year groups
    yearGroups.forEach((group) => {
      if (year === 'all' || group.dataset.year === year) {
        group.style.display = '';
      } else {
        group.style.display = 'none';
      }
    });
  }

  // Add click handlers to filter buttons
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterProjects(button.dataset.filter);
    });
  });

  // Initialize with "all" filter
  filterProjects('all');
});
