let tracking = false;
let path = [];
let polyline;
let watchId;

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
  tracking = true;

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
  const last = path[path.length - 1];
  L.marker(last).addTo(map);
}

function stopTracking() {
  tracking = false;
  navigator.geolocation.clearWatch(watchId);
  alert("Journey saved!");
}

