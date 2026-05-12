import CodStorage from "../../services/api/cod.js";

export async function mount(rootElement) {
    const view = rootElement || document;

    const submitBtn = view.querySelector(".submit-btn");
    const addNoteBtn = view.querySelector(".add-note-btn");
    const uploadProofBtn = view.querySelector(".upload-proof-btn");
    const proofInput = view.querySelector(".proof-upload-input");
    const noteContainer = view.querySelector(".note-container");

    // UI Elements for mapping
    const summaryCards = view.querySelectorAll(".summary-grid .card");
    const totalExpectedAmount = summaryCards[0]?.querySelector(".stat-value");
    const totalExpectedCount = summaryCards[0]?.querySelector(".helper-text");
    const totalCollectedAmount = summaryCards[1]?.querySelector(".stat-value");
    const totalCollectedCount = summaryCards[1]?.querySelector(".helper-text");
    
    const discrepancyCard = view.querySelector(".discrepancy-card");
    const discrepancyAmount = discrepancyCard?.querySelector(".stat-value");
    
    const alertCard = view.querySelector(".alert-card");
    const tableBody = view.querySelector(".table-body");

    const routeSpans = view.querySelectorAll("header .helper-text .text-title");
    const dateEl = routeSpans[0];
    const routeIdEl = routeSpans[1];

    // ── Task 2: Populate Reconciliation Data (Mock Data) ───────────────────
    const reconciliationMockData = {
        summary: {
            total_expected: 1250.0,
            expected_delivery_count: 4,
            total_collected: 1200.0,
            validated_count: 3,
            discrepancy: -50.0,
        },
        orders: [
            {
                order_id: "1005",
                customer_name: "Ahmed Mohamed",
                status: "Expected",
                expected_amount: 450.0,
            },
            {
                order_id: "1008",
                customer_name: "Delta Logistics",
                status: "Disputed",
                expected_amount: 500.0,
            },
            {
                order_id: "1010",
                customer_name: "John Doe",
                status: "Collected",
                expected_amount: 300.0,
            },
        ],
    };

    // Mapping logic
    const routeId = localStorage.getItem("activeRouteId") || "R-8821";
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString();
    if (routeIdEl) routeIdEl.innerText = routeId;

    const data = reconciliationMockData;

    if (data && data.summary) {
        if (totalExpectedAmount)
            totalExpectedAmount.innerText = `${parseFloat(data.summary.total_expected || 0).toLocaleString()} EGP`;
        if (totalExpectedCount)
            totalExpectedCount.innerText = `${data.summary.expected_delivery_count || 0} deliveries`;

        if (totalCollectedAmount)
            totalCollectedAmount.innerText = `${parseFloat(data.summary.total_collected || 0).toLocaleString()} EGP`;
        if (totalCollectedCount)
            totalCollectedCount.innerText = `${data.summary.validated_count || 0} validated deliveries`;

        const discrepancy = parseFloat(data.summary.discrepancy || 0);
        if (discrepancy !== 0) {
            if (discrepancyCard) {
                discrepancyCard.style.display = "flex";
                if (discrepancyAmount)
                    discrepancyAmount.innerText = `-${Math.abs(discrepancy).toFixed(2)} EGP`;
            }
            if (alertCard) alertCard.style.display = "flex";
        } else {
            if (discrepancyCard) discrepancyCard.style.display = "none";
            if (alertCard) alertCard.style.display = "none";
        }
    }

    if (data && data.orders && data.orders.length > 0) {
        if (tableBody) {
            tableBody.innerHTML = "";
            data.orders.forEach((order, index) => {
                const isLast = index === data.orders.length - 1;
                const row = document.createElement("div");
                row.className = `row table-row ${isLast ? "table-row--last" : ""}`;
                row.innerHTML = `
                        <span class="helper-text col-id order-id">ORD-${order.order_id}</span>
                        <span class="helper-text col-name">${order.customer_name}</span>
                        <span class="helper-text col-amt text-right">${parseFloat(order.expected_amount).toFixed(2)} EGP</span>
                    `;
                tableBody.appendChild(row);
            });
        }
    }

    // ── Task 3: Submit Button Action ────────────────────────────────────────
    if (submitBtn) {
        submitBtn.onclick = () => {
            alert("Reconciliation submitted successfully!");
            // Navigate back to stats page
            window.history.pushState({}, "", "/stats-page");
            window.dispatchEvent(new Event("popstate"));
        };
    }

    // Add Note Logic
    if (addNoteBtn && noteContainer) {
        addNoteBtn.addEventListener("click", () => {
            if (!view.querySelector(".driver-note-textarea")) {
                const textarea = document.createElement("textarea");
                textarea.className = "issue-textarea driver-note-textarea mt-2";
                textarea.placeholder = "Enter driver note here...";
                
                const saveBtn = document.createElement("button");
                saveBtn.className = "button primary btn-sm w-full mt-1";
                saveBtn.innerText = "Save Note";
                
                saveBtn.addEventListener("click", () => {
                    if (textarea.value.trim()) {
                        alert("Note saved!");
                        // Replace textarea with static text
                        const savedNote = document.createElement("p");
                        savedNote.className = "helper-text text-title mt-2";
                        savedNote.innerText = `Note: ${textarea.value}`;
                        noteContainer.innerHTML = "";
                        noteContainer.appendChild(savedNote);
                        addNoteBtn.innerText = "Edit Note";
                    } else {
                        textarea.remove();
                        saveBtn.remove();
                    }
                });

                noteContainer.innerHTML = "";
                noteContainer.appendChild(textarea);
                noteContainer.appendChild(saveBtn);
                textarea.focus();
            }
        });
    }

    // Upload Proof Logic
    if (uploadProofBtn && proofInput) {
        uploadProofBtn.addEventListener("click", () => {
            proofInput.click();
        });

        proofInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                alert(`File selected: ${file.name}`);
                uploadProofBtn.innerText = "Change Proof";
                uploadProofBtn.classList.remove("secondary");
                uploadProofBtn.classList.add("primary");
                
                // Show file name in the UI
                let fileLabel = view.querySelector(".uploaded-file-label");
                if (!fileLabel) {
                    fileLabel = document.createElement("span");
                    fileLabel.className = "helper-text text-success mt-1 uploaded-file-label";
                    noteContainer.appendChild(fileLabel);
                }
                fileLabel.innerText = `📎 ${file.name}`;
            }
        });
    }
}

export function unmount() {
}
