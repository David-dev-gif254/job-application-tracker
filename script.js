// ===============================
// JOB APPLICATION TRACKER
// ===============================

const API_URL = "https://job-application-tracker-cp1z.onrender.com/api/applications";

// ===============================
// HTML ELEMENTS
// ===============================

const form = document.querySelector("#application-form");
const applicationsSection = document.querySelector(".applications");

const totalApplications = document.querySelector("#total-applications");
const appliedCount = document.querySelector("#applied-count");
const interviewCount = document.querySelector("#interview-count");
const acceptedCount = document.querySelector("#accepted-count");
const rejectedCount = document.querySelector("#rejected-count");

const editSection = document.querySelector("#edit-section");
const editForm = document.querySelector("#edit-form");
const cancelEditButton = document.querySelector("#cancel-edit");

const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const sortSelect = document.querySelector("#sort-select");

const clearAllButton = document.querySelector("#clear-all");


// ===============================
// APPLICATION DATA
// ===============================

let applications = [];
let editingId = null;


// ===============================
// LOAD APPLICATIONS
// ===============================

async function loadApplications() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load applications.");
        }

        applications = await response.json();

        displayApplications();

    } catch (error) {

        console.error("Error loading applications:", error);

        alert("Could not connect to Flask backend.");
    }
}


// ===============================
// UPDATE DASHBOARD
// ===============================

function updateStatistics() {

    totalApplications.textContent = applications.length;

    appliedCount.textContent =
        applications.filter(
            application => application.status === "Applied"
        ).length;

    interviewCount.textContent =
        applications.filter(
            application => application.status === "Interview"
        ).length;

    acceptedCount.textContent =
        applications.filter(
            application => application.status === "Accepted"
        ).length;

    rejectedCount.textContent =
        applications.filter(
            application => application.status === "Rejected"
        ).length;
}


// ===============================
// CREATE STATUS BADGE
// ===============================

function createStatusBadge(status) {

    const badge = document.createElement("span");

    badge.className = "status-badge";

    if (status === "Applied") {
        badge.classList.add("status-applied");
    }

    else if (status === "Interview") {
        badge.classList.add("status-interview");
    }

    else if (status === "Rejected") {
        badge.classList.add("status-rejected");
    }

    else if (status === "Accepted") {
        badge.classList.add("status-accepted");
    }

    badge.textContent = status;

    return badge;
}


// ===============================
// DISPLAY APPLICATIONS
// ===============================

function displayApplications() {

    const existingApplications =
        applicationsSection.querySelectorAll(".application");

    existingApplications.forEach(
        application => application.remove()
    );

    const existingMessage =
        applicationsSection.querySelector(".empty-message");

    if (existingMessage) {
        existingMessage.remove();
    }


    // SEARCH
    const searchText =
        searchInput.value.toLowerCase().trim();


    // STATUS FILTER
    const selectedStatus =
        statusFilter.value;


    // FILTER
    let filteredApplications =
        applications.filter(function (application) {

            const company =
                application.company.toLowerCase();

            const position =
                application.position.toLowerCase();


            const
            matchesSearch =
                company.includes(searchText) ||
                position.includes(searchText);


            const matchesStatus =
                selectedStatus === "All" ||
                application.status === selectedStatus;


            return matchesSearch && matchesStatus;
        });


    // ===============================
    // SORT
    // ===============================

    filteredApplications.sort(function (a, b) {

        const dateA = a.date || "";
        const dateB = b.date || "";


        if (sortSelect.value === "newest") {

            return dateB.localeCompare(dateA);

        } else {

            return dateA.localeCompare(dateB);
        }
    });


    // ===============================
    // NO RESULTS
    // ===============================

    if (filteredApplications.length === 0) {

        const message =
            document.createElement("p");

        message.className = "empty-message";

        if (applications.length === 0) {

            message.textContent =
                "No applications added yet.";

        } else {

            message.textContent =
                "No applications match your search.";
        }

        applicationsSection.appendChild(message);

        updateStatistics();

        return;
    }


    // ===============================
    // DISPLAY EACH APPLICATION
    // ===============================

    filteredApplications.forEach(function (application) {

        const applicationElement =
            document.createElement("div");

        applicationElement.className =
            "application";


        // COMPANY
        const title =
            document.createElement("h3");

        title.textContent =
            application.company;

        applicationElement.appendChild(title);


        // POSITION
        const position =
            document.createElement("p");

        const positionLabel =
            document.createElement("strong");

        positionLabel.textContent =
            "Position: ";

        position.appendChild(positionLabel);

        position.appendChild(
            document.createTextNode(
                application.position
            )
        );

        applicationElement.appendChild(position);


        // STATUS
        const statusParagraph =
            document.createElement("p");

        const statusLabel =
            document.createElement("strong");

        statusLabel.textContent =
            "Status: ";

        statusParagraph.appendChild(statusLabel);

        statusParagraph.appendChild(
            createStatusBadge(application.status)
        );

        applicationElement.appendChild(statusParagraph);


        // DATE
        const date =
            document.createElement("p");

        const dateLabel =
            document.createElement("strong");

        dateLabel.textContent =
            "Application Date: ";

        date.appendChild(dateLabel);

        date.appendChild(
            document.createTextNode(
                application.date || "Not provided"
            )
        );

        applicationElement.appendChild(date);


        // JOB LINK
        if (application.url) {

            const urlParagraph =
                document.createElement("p");

            const urlLabel =
                document.createElement("strong");

            urlLabel.textContent =
                "Job Link: ";

            urlParagraph.appendChild(urlLabel);


            const link =
                document.createElement("a");

            link.href =
                application.url;

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";

            link.textContent =
                "View Job";


            urlParagraph.appendChild(link);

            applicationElement.appendChild(
                urlParagraph
            );
        }


        // NOTES
        if (application.notes) {

            const notes =
                document.createElement("p");



            const notesLabel =
            document.createElement("strong");

            notesLabel.textContent =
                "Notes: ";

            notes.appendChild(notesLabel);

            notes.appendChild(
                document.createTextNode(
                    application.notes
                )
            );

            applicationElement.appendChild(notes);
        }


        // EDIT BUTTON
        const editButton =
            document.createElement("button");

        editButton.className =
            "edit-button";

        editButton.textContent =
            "Edit";

        editButton.addEventListener(
            "click",
            function () {

                openEditForm(application.id);
            }
        );

        applicationElement.appendChild(editButton);


        // DELETE BUTTON
        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "delete-button";

        deleteButton.textContent =
            "Delete";

        deleteButton.addEventListener(
            "click",
            function () {

                deleteApplication(application.id);
            }
        );

        applicationElement.appendChild(deleteButton);


        // ADD CARD TO PAGE
        applicationsSection.appendChild(
            applicationElement
        );

    });


    updateStatistics();
}


