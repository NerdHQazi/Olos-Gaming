document.addEventListener("DOMContentLoaded", () => {
    // Modal Elements
    const modal = document.getElementById("auth-modal");
    const modalTitle = document.getElementById("modal-title");
    const openSignUpBtn = document.getElementById("open-signup");
    const getStartedBtn = document.getElementById("get-started-btn");
    const signInBtn = document.getElementById("sign-in-btn");
    const closeModalBtn = document.getElementById("close-modal");
    const modalSubmitBtn = document.getElementById("modal-submit");
  
    // Open Modal Functions
    const openModal = (title) => {
      modalTitle.textContent = title;
      modal.style.display = "flex";
    };
  
    // Event Listeners
    if (openSignUpBtn) openSignUpBtn.addEventListener("click", () => openModal("Create Account"));
    if (getStartedBtn) getStartedBtn.addEventListener("click", () => openModal("Get Started on OLOS"));
    if (signInBtn) signInBtn.addEventListener("click", () => openModal("Sign In to OLOS"));
  
    // Close Modal
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }
  
    // Close when clicking background
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  
    // Simulated Login / Submit
    if (modalSubmitBtn) {
      modalSubmitBtn.addEventListener("click", () => {
        alert("Connecting to Web3 Provider...");
        modal.style.display = "none";
      });
    }
  });
  