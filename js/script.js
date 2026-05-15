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
  const themeSlug = theme === 'Dark' ? 'dark' : 'light';
  const favicon = document.querySelector('#favicon');
  if (favicon) {
    favicon.setAttribute('href', 'images/zk-favicon-' + themeSlug + '.ico');
  }
  document.querySelectorAll('.social-image').forEach((el) => {
    el.setAttribute(
      'content',
      'https://zainkho.com/images/zk-screenshot-' + themeSlug + '.png'
    );
  });
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
function isLocalDev() {
  const host = window.location.hostname;
  return (
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1'
  );
}

function resizeSplashCanvas() {
  const splash = document.querySelector('#splash');
  const splashCanvas = splash && splash.querySelector('canvas');
  if (!splash || !splashCanvas) return;

  const width = splash.clientWidth || window.innerWidth;
  const height = splash.clientHeight;

  splashCanvas.style.width = width + 'px';
  splashCanvas.style.height = height + 'px';
  splashCanvas.style.top = '0';
  splashCanvas.style.left = '0';
  splashCanvas.width = width;
  splashCanvas.height = height;
}

function getWeather() {
  // Local dev: skip IP geolocation (often blocked) and call OpenWeather directly
  if (isLocalDev()) {
    fetchWeatherForCity('New York', 'United States');
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
  const units = country == 'United States' ? 'imperial' : 'metric';
  const url =
    'https://api.openweathermap.org/data/2.5/weather?q=' +
    encodeURIComponent(city) +
    '&units=' +
    units +
    '&appid=d7c645ac37d857bc38af8edc24727a66';

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error('OpenWeather HTTP ' + response.status);
      }
      return response.json();
    })
    .then((data) => {
      if (!data.main || !data.weather) {
        throw new Error(data.message || 'Invalid weather response');
      }
      let temp = Math.round(data.main.temp);
      let openweather_weather = data.weather[0].main;
      showWeather(temp, openweather_weather, data.sys.sunset);
    })
    .catch((error) => {
      console.error('Error fetching weather data:', error);
    });
}

function showWeather(temp, openweather_weather, sunsetUnix) {
  const weatherEffect = document.querySelector('.weather-effect');
  const weatherIcon = document.querySelector('#weather-icon');
  const weatherDescription = document.querySelector('#weather_description');
  if (!weatherEffect || !weatherIcon || !weatherDescription) return;

  let sunset = sunsetUnix + '000';
  let effect = '';
  let icon;

  weatherEffect.style.display = 'block';

  if (['Thunderstorm', 'Drizzle', 'Rain'].includes(openweather_weather)) {
    icon = 'umbrella';
    effect = 'rain';
    weatherEffect.id = effect;
    const splash = document.querySelector('#splash');
    if (splash) splash.style.display = 'block';
  } else if (openweather_weather == 'Snow') {
    icon = 'snowflake';
    effect = 'snow';
    weatherEffect.id = effect;
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
    weatherEffect.id = effect;
  } else {
    if (new Date().getTime() > sunset) {
      icon = 'moon';
      if (theme == 'Dark') effect = 'stars';
      weatherEffect.id = effect;
    } else {
      icon = 'sun';
      weatherEffect.id = effect;
    }
  }

  weatherIcon.innerHTML = "<use href='images/sprites.svg#" + icon + "'></use>";
  weatherDescription.innerHTML = temp + '° & ' + openweather_weather;

  let currentIcon = icon;
  setInterval(() => {
    currentIcon = currentIcon == icon ? icon + '-animated' : icon;
    weatherIcon.innerHTML =
      "<use href='images/sprites.svg#" + currentIcon + "'></use>";
  }, 1000);

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

        // If rain, add splashes (thin reverse-rain strip at bottom)
        if (effect == 'rain') {
          tsParticles.loadJSON(
            'splash',
            'js/splash' + theme + '.json',
            function () {
              resizeSplashCanvas();
              setTimeout(resizeSplashCanvas, 50);
              setTimeout(resizeSplashCanvas, 200);
            }
          );
          window.addEventListener('resize', resizeSplashCanvas);
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
                  function () {
                    resizeSplashCanvas();
                  }
                );
              }
            }
          });
  }
}

function initWeather() {
  getWeather();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWeather);
} else {
  initWeather();
}

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