// ===============================
// ADD APPLICATION
// ===============================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const company =
            document.querySelector("#company").value.trim();

        const position =
            document.querySelector("#position").value.trim();

        const status =
            document.querySelector("#status").value;

        const date =
            document.querySelector("#application-date").value;

        const url =
            document.querySelector("#job-url").value.trim();

        const notes =
            document.querySelector("#notes").value.trim();


        if (company === "" || position === "") {

            alert(
                "Please enter the company and job position."
            );

            return;
        }


        const newApplication = {

            company: company,

            position: position,

            status: status,

            date: date,

            url: url,

            notes: notes
        };


        try {

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                newApplication
                            )
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to save application."
                );
            }


            const savedApplication =
                await response.json();


            applications.push(
                savedApplication
            );


            displayApplications();

            form.reset();


        } catch (error) {

            console.error(
                "Error adding application:",
                error
            );

            alert(
                "Could not save application."
            );
        }
    }
);


// ===============================
// OPEN EDIT FORM
// ===============================

function openEditForm(id) {

    const application =
        applications.find(
            application => application.id === id
        );


    if (!application) {
        return;
    }


    editingId = id;


    document.querySelector("#edit-company").value =
        application.company;

    document.querySelector("#edit-position").value =
        application.position;

    document.querySelector("#edit-status").value =
        application.status;

    document.querySelector("#edit-date").value =
        application.date || "";

    document.querySelector("#edit-url").value =
        application.url || "";

    document.querySelector("#edit-notes").value =
        application.notes || "";


    editSection.style.display =
        "block";


    editSection.scrollIntoView({
        behavior: "smooth"
    });
}


// ===============================
// SAVE EDIT
// ===============================

editForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (editingId === null) {
            return;
        }


        const updatedApplication = {

            company:
                document.querySelector(
                    "#edit-company"
                ).value.trim(),

            position:
                document.querySelector(
                    "#edit-position"
                ).value.trim(),

            status:
                document.querySelector(
                    "#edit-status"
                ).value,

            date:
                document.querySelector(
                    "#edit-date"
                ).value,

            url:
                document.querySelector(
                    "#edit-url"
                ).value.trim(),

            notes:
                document.querySelector(
                    "#edit-notes"
                ).value.trim()
        };


        try {

            const response =
                await fetch(
                    `${API_URL}/${editingId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
         "application/json"
                        },

                        body:JSON.stringify(
                                updatedApplication
                            )
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to update application."
                );
            }


            const updated =
                await response.json();


            const index =
                applications.findIndex(
                    application =>
                        application.id === editingId
                );


            if (index !== -1) {

                applications[index] =
                    updated;
            }


            displayApplications();


            editSection.style.display =
                "none";


            editingId =
                null;


        } catch (error) {

            console.error(
                "Error updating application:",
                error
            );

            alert(
                "Could not update application."
            );
        }
    }
);


// ===============================
// CANCEL EDIT
// ===============================

cancelEditButton.addEventListener(
    "click",
    function () {

        editSection.style.display =
            "none";

        editingId =
            null;
    }
);


// ===============================
// DELETE APPLICATION
// ===============================

async function deleteApplication(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this application?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to delete application."
            );
        }


        applications =
            applications.filter(
                application =>
                    application.id !== id
            );


        displayApplications();


    } catch (error) {

        console.error(
            "Error deleting application:",
            error
        );

        alert(
            "Could not delete application."
        );
    }
}


// ===============================
// CLEAR ALL APPLICATIONS
// ===============================

clearAllButton.addEventListener(
    "click",
    async function () {

        if (applications.length === 0) {

            alert(
                "There are no applications to clear."
            );

            return;
        }


        const confirmClear =
            confirm(
                "Are you sure you want to delete ALL applications?"
            );


        if (!confirmClear) {
            return;
        }


        try {

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "DELETE"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to clear applications."
                );
            }


            applications = [];

            displayApplications();


        } catch (error) {

            console.error(
                "Error clearing applications:",
                error
            );

            alert(
                "Could not clear applications."
            );
        }
    }
);


// ===============================
// SEARCH
// ===============================

searchInput.addEventListener(
    "input",
    displayApplications
);


// ===============================
// STATUS FILTER
// ===============================

statusFilter.addEventListener(
    "change",
    displayApplications
);


// ===============================
// SORT
// ===============================

sortSelect.addEventListener(
    "change",
    displayApplications
);


// ===============================
// START APPLICATION
// ===============================

loadApplications();