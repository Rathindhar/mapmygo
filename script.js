let tracking = false;
let path = [];
let checkpoints = [];
let polyline = null;
let watchId = null;

let replayLine = null;
let replayTimer = null;

// Map setup
const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

// Center map once
navigator.geolocation.getCurrentPosition(pos => {
  map.setView([pos.coords.latitude, pos.coords.longitude], 16);
});

// Distance helper (meters)
function distance(p1, p2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;

  const dLat = toRad(p2[0] - p1[0]);
  const dLng = toRad(p2[1] - p1[1]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1[0])) *
    Math.cos(toRad(p2[0])) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// START tracking
function startTracking() {
  stopReplay();

  if (tracking) return;
  tracking = true;

  path = [];
  checkpoints = [];

  polyline = L.polyline([], {
    color: "#1a73e8",
    weight: 6
  }).addTo(map);

  watchId = navigator.geolocation.watchPosition(
    pos => {
      if (!tracking) return;

      const point = [pos.coords.latitude, pos.coords.longitude];

      if (
        path.length === 0 ||
        distance(path[path.length - 1], point) > 2
      ) {
        path.push(point);
        polyline.setLatLngs(path);
        map.panTo(point);
      }
    },
    err => console.log(err),
    { enableHighAccuracy: true }
  );
}

// ADD checkpoint
function addCheckpoint() {
  if (!tracking || path.length === 0) return;
  checkpoints.push(path[path.length - 1]);
}

// STOP tracking + SAVE
function stopTracking() {
  if (!tracking) return;

  tracking = false;
  navigator.geolocation.clearWatch(watchId);

  const journey = {
    id: Date.now(),
    path,
    checkpoints
  };

  let journeys = JSON.parse(localStorage.getItem("journeys")) || [];
  journeys.push(journey);
  localStorage.setItem("journeys", JSON.stringify(journeys));

  loadSavedRoutes();
  alert("Routes saved successfully and can be viewed later...");
}

// LOAD ROUTES LIST
function loadSavedRoutes() {
  const list = document.getElementById("routesList");
  list.innerHTML = "";

  const journeys = JSON.parse(localStorage.getItem("journeys")) || [];

  journeys.forEach((journey, index) => {
    const li = document.createElement("li");

    const name = document.createElement("span");
    name.textContent = "Route " + (index + 1);
    name.onclick = () => replayRoute(journey);

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.style.border = "none";
    del.style.background = "transparent";

    del.onclick = e => {
      e.stopPropagation();
      deleteRoute(index);
    };

    li.appendChild(name);
    li.appendChild(del);
    list.appendChild(li);
  });
}

// REPLAY ROUTE (ANIMATED)
function replayRoute(journey) {
  stopReplay();
  if (polyline) map.removeLayer(polyline);

  replayLine = L.polyline([], {
    color: "#ff5722",
    weight: 6
  }).addTo(map);

  let i = 0;
  replayTimer = setInterval(() => {
    if (i >= journey.path.length) {
      stopReplay();
      return;
    }
    replayLine.addLatLng(journey.path[i]);
    map.panTo(journey.path[i]);
    i++;
  }, 400);
}

function stopReplay() {
  if (replayTimer) clearInterval(replayTimer);
  replayTimer = null;
}

// DELETE ONE ROUTE
function deleteRoute(index) {
  let journeys = JSON.parse(localStorage.getItem("journeys")) || [];
  if (!journeys[index]) return;

  if (!confirm("Delete this route?")) return;

  journeys.splice(index, 1);
  localStorage.setItem("journeys", JSON.stringify(journeys));

  if (replayLine) map.removeLayer(replayLine);
  loadSavedRoutes();
}

// INIT
loadSavedRoutes();
