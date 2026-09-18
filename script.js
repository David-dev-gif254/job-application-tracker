// ===============================
// GET HTML ELEMENTS
// ===============================

const form =
    document.querySelector("#application-form");

const applicationsSection =
    document.querySelector(".applications");


// Dashboard
const totalApplications =
    document.querySelector("#total-applications");

const appliedCount =
    document.querySelector("#applied-count");

const interviewCount =
    document.querySelector("#interview-count");

const acceptedCount =
    document.querySelector("#accepted-count");

const rejectedCount =
    document.querySelector("#rejected-count");


// Edit
const editSection =
    document.querySelector("#edit-section");

const editForm =
    document.querySelector("#edit-form");

const cancelEditButton =
    document.querySelector("#cancel-edit");


// Search and filter
const searchInput =
    document.querySelector("#search-input");

const statusFilter =
    document.querySelector("#status-filter");


// Sort
const sortSelect =
    document.querySelector("#sort-select");


// Clear All
const clearAllButton =
    document.querySelector("#clear-all");


// ===============================
// LOAD APPLICATIONS
// ===============================

let applications =
    JSON.parse(
        localStorage.getItem("applications")
    ) || [];

let editingIndex = null;


// ===============================
// SAVE APPLICATIONS
// ===============================

function saveApplications() {

    localStorage.setItem(
        "applications",
        JSON.stringify(applications)
    );
}


// ===============================
// UPDATE DASHBOARD
// ===============================

function updateStatistics() {

    const total =
        applications.length;


    const applied =
        applications.filter(
            application =>
                application.status === "Applied"
        ).length;


    const interviews =
        applications.filter(
            application =>
                application.status === "Interview"
        ).length;


    const accepted =
        applications.filter(
            application =>
                application.status === "Accepted"
        ).length;


    const rejected =
        applications.filter(
            application =>
                application.status === "Rejected"
        ).length;


    totalApplications.textContent =
        total;

    appliedCount.textContent =
        applied;

    interviewCount.textContent =
        interviews;

    acceptedCount.textContent =
        accepted;

    rejectedCount.textContent =
        rejected;
}


// ===============================
// CREATE STATUS BADGE
// ===============================

function createStatusBadge(status) {

    const badge =
        document.createElement("span");

    badge.className =
        "status-badge";


    if (status === "Applied") {

        badge.classList.add(
            "status-applied"
        );

    } else if (status === "Interview") {

        badge.classList.add(
            "status-interview"
        );

    } else if (status === "Rejected") {

        badge.classList.add(
            "status-rejected"
        );

    } else if (status === "Accepted") {

        badge.classList.add(
            "status-accepted"
        );
    }


    badge.textContent =
        status;


    return badge;
}


// ===============================
// DISPLAY APPLICATIONS
// ===============================

