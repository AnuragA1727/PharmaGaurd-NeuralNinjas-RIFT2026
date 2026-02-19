const inputBox = document.getElementById("inputBox");
const fileInput = document.getElementById("fileInput");
const textInput = document.getElementById("textInput");
const placeholderText = document.getElementById("placeholderText");

let selectedFile = null;

/* Prevent default browser file open */
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => e.preventDefault());

function togglePlaceholder() {
  if (textInput.value.trim() !== "" || selectedFile) {
    placeholderText.style.display = "none";
  } else {
    placeholderText.style.display = "block";
  }
}

/* Click to upload */
inputBox.addEventListener("click", () => {
  fileInput.click();
});

/* File select */
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    selectedFile = fileInput.files[0];
    textInput.value = "";
    togglePlaceholder();
  }
});

/* Drag over */
inputBox.addEventListener("dragover", () => {
  inputBox.style.borderColor = "#1E88E5";
});

/* Drag leave */
inputBox.addEventListener("dragleave", () => {
  inputBox.style.borderColor = "#90CAF9";
});

/* Drop */
inputBox.addEventListener("drop", (e) => {
  inputBox.style.borderColor = "#90CAF9";

  if (e.dataTransfer.files.length > 0) {
    selectedFile = e.dataTransfer.files[0];
    textInput.value = "";
    togglePlaceholder();
  }
});


const analyzeBtn = document.getElementById("analyzeBtn");

analyzeBtn.addEventListener("click", async () => {

  if (!selectedFile && textInput.value.trim() === "") {
    alert("Please upload a file or paste VCF data.");
    return;
  }

  const formData = new FormData();

  if (selectedFile) {
    formData.append("file", selectedFile);
  } else {
    formData.append("vcfText", textInput.value.trim());
  }

  try {
    const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const result = await response.json();

    console.log("Server Response:", result);

    alert("Analysis Completed!");
    
    // Example: show response somewhere
    // You can update UI here
    // document.getElementById("result").innerText = result.riskScore;

  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong. Check backend.");
  }

});
