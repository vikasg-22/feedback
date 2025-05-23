let questions = []; // This will hold the questions fetched from server

// Populate academic years
document.addEventListener("DOMContentLoaded", function () {
    const yearSelect = document.getElementById("year");
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        const prevYear = `${currentYear - 1}`;
        const thisYear = `${currentYear}`;
        const nextYear = `${currentYear + 1}`;

        yearSelect.innerHTML = `
            <option value="">Select Year</option>
            <option value="${prevYear}-${thisYear}">${prevYear}-${thisYear}</option>
            <option value="${thisYear}-${nextYear}">${thisYear}-${nextYear}</option>
        `;
    }

    fetchAndPopulateBranches(); // assuming this function exists
});

// Fetch and populate branches
async function fetchAndPopulateBranches() {
    const branchSelect = document.getElementById("branch");
    try {
        const response = await fetch('/get-branches');
        const data = await response.json();
        branchSelect.innerHTML = '<option value="">Select</option>';
        data.forEach(branch => {
            const option = document.createElement("option");
            option.value = branch;
            option.textContent = branch;
            branchSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to fetch branches:", error);
        alert("Error loading branches.");
    }
}

// Fetch subjects when branch or semester changes
async function updateSubjects() {
    const branch = document.getElementById("branch").value;
    const semester = document.getElementById("semester").value;
    const subjectSelect = document.getElementById("subject");

    subjectSelect.innerHTML = '<option value="">Select</option>';

    if (branch && semester) {
        try {
            const response = await fetch(`/get-subjects/${branch}/${semester}`);
            const data = await response.json();
            if (data.error) {
                alert(data.error);
            } else {
                data.forEach(subject => {
                    const option = document.createElement("option");
                    option.value = subject;
                    option.textContent = subject;
                    subjectSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    }
}

// Fetch questions when form type changes
async function updateQuestions() {
    const formType = document.getElementById("form").value;
    const semesterRaw = document.getElementById("semester").value;
    const year = document.getElementById("year").value;

    if (!formType || !semesterRaw || !year) {
        document.getElementById("questionsContainer").style.display = "none";
        return;
    }

    const semester = `semester_${semesterRaw}`; // add prefix like admin JS

    try {
        const response = await fetch(`/get-questions/${semester}/${formType}?year=${year}`);
        if (!response.ok) throw new Error("Failed to fetch questions");

        const data = await response.json();

        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            alert("No questions found.");
            document.getElementById("questionsContainer").style.display = "none";
            return;
        }

        window.questions = data.questions; // keep your existing global variable usage
        displayQuestions(window.questions); // call your existing display function

    } catch (error) {
        console.error("Failed to fetch questions:", error);
        alert("Could not load questions.");
    }
}

// Render the questions on the page
function displayQuestions(questions) {
    const questionsDiv = document.getElementById("questions");
    questionsDiv.innerHTML = "";

    questions.forEach((question, index) => {
        const block = document.createElement("div");
        block.className = "question-block";
        block.innerHTML = `
            <p><strong>${index + 1}.</strong> ${question}</p>
            <div class="radio-group">
                ${["Very Good", "Good", "Average", "Bad"].map((rating, rIdx) => `
                    <input type="radio" id="q${index}_${rIdx}" name="question${index}" value="${rating}" required>
                    <label for="q${index}_${rIdx}"><span class="custom-radio">${rating}</span></label>
                `).join("")}
            </div>
        `;
        questionsDiv.appendChild(block);
    });

    document.getElementById("questionsContainer").style.display = "block";
}

// Handle form submission

// Handle form submission - FIXED VERSION
// Handle form submission - UPDATED VERSION
document.getElementById("feedbackForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Get all form values
    const registerNumber = document.getElementById("registerNumber").value.trim();
    const semester = document.getElementById("semester").value.trim();
    const branch = document.getElementById("branch").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const formType = document.getElementById("form").value.trim();
    const year = document.getElementById("year").value.trim();

    // Validate register number format
    if (registerNumber.length !== 10) {
        alert("Please enter a valid 10-digit register number.");
        return;
    }

    // Validate all required fields
    const requiredFields = [
        { value: registerNumber, name: "Register Number" },
        { value: semester, name: "Semester" },
        { value: branch, name: "Branch" },
        { value: subject, name: "Subject" },
        { value: formType, name: "Form Type" },
        { value: year, name: "Academic Year" }
    ];

    const missingField = requiredFields.find(field => !field.value);
    if (missingField) {
        alert(`Please select ${missingField.name}.`);
        return;
    }

    // Check if questions are loaded by checking the DOM instead of the questions array
    const questionBlocks = document.querySelectorAll('.question-block');
    if (questionBlocks.length === 0) {
        alert("Questions are not loaded yet. Please wait and try again.");
        return;
    }

    // Collect all ratings
    const ratings = [];
    let allRated = true;
    
    questionBlocks.forEach((_, index) => {
        const rating = document.querySelector(`input[name="question${index}"]:checked`);
        if (rating) {
            ratings.push(rating.value);
        } else {
            allRated = false;
        }
    });

    if (!allRated || ratings.length !== questionBlocks.length) {
        alert("Please rate all questions before submitting.");
        return;
    }

    // Submit the feedback
    try {
        const response = await fetch("/submit-feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                register_number: registerNumber,
                semester,
                branch,
                subject,
                form: formType,
                year,
                ratings
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Submission failed");
        }

        // Success handling
        alert(result.message || "Feedback submitted successfully!");
        document.getElementById("feedbackForm").reset();
        document.getElementById("questionsContainer").style.display = "none";
        questions = []; // Reset questions array
        
    } catch (error) {
        console.error("Submission error:", error);
        alert(error.message || "An error occurred while submitting feedback. Please try again.");
    }
});
// Load questions
document.getElementById("form").addEventListener("change", updateQuestions);
document.getElementById("semester").addEventListener("change", updateQuestions);
document.getElementById("year").addEventListener("change", updateQuestions);