function displayApplications() {

    const existingApplications =
        applicationsSection.querySelectorAll(
            ".application"
        );


    existingApplications.forEach(
        application =>
            application.remove()
    );


    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedStatus =
        statusFilter.value;


    // Create a copy so sorting
    // does not change the original array
    let filteredApplications =
        applications.filter(
            function(application) {

                const matchesSearch =
                    application.company
                        .toLowerCase()
                        .includes(searchText) ||

                    application.position
                        .toLowerCase()
                        .includes(searchText);


                const matchesStatus =
                    selectedStatus === "All" ||
                    application.status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    // ===============================
    // SORT APPLICATIONS
    // ===============================

    filteredApplications.sort(
        function(a, b) {

            const dateA =
                a.date || "";

            const dateB =
                b.date || "";


            if (sortSelect.value === "newest") {

                return dateB.localeCompare(dateA);

            } else {

                return dateA.localeCompare(dateB);

            }

        }
    );


    // ===============================
    // EMPTY RESULTS
    // ===============================

    if (filteredApplications.length === 0) {

        let message =
            applicationsSection.querySelector(
                ".empty-message"
            );


        if (!message) {

            message =
                document.createElement("p");

            message.className =
                "empty-message";

            applicationsSection.appendChild(
                message
            );
        }


        if (applications.length === 0) {

            message.textContent =
                "No applications added yet.";

        } else {

            message.textContent =
                "No applications match your search.";

        }


        updateStatistics();

        return;
    }


    const emptyMessage =
        applicationsSection.querySelector(
            ".empty-message"
        );


    if (emptyMessage) {
        emptyMessage.remove();
    }


    // ===============================
    // DISPLAY EACH APPLICATION
    // ===============================

    filteredApplications.forEach(
        function(application) {

            const index =
                applications.indexOf(
                    application
                );


            const applicationElement =
                document.createElement("div");

            applicationElement.className =
                "application";


            // ===============================
            // COMPANY
            // ===============================

            const title =
                document.createElement("h3");

            title.textContent =
                application.company;


            applicationElement.appendChild(
                title
            );


            // ===============================
            // POSITION
            // ===============================

            const position =
                document.createElement("p");

            position.innerHTML =
                "<strong>Position:</strong> " +
                application.position;


            applicationElement.appendChild(
                position
            );


            // ===============================
            // STATUS
            // ===============================

            const statusParagraph =
                document.createElement("p");


            const statusLabel =
                document.createElement("strong");

            statusLabel.textContent =
                "Status: ";


            const statusBadge =
                createStatusBadge(
                    application.status
                );


            statusParagraph.appendChild(
                statusLabel
            );

            statusParagraph.appendChild(
                statusBadge
            );


            applicationElement.appendChild(
                statusParagraph
            );


            // ===============================
            // DATE
            // ===============================

            const date =
                document.createElement("p");

            date.innerHTML =
                "<strong>Application Date:</strong> " +
                (
                    application.date ||
                    "Not provided"
                );


            applicationElement.appendChild(
                date
            );


            // ===============================
            // JOB LINK
            // ===============================

            if (application.url) {

                const urlParagraph =
                    document.createElement("p");

                urlParagraph.innerHTML =
                    "<strong>Job Link:</strong> ";


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


                urlParagraph.appendChild(
                    link
                );


                applicationElement.appendChild(
                    urlParagraph
                );
            }


            // ===============================
            // NOTES
            // ===============================

            if (application.notes) {

                const notes =
                    document.createElement("p");

                notes.innerHTML =
                    "<strong>Notes:</strong> " +
                    application.notes;


                applicationElement.appendChild(
                    notes
                );
            }


            // ===============================
            // EDIT BUTTON
            // ===============================

            const editButton =
                document.createElement("button");

            editButton.className =
                "edit-button";

            editButton.textContent =
                "Edit";


            editButton.addEventListener(
                "click",
                function() {

                    openEditForm(index);

                }
            );


            applicationElement.appendChild(
                editButton
            );


            // ===============================
            // DELETE BUTTON
            // ===============================

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "delete-button";

            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                function() {

                    const confirmDelete =
                        confirm(
                            "Are you sure you want to delete this application?"
                        );


                    if (confirmDelete) {

                        applications.splice(
                            index,
                            1
                        );

                        saveApplications();

                        displayApplications();

                    }

                }
            );


            applicationElement.appendChild(
                deleteButton
            );


            applicationsSection.appendChild(
                applicationElement
            );

        }
    );


    updateStatistics();
}


// ===============================
// OPEN EDIT FORM
// ===============================

function openEditForm(index) {

    editingIndex = index;

    const application =
        applications[index];


    document.querySelector(
        "#edit-company"
    ).value =
        application.company;


    document.querySelector(
        "#edit-position"
    ).value =
        application.position;


    document.querySelector(
        "#edit-status"
    ).value =
        application.status;


    document.querySelector(
        "#edit-date"
    ).value =
        application.date || "";


    document.querySelector(
        "#edit-url"
    ).value =
        application.url || "";


    document.querySelector(
        "#edit-notes"
    ).value =
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
    function(event) {

        event.preventDefault();


        if (editingIndex === null) {
            return;
        }


        applications[editingIndex] = {

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


        saveApplications();

        displayApplications();


        editSection.style.display =
            "none";

        editingIndex = null;
    }
);


// ===============================
// CANCEL EDIT
// ===============================

cancelEditButton.addEventListener(
    "click",
    function() {

        editSection.style.display =
            "none";

        editingIndex = null;
    }
);


// ===============================
// ADD APPLICATION
// ===============================

form.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const company =
            document.querySelector(
                "#company"
            ).value.trim();


        const position =
            document.querySelector(
                "#position"
            ).value.trim();


        const status =
            document.querySelector(
                "#status"
            ).value;


        const date =
            document.querySelector(
                "#application-date"
            ).value;


        const url =
            document.querySelector(
                "#job-url"
            ).value.trim();


        const notes =
            document.querySelector(
                "#notes"
            ).value.trim();


        if (
            company === "" ||
            position === ""
        ) {

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


        applications.push(
            newApplication
        );


        saveApplications();

        displayApplications();

        form.reset();

    }
);


// ===============================
// SEARCH
// ===============================

searchInput.addEventListener(
    "input",
    function() {

        displayApplications();

    }
);


// ===============================
// STATUS FILTER
// ===============================

statusFilter.addEventListener(
    "change",
    function() {

        displayApplications();

    }
);


// ===============================
// SORT
// ===============================

sortSelect.addEventListener(
    "change",
    function() {

        displayApplications();

    }
);


// ===============================
// CLEAR ALL APPLICATIONS
// ===============================

clearAllButton.addEventListener(
    "click",
    function() {

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


        if (confirmClear) {

            applications = [];

            saveApplications();

            displayApplications();

        }

    }
);


// ===============================
// INITIAL DISPLAY
// ===============================

displayApplications();