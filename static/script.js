/*function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 3000);
}

function openCreateModal() {
    document.getElementById("createModal").style.display = "flex";
}

function closeCreateModal() {
    document.getElementById("createModal").style.display = "none";
}

async function createRide() {
    const data = {
        name: document.getElementById("create-name").value,
        contact: document.getElementById("create-contact").value,
        destination: document.getElementById("create-destination").value,
        date: document.getElementById("create-date").value,
        start_time: parseInt(document.getElementById("create-start").value),
        end_time: parseInt(document.getElementById("create-end").value),
        seats: parseInt(document.getElementById("create-seats").value)
    };

    const res = await fetch("/rides", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    const result = await res.json();
    showToast(result.message || result.error);

    closeCreateModal();
    searchRides();
}

async function searchRides() {
    const destination = document.getElementById("search-destination").value;
    const date = document.getElementById("search-date").value;
    const start = document.getElementById("search-start").value;
    const end = document.getElementById("search-end").value;

    const res = await fetch(`/rides/search?destination=${destination}&date=${date}&start_time=${start}&end_time=${end}`);
    const rides = await res.json();

    const results = document.getElementById("results");
    results.innerHTML = "";

    rides.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride-card";

        const statusClass = r.seats_available > 0 ? "open" : "full";
        const statusText = r.seats_available > 0 ? "Open" : "Full";

        div.innerHTML = `
            <h3>${r.destination}</h3>
            <p>${r.date}</p>
            <p>${r.start_time} - ${r.end_time}</p>
            <span class="badge ${statusClass}">${statusText}</span>
            <p>Seats: ${r.seats_available}</p>
            <button ${r.seats_available <= 0 ? "disabled" : ""} onclick="joinRide(${r.id})">
                Join Ride
            </button>
        `;

        results.appendChild(div);
    });
}

async function joinRide(id) {
    const name = prompt("Enter your name");
    const contact = prompt("Enter your contact");

    const res = await fetch("/rides/join", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ride_id: id, name, contact})
    });

    const result = await res.json();
    showToast(result.message || result.error);
    searchRides();
}*/
// ===============================
// Toast System
// ===============================
console.log("JS LOADED");
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.style.display = "block";
    toast.style.backgroundColor = isError ? "#ef4444" : "#111827";

    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

// ===============================
// Modal Controls
// ===============================
function openCreateModal() {
    document.getElementById("createModal").style.display = "flex";
}

function closeCreateModal() {
    document.getElementById("createModal").style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("createModal");
    if (event.target === modal) {
        closeCreateModal();
    }
};

// ===============================
// Clear Create Form
// ===============================
function clearCreateForm() {
    document.getElementById("create-name").value = "";
    document.getElementById("create-contact").value = "";
    document.getElementById("create-destination").value = "";
    document.getElementById("create-date").value = "";
    document.getElementById("create-start").value = "";
    document.getElementById("create-end").value = "";
    document.getElementById("create-seats").value = "";
}

// ===============================
// Create Ride
// ===============================
async function createRide() {
    const data = {
        name: document.getElementById("create-name").value.trim(),
        contact: document.getElementById("create-contact").value.trim(),
        destination: document.getElementById("create-destination").value.trim(),
        date: document.getElementById("create-date").value,
        start_time: parseInt(document.getElementById("create-start").value),
        end_time: parseInt(document.getElementById("create-end").value),
        seats: parseInt(document.getElementById("create-seats").value)
    };

    // Basic validation
    if (!data.name || !data.contact || !data.destination ||
        !data.date || !data.start_time || !data.end_time || !data.seats) {
        showToast("Please fill all fields", true);
        return;
    }

    try {
        const response = await fetch("/rides", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.error) {
            showToast(result.error, true);
        } else {
            showToast(result.message || "Ride created successfully");
            clearCreateForm();
            closeCreateModal();
            searchRides(); // auto refresh
        }
    } catch (error) {
        showToast("Server error. Please try again.", true);
    }
}

// ===============================
// Search Rides
// ===============================
async function searchRides() {
    const destination = document.getElementById("search-destination").value.trim();
    const date = document.getElementById("search-date").value;
    const start = document.getElementById("search-start").value;
    const end = document.getElementById("search-end").value;

    if (!destination || !date || !start || !end) {
        showToast("Fill all search fields", true);
        return;
    }

    try {
        const response = await fetch(
            `/rides/search?destination=${destination}&date=${date}&start_time=${start}&end_time=${end}`
        );

        const rides = await response.json();

        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";

        if (!rides || rides.length === 0) {
            resultsDiv.innerHTML = "<p style='opacity:0.6'>No rides found.</p>";
            return;
        }

        rides.forEach(ride => {
            const card = document.createElement("div");
            card.className = "ride-card";

            const statusClass = ride.seats_available > 0 ? "open" : "full";
            const statusText = ride.seats_available > 0 ? "Open" : "Full";

            card.innerHTML = `
                <h3>${ride.destination}</h3>
                <p><strong>Date:</strong> ${ride.date}</p>
                <p><strong>Time:</strong> ${ride.start_time} - ${ride.end_time}</p>
                <span class="badge ${statusClass}">${statusText}</span>
                <p style="margin-top:8px;"><strong>Seats:</strong> ${ride.seats_available}</p>
                <button ${ride.seats_available <= 0 ? "disabled" : ""}
                    onclick="joinRide(${ride.id})">
                    Join Ride
                </button>
            `;

            resultsDiv.appendChild(card);
        });

    } catch (error) {
        showToast("Search failed. Try again.", true);
    }
}

let selectedRideId = null;

// Open Join Modal
function joinRide(rideId) {
    selectedRideId = rideId;
    document.getElementById("joinModal").style.display = "flex";
}

// Close Join Modal
function closeJoinModal() {
    document.getElementById("joinModal").style.display = "none";
    document.getElementById("join-name").value = "";
    document.getElementById("join-contact").value = "";
}

// Confirm Join
async function confirmJoinRide() {
    const name = document.getElementById("join-name").value.trim();
    const contact = document.getElementById("join-contact").value.trim();

    if (!name || !contact) {
        showToast("Fill all fields", true);
        return;
    }

    try {
        const response = await fetch("/rides/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ride_id: selectedRideId,
                name: name,
                contact: contact
            })
        });

        const result = await response.json();

        if (result.error) {
            showToast(result.error, true);
        } else {
            showToast(result.message || "Joined successfully");
            closeJoinModal();
            searchRides();
        }
    } catch (error) {
        showToast("Join failed", true);
    }
}