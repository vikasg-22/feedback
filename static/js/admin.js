const overlay = document.getElementById("dataOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const dataHeader = document.getElementById("dataHeader");
const dataBody = document.getElementById("dataBody");
const backBtn = document.getElementById("backBtn");
const body = document.body;

let feedbackData = [];
let currentQuestions = {
    mid_questions: [],
    end_questions: []
};

// Toggle Views
function toggleView(view) {
    document.getElementById("adminLogin").style.display = view === "login" ? "block" : "none";
    document.getElementById("adminDashboard").style.display = view === "dashboard" ? "block" : "none";
}

// Handle Login
document.getElementById("adminLoginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;

    if (username === "admin" && password === "123") {
        toggleView("dashboard");
    } else {
        alert("Invalid credentials!");
    }
});

// Logout Functionality
function logout() {
    toggleView("login");
}

// Add Subject API Integration
document.getElementById("addSubjectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const branch = document.getElementById("branch").value;
    const semester = document.getElementById("semester").value;
    const newSubject = document.getElementById("newSubject").value;

    try {
        const response = await fetch('/add-subject', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ branch, semester, subject: newSubject })
        });
        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error("Error adding subject:", error);
    }

    document.getElementById("addSubjectForm").reset();
});

function showOverlay(title, headers, data) {
    overlayTitle.textContent = title;

    // Populate the table header
    dataHeader.innerHTML = headers.map(header => `<th>${header}</th>`).join("");

    // Populate the table body
    dataBody.innerHTML = data.map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
    ).join("");

    body.classList.add("blur"); // Blur the background
    overlay.classList.add("active"); // Show overlay
}

// Hide overlay and restore dashboard
backBtn.addEventListener("click", () => {
    overlay.classList.remove("active");
    body.classList.remove("blur");
});

document.addEventListener("DOMContentLoaded", function () {
    const yearSelect = document.getElementById("year-admin");

    if (yearSelect) {
        const currentYear = new Date().getFullYear(); // Get the current year
        const academicYear1 = `${currentYear - 1}-${currentYear}`;
        const academicYear2 = `${currentYear}-${currentYear + 1}`;

        // Clear existing options
        yearSelect.innerHTML = `<option value="">Select Year</option>`;

        // Add dynamically generated years
        yearSelect.innerHTML += `
            <option value="${academicYear1}">${academicYear1}</option>
            <option value="${academicYear2}">${academicYear2}</option>
        `;
    }
});

// Fetch available branches from the database
async function fetchBranches() {
    try {
        const response = await fetch('/get-branches');
        const data = await response.json();
        const branchSelect = document.getElementById("branchSelect");
        branchSelect.innerHTML = '<option value="">Select Branch</option>'; // Clear previous data

        data.forEach(branch => {
            const option = document.createElement("option");
            option.value = branch;
            option.textContent = branch;
            branchSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching branches:", error);
        alert("Failed to load branches.");
    }
}

// Function to fetch and display subjects based on selection
async function showSubjectsOverlay() {
    const branch = document.getElementById("branchSelect").value;
    const semester = document.getElementById("semesterSelect").value;

    if (!branch || !semester) {
        alert("Please select both branch and semester.");
        return;
    }

    try {
        const response = await fetch(`/get-subjects/${branch}/${semester}`);
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        const tableBody = document.getElementById("subjectsTableBody");
        tableBody.innerHTML = ""; // Clear previous data

        data.forEach(subject => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${branch}</td>
                <td>${semester}</td>
                <td>${subject}</td>
                <td>
                    <button class="delete-btn" onclick="deleteSubject('${branch}', '${semester}', '${subject}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.getElementById("subjectsOverlay").classList.add("active");
        document.body.classList.add("blur");
    } catch (error) {
        console.error("Error fetching subjects:", error);
        alert("Failed to fetch subjects.");
    }
}

// Function to fetch and populate branches dynamically
async function fetchAndPopulateBranches() {
    const branchSelect = document.getElementById("branch");

    try {
        // Fetch branches from the server
        const response = await fetch('/get-branches');
        const data = await response.json();

        // Clear existing options (except the default "Select" option)
        branchSelect.innerHTML = '<option value="">Select</option>';

        // Populate the branch dropdown with fetched data
        data.forEach(branch => {
            const option = document.createElement("option");
            option.value = branch;
            option.textContent = branch;
            branchSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching branches:", error);
        alert("Failed to load branches. Please try again.");
    }
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", function () {
    fetchAndPopulateBranches(); // Populate branches
});

// Function to delete a subject
async function deleteSubject(branch, semester, subject) {
    if (confirm(`Are you sure you want to delete "${subject}"?`)) {
        try {
            const response = await fetch('/delete-subject', {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ branch, semester, subject })
            });
            const data = await response.json();
            alert(data.message);
            if (data.success) {
                showSubjectsOverlay(); // Refresh the table
            }
        } catch (error) {
            console.error("Error deleting subject:", error);
            alert("Failed to delete subject.");
        }
    }
}

// Function to close the subjects overlay
function closeSubjectsOverlay() {
    document.getElementById("subjectsOverlay").classList.remove("active");
    document.body.classList.remove("blur");
}

// Event Listeners
document.getElementById("fetchSubjectsBtn").addEventListener("click", showSubjectsOverlay);

// Load branches on page load
document.addEventListener("DOMContentLoaded", fetchBranches);


document.addEventListener("DOMContentLoaded", function () {
    const yearSelects = [document.getElementById("viewYearSelect"), document.getElementById("addQuestionYearSelect")];

    const currentYear = new Date().getFullYear();
    const years = [
        `${currentYear - 1}-${currentYear}`,
        `${currentYear}-${currentYear + 1}`
    ];

    // Fix: Pad year properly to match format "2024-2025"
    const formattedYears = years.map(y => {
        const parts = y.split("-");
        return `${parts[0]}-${parseInt(parts[1])}`; // This gives "2024-2025"
    });

    yearSelects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select Year</option>';
            formattedYears.forEach(y => {
                select.innerHTML += `<option value="${y}">${y}</option>`;
            });
        }
    });
});

