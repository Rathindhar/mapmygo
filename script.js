let tracking = false;
let path = [];
let checkpoints = [];
let checkpointMarkers = [];
let polyline = null;
let watchId = null;
let startTime = null;

let savedRouteLayers = [];
let savedCheckpointMarkers = [];

// Map setup
const map = L.map("map").setView([0, 0], 16);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { attribution: "© OpenStreetMap" }
).addTo(map);

// Center map once
navigator.geolocation.getCurrentPosition(
  pos => map.setView([pos.coords.latitude, pos.coords.longitude], 16),
  () => alert("Location access denied")
);

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
  if (tracking) return;

  tracking = true;
  startTime = new Date().toISOString();
  path = [];
  checkpoints = [];

  polyline = L.polyline([], {
    color: "#1a73e8",
    weight: 6
  }).addTo(map);

  watchId = navigator.geolocation.watchPosition(
    pos => {
      if (!tracking) return;

      const point = [
        pos.coords.latitude,
        pos.coords.longitude
      ];

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
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}

// ADD checkpoint
function addCheckpoint() {
  if (!tracking || path.length === 0) return;

  const point = path[path.length - 1];
  checkpoints.push(point);

  const marker = L.marker(point).addTo(map);
  checkpointMarkers.push(marker);
}

// STOP tracking + SAVE
function stopTracking() {
  if (!tracking) return;

  tracking = false;
  navigator.geolocation.clearWatch(watchId);

  const journey = {
    id: Date.now(),
    startTime,
    endTime: new Date().toISOString(),
    path,
    checkpoints
  };

  let journeys = JSON.parse(localStorage.getItem("journeys")) || [];
  journeys.push(journey);
  localStorage.setItem("journeys", JSON.stringify(journeys));

  loadSavedRoutesList();
  alert("Journey saved");
}

// LOAD ROUTE LIST
function loadSavedRoutesList() {
  const list = document.getElementById("routesList");
  list.innerHTML = "";

  const journeys = JSON.parse(localStorage.getItem("journeys")) || [];

  journeys.forEach((journey, index) => {
    const li = document.createElement("li");

    const title = document.createElement("span");
    title.textContent =
      `Route ${index + 1} — ` +
      new Date(journey.startTime).toLocaleString();

    title.onclick = () => showSavedRoute(journey);

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.style.border = "none";
    del.style.background = "transparent";
    del.onclick = e => {
      e.stopPropagation();
      deleteRoute(index);
    };

    li.appendChild(title);
    li.appendChild(del);
    list.appendChild(li);
  });
}

// SHOW SELECTED ROUTE
function showSavedRoute(journey) {
  savedRouteLayers.forEach(l => map.removeLayer(l));
  savedCheckpointMarkers.forEach(m => map.removeLayer(m));

  savedRouteLayers = [];
  savedCheckpointMarkers = [];

  const line = L.polyline(journey.path, {
    color: "#555",
    weight: 5
  }).addTo(map);

  savedRouteLayers.push(line);

  journey.checkpoints.forEach(p => {
    const m = L.marker(p).addTo(map);
    savedCheckpointMarkers.push(m);
  });

  map.fitBounds(line.getBounds());
}

// DELETE ROUTE
function deleteRoute(index) {
  let journeys = JSON.parse(localStorage.getItem("journeys")) || [];
  if (!journeys[index]) return;

  if (!confirm("Delete this route?")) return;

  journeys.splice(index, 1);
  localStorage.setItem("journeys", JSON.stringify(journeys));

  savedRouteLayers.forEach(l => map.removeLayer(l));
  savedCheckpointMarkers.forEach(m => map.removeLayer(m));

  savedRouteLayers = [];
  savedCheckpointMarkers = [];

  loadSavedRoutesList();
}

// INIT
loadSavedRoutesList();
