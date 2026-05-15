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
const SVG_NS = 'http://www.w3.org/2000/svg';
let weatherIconTimer = null;

function setupWeatherIcon(svg, iconName) {
  svg.replaceChildren();
  svg.setAttribute('viewBox', '0 0 16 16');

  const base = document.createElementNS(SVG_NS, 'use');
  base.setAttribute('href', 'images/sprites.svg#' + iconName);
  base.classList.add('weather-icon-base');

  const anim = document.createElementNS(SVG_NS, 'use');
  anim.setAttribute('href', 'images/sprites.svg#' + iconName + '-animated');
  anim.classList.add('weather-icon-anim');

  svg.appendChild(base);
  svg.appendChild(anim);
  svg.classList.remove('is-animated');
}

function startWeatherIconCycle(svg) {
  if (weatherIconTimer) clearInterval(weatherIconTimer);
  weatherIconTimer = setInterval(() => {
    svg.classList.toggle('is-animated');
  }, 1000);
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

function loadWeatherParticles(tagId, jsonPath, onReady) {
  const loaded = tsParticles.loadJSON(tagId, jsonPath);

  if (loaded && typeof loaded.then === 'function') {
    loaded
      .then(function (container) {
        if (onReady) onReady(container);
      })
      .catch(function (err) {
        console.error('Error loading particles for', tagId, err);
      });
  }
}

function resizeWeatherCanvas(canvasElement) {
  if (!canvasElement) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  canvasElement.style.width = vw + 'px';
  canvasElement.style.height = vh + 'px';
  canvasElement.style.maxWidth = 'none';
  canvasElement.style.position = 'absolute';
  canvasElement.style.top = '0';
  canvasElement.style.left = '0';

  canvasElement.width = vw;
  canvasElement.height = vh;
}

function onWeatherParticlesReady(effect, container) {
  const tryResize = function () {
    let canvas =
      (container && container.canvas && container.canvas.element) ||
      document.querySelector('#' + effect + ' canvas');

    if (!canvas) {
      const weatherEffect = document.querySelector('.weather-effect');
      if (weatherEffect) {
        canvas = weatherEffect.querySelector('canvas');
      }
    }

    if (canvas) {
      resizeWeatherCanvas(canvas);
    } else {
      setTimeout(tryResize, 50);
    }
  };

  tryResize();
  setTimeout(tryResize, 100);
  setTimeout(tryResize, 300);
}

function onSplashParticlesReady() {
  resizeSplashCanvas();
  setTimeout(resizeSplashCanvas, 50);
  setTimeout(resizeSplashCanvas, 200);
}

function getWeather() {
  fetch('https://ip-api.com/json/?fields=status,message,country,city')
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'fail') {
        throw new Error(data.message || 'Failed to get location');
      }

      if (!data.city || !data.country) {
        throw new Error('Location missing city or country');
      }

      fetchWeatherForCity(data.city, data.country);
    })
    .catch((error) => {
      console.error('Error fetching IP-based location:', error);
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

  setupWeatherIcon(weatherIcon, icon);
  startWeatherIconCycle(weatherIcon);
  weatherDescription.innerHTML = temp + '° & ' + openweather_weather;

  if (['rain', 'snow', 'stars'].includes(effect)) {
        loadWeatherParticles(
          effect,
          'js/' + effect + theme + '.json',
          function (container) {
            onWeatherParticlesReady(effect, container);
          }
        );

        if (effect == 'rain') {
          loadWeatherParticles(
            'splash',
            'js/splash' + theme + '.json',
            onSplashParticlesReady
          );
          window.addEventListener('resize', resizeSplashCanvas);
        }

        window
          .matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', (event) => {
            if (event.matches) {
              theme = 'Dark';
            } else {
              theme = 'Light';
            }

            if (!((theme == 'Light') & (effect == 'stars'))) {
              loadWeatherParticles(
                effect,
                'js/' + effect + theme + '.json',
                function (container) {
                  onWeatherParticlesReady(effect, container);
                }
              );
              if (effect == 'rain') {
                loadWeatherParticles(
                  'splash',
                  'js/splash' + theme + '.json',
                  onSplashParticlesReady
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

window.addEventListener('resize', function () {
  const rainCanvas = document.querySelector('#rain canvas');
  if (rainCanvas) resizeWeatherCanvas(rainCanvas);
});

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