document.getElementById("viewQuestionsBtn").addEventListener("click", async function () {
    const semesterRaw = document.getElementById("viewSemesterSelect").value;
    const formType = document.getElementById("viewFormTypeSelect").value;
    const year = document.getElementById("viewYearSelect").value;

    if (!semesterRaw || !formType || !year) {
        alert("Please select Semester, Form Type and Academic Year.");
        return;
    }

    const semester = `semester_${semesterRaw}`;

    try {
        const response = await fetch(`/get-questions/${semester}/${formType}?year=${year}`);
        if (!response.ok) throw new Error("Failed to fetch questions");

        const data = await response.json();
        if (!data.questions || !Array.isArray(data.questions)) {
            throw new Error("No questions found for selected criteria");
        }

        // Store the questions
        if (formType === "mid") {
            currentQuestions.mid_questions = data.questions;
            currentQuestions.end_questions = []; // Clear other type
        } else {
            currentQuestions.end_questions = data.questions;
            currentQuestions.mid_questions = []; // Clear other type
        }

        // Show questions and hide the other tab button
        showQuestions(formType, true);

    } catch (error) {
        console.error("Error fetching questions:", error);
        alert("Error: " + error.message);
    }
});

function showQuestions(type) {
    const tableBody = document.getElementById("questionsTableBody");
    tableBody.innerHTML = "";

    const questions = type === "mid" ? currentQuestions.mid_questions : currentQuestions.end_questions;

    // Hide both tabs initially
    const midTab = document.getElementById("midTab");
    const endTab = document.getElementById("endTab");
    if (midTab) midTab.style.display = "none";
    if (endTab) endTab.style.display = "none";

    // Show only the current type's tab
    if (type === "mid" && midTab) {
        midTab.style.display = "inline-block";
        midTab.classList.add("active");
    } else if (endTab) {
        endTab.style.display = "inline-block";
        endTab.classList.add("active");
    }

    // Populate table
    if (!questions || questions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3">No questions found</td></tr>`;
    } else {
        questions.forEach((question, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${question}</td>
                <td><button onclick="deleteQuestion('${type}', ${index})">Delete</button></td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Show overlay
    const overlay = document.getElementById("questionsOverlay");
    if (overlay) overlay.classList.add("active");
    document.body.classList.add("blur");
}

    

// Tab buttons for switching between mid/end questions
document.getElementById("midTab").addEventListener("click", () => showQuestions("mid"));
document.getElementById("endTab").addEventListener("click", () => showQuestions("end"));

const semesterRaw = document.getElementById('addQuestionSemesterSelect').value;
const semester = `semester_${semesterRaw}`;  // Add this prefix

document.getElementById('addQuestionBtn').addEventListener('click', async function(e) {
    e.preventDefault();

    const type = document.getElementById('questionType').value;
    const question = document.getElementById('newQuestionText').value.trim();
    const semesterRaw = document.getElementById('addQuestionSemesterSelect').value;
    const year = document.getElementById('addQuestionYearSelect').value;

    if (!question || !semesterRaw || !year) {
        alert("Please fill all fields (Question, Semester, Year).");
        return;
    }

    const semester = `semester_${semesterRaw}`;  // Important!

    try {
        const response = await fetch('/add-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, question, semester, year })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Failed to add question");

        alert("Question added successfully!");
        document.getElementById('newQuestionText').value = '';

    } catch (error) {
        console.error('Error:', error);
        alert("Error adding question: " + error.message);
    }
});

// Delete question by index
async function deleteQuestion(type, index) {
    const semesterRaw = document.getElementById("viewSemesterSelect").value;
    const year = document.getElementById("viewYearSelect").value;

    if (!semesterRaw || !year) {
        alert("Semester and Academic Year are required.");
        return;
    }

    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
        const semester = `semester_${semesterRaw}`; // Add the prefix here
        const response = await fetch('/delete-question', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: type, 
                semester: semester,  // Now sending "semester_1" format
                index: index,
                year: year
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete question");
        }

        const data = await response.json();
        alert(data.message);

        // Update local state
        if (type === "mid") {
            currentQuestions.mid_questions.splice(index, 1);
        } else {
            currentQuestions.end_questions.splice(index, 1);
        }

        showQuestions(type); // Refresh view
    } catch (error) {
        console.error("Error deleting question:", error);
        alert("Failed to delete question: " + error.message);
    }
}
// Close overlay
function closeQuestionsOverlay() {
    document.getElementById("questionsOverlay").classList.remove("active");
    document.body.classList.remove("blur");
     // Show both tabs again when overlay is closed
     document.getElementById("midTab").style.display = "inline-block";
     document.getElementById("endTab").style.display = "inline-block";
}

// Event listener for Add Question button


document.getElementById('addQuestionBtn').addEventListener('click', function(e) {
    e.preventDefault(); // 👈 Prevent page reload
    // rest of your logic...
});
// Function to update subjects based on selected branch and semester
async function updateSubject() {
    const branch = document.getElementById('branch-admin').value;
    const semester = document.getElementById('semester-admin').value;
    const subjectSelect = document.getElementById('subject');

    // Clear subject options first
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';

    // If branch and semester are selected, fetch subjects
    if (branch && semester) {
        try {
            const response = await fetch(`/get-subjects/${branch}/${semester}`);
            const data = await response.json();
            if (data.error) {
                alert(data.error);
            } else {
                // Populate the subject dropdown
                data.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject;
                    option.textContent = subject;
                    subjectSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    }
}
async function populateLimitBranch() {
    try {
        const response = await fetch('/get-branches');
        const data = await response.json();
        const branchSelect = document.getElementById("limitBranch");
        
        if (!branchSelect) {
            console.error("limitBranch dropdown not found");
            return;
        }
        
        branchSelect.innerHTML = '<option value="">Select Branch</option>';
        data.forEach(branch => {
            const option = document.createElement("option");
            option.value = branch;
            option.textContent = branch;
            branchSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching branches:", error);
    }
}
// Call the function to populate branches when the page loads
document.addEventListener("DOMContentLoaded", function () {
    populateLimitBranch(); // Populate branches for Set Feedback Limit form
});

// Function to handle setting the feedback limit
async function setFeedbackLimit() {
    const branch = document.getElementById("limitBranch").value.trim();
    const semester = document.getElementById("limitSemester").value.trim();
    const limit = parseInt(document.getElementById("limitValue").value.trim());

    if (!branch || !semester || isNaN(limit)) {
        alert("Please fill in all fields with valid data.");
        return;
    }

    try {
        const response = await fetch("/set-feedback-limit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ branch, semester, limit })
        });

        const result = await response.json();

        if (!response.ok) {
            alert("❌ " + (result.error || "Failed to set limit"));
        } else {
            alert("✅ " + result.message);
        }
    } catch (error) {
        console.error("Error setting limit:", error);
        alert("Failed to set limit.");
    }
}



// Function to fetch branches from the backend
async function fetchBranches() {
    try {
        const response = await fetch('/get-branches');
              const data = await response.json();

        // Populate branch dropdowns
        const branchDropdowns = document.querySelectorAll('select[id*="branch"]');
        branchDropdowns.forEach(dropdown => {
            dropdown.innerHTML = '<option value="">Select Branch</option>'; // Reset options
            data.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                dropdown.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error fetching branches:', error);
        alert('Failed to load branches. Please try again.');
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchBranches);

// Function to download feedback as an Excel file
const downloadFeedbackBtn = document.getElementById("downloadFeedbackBtn");
downloadFeedbackBtn.addEventListener("click", function () {
    const year = document.getElementById("year-admin").value;
    const branch = document.getElementById("branch-admin").value;
    const semester = document.getElementById("semester-admin").value;
    const subject = document.getElementById("subject").value;
    const form = document.getElementById("formType").value;

    if (!year || !branch || !semester || !subject || !form) {
        alert("Please fill all fields before downloading feedback.");
        return;
    }

    // Redirect to the download-feedback endpoint with parameters
    window.location.href = `/download-feedback?year=${year}&branch=${branch}&semester=${semester}&subject=${subject}&form=${form}`;
});
document.getElementById('fetchFeedbackBtn').addEventListener('click', async function () {
    const year = document.getElementById('year-admin').value;
    const branch = document.getElementById('branch-admin').value;
    const semester = document.getElementById('semester-admin').value;
    const subject = document.getElementById('subject').value;
    const form = encodeURIComponent(document.getElementById('formType').value);

    if (!year || !branch || !semester || !subject || !form) {
        alert('Please select all fields before fetching feedback.');
        return;
    }

    try {
        const response = await fetch(`/fetch-feedback?year=${year}&branch=${branch}&semester=${semester}&subject=${subject}&form=${form}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message || 'No feedback available');
            return;
        }

        const data = await response.json();
        console.log("Backend Response Structure:", {
        hasFeedbackData: !!data.feedback_data,
        dataLength: data.feedback_data?.length,
        firstItem: data.feedback_data?.[0],
         questions: data.feedback_data?.[0]?.Question ? "Exists" : "Missing"
});
        
        // Validate response structure
        if (!data?.feedback_data || !Array.isArray(data.feedback_data)) {
            throw new Error('Invalid feedback data structure received');
        }

        // Use backend-provided total_submissions if available
        // Otherwise calculate from first question (fallback)
        if (typeof data.total_submissions === 'undefined') {
            console.warn('Using fallback submissions calculation');
            data.total_submissions = data.feedback_data.length > 0 ? 
                (data.feedback_data[0]['1 (Bad)'] || 0) +
                (data.feedback_data[0]['2 (Average)'] || 0) +
                (data.feedback_data[0]['3 (Good)'] || 0) +
                (data.feedback_data[0]['4 (Very Good)'] || 0) : 0;
        }

        showFeedbackOverlay(data);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        alert('Failed to fetch feedback. Please try again.');
    }
});

function showFeedbackOverlay(data) {
    if (!data || !data.feedback_data || !Array.isArray(data.feedback_data)) {
        console.error('Invalid feedback data:', data);
        alert('Invalid feedback data received');
        return;
    }

    // Set header information
    const setText = (id, text) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    };

    setText('selectedYear', data.year || 'N/A');
    setText('selectedBranch', data.branch || 'N/A');
    setText('selectedSemester', data.semester || 'N/A');
    setText('selectedSubject', data.subject || 'N/A');

    const formType = data.form ? 
        data.form.charAt(0).toUpperCase() + data.form.slice(1) : 
        'N/A';
    setText('selectedFormType', formType);

    // Calculate remaining submissions
    const totalSubmissions = data.total_submissions || 0;
    const feedbackLimit = data.feedback_limit || 0;
    const remainingSubmissions = Math.max(0, feedbackLimit - totalSubmissions);

    // Create or update submissions display
    let submissionsInfo = document.getElementById('submissionsInfo');
    if (!submissionsInfo) {
        submissionsInfo = document.createElement('div');
        submissionsInfo.id = 'submissionsInfo';
        submissionsInfo.className = 'submissions-info';
        document.querySelector('.feedback-right').appendChild(submissionsInfo);
    }
    
    submissionsInfo.innerHTML = `
    <p><strong>Submitted:</strong> ${totalSubmissions}${feedbackLimit ? `/${feedbackLimit}` : ''}</p>
`;

    // Populate the feedback table
    const tableBody = document.getElementById('feedbackTableBody');
    tableBody.innerHTML = '';

    let totalAVG = 0;
    data.feedback_data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.Question || 'N/A'}</td>
            <td>${item['1 (Bad)'] || 0}</td>
            <td>${item['2 (Average)'] || 0}</td>
            <td>${item['3 (Good)'] || 0}</td>
            <td>${item['4 (Very Good)'] || 0}</td>
            <td style="font-weight: bold;">${item.AVG || 0}</td>
        `;
        tableBody.appendChild(row);

        totalAVG += parseFloat(item.AVG) || 0;
    });

    // Add total average row
    const finalTotalAVG = data.feedback_data.length > 0 ? (totalAVG / data.feedback_data.length).toFixed(2) : 0;
    const totalRow = document.createElement('tr');
    totalRow.classList.add('total-average-row');
    totalRow.innerHTML = `
        <td colspan="6" style="text-align:right; font-weight:bold;">Total Average</td>
        <td style="font-weight:bold;">${finalTotalAVG}</td>
    `;
    tableBody.appendChild(totalRow);

    // Show the feedback overlay
    document.getElementById('feedbackOverlay').classList.add('active');
    document.body.classList.add('blur');
}

function closeFeedbackOverlay() {
    document.getElementById('feedbackOverlay').classList.remove('active');
    document.body.classList.remove('blur');
    document.getElementById('feedbackModal').style.display = 'none'; // optional: hide modal if it's separate
}
