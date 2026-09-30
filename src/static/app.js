document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginToggle = document.getElementById("teacher-login-toggle");
  const loginForm = document.getElementById("teacher-login-form");
  const teacherSession = document.getElementById("teacher-session");
  const teacherName = document.getElementById("teacher-name");
  const authMessage = document.getElementById("auth-message");
  const signupContainer = document.getElementById("signup-container");
  let isTeacher = false;
  let loginFormExpanded = false;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]
    );
  }

  function updateAuthUi(username) {
    isTeacher = Boolean(username);
    loginToggle.classList.toggle("hidden", isTeacher);
    loginForm.classList.toggle("hidden", isTeacher || !loginFormExpanded);
    teacherSession.classList.toggle("hidden", !isTeacher);
    signupContainer.classList.toggle("hidden", !isTeacher);
    teacherName.textContent = isTeacher ? `Signed in as ${username}` : "";
    fetchActivities();
  }

  function showAuthMessage(message, messageClass) {
    authMessage.textContent = message;
    authMessage.className = messageClass;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${escapeHtml(email)}</span>${
                        isTeacher
                          ? `<button class="delete-btn" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(email)}" aria-label="Remove ${escapeHtml(email)}">Remove</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  loginToggle.addEventListener("click", () => {
    loginFormExpanded = !loginFormExpanded;
    loginForm.classList.toggle("hidden", !loginFormExpanded);
    loginToggle.setAttribute("aria-expanded", String(loginFormExpanded));
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("teacher-username").value,
        password: document.getElementById("teacher-password").value,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      showAuthMessage(result.detail || "Unable to sign in.", "error");
      return;
    }
    loginForm.reset();
    loginFormExpanded = false;
    updateAuthUi(result.username);
    showAuthMessage("Teacher signed in.", "success");
  });

  document.getElementById("teacher-logout").addEventListener("click", async () => {
    await fetch("/auth/logout", { method: "POST" });
    loginFormExpanded = false;
    loginToggle.setAttribute("aria-expanded", "false");
    updateAuthUi(null);
    showAuthMessage("Signed out.", "info");
  });

  async function loadAuthStatus() {
    try {
      const response = await fetch("/auth/status");
      const result = await response.json();
      updateAuthUi(response.ok && result.authenticated ? result.username : null);
    } catch (error) {
      updateAuthUi(null);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  loadAuthStatus();
});
