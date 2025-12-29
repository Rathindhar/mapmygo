let tracking = false;
let path = [];
let checkpoints = [];
let polyline;
let watchId;
let startTime;


const map = L.map("map").setView([0, 0], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

navigator.geolocation.getCurrentPosition(
  (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    map.setView([lat, lng], 16);
    L.marker([lat, lng]).addTo(map);
  },
  (err) => {
    alert("Location access denied");
  }
);


function startTracking() {
  path = [];
  checkpoints = [];
  tracking = true;
  startTime = new Date().toISOString();

  if (polyline) map.removeLayer(polyline);
  polyline = L.polyline(path, { color: "blue" }).addTo(map);

  watchId = navigator.geolocation.watchPosition(pos => {
    if (!tracking) return;

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const point = [lat, lng];

    path.push(point);
    polyline.setLatLngs(path);
    map.setView(point);
  });
}


function addCheckpoint() {
  if (!path.length) return;

  const point = path[path.length - 1];
  checkpoints.push(point);

  L.marker(point).addTo(map);
}


function stopTracking() {
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

  alert("Journey saved!");
}


