document.addEventListener("DOMContentLoaded", () => {
    const optApp = document.getElementById("opt-app");
    const optSms = document.getElementById("opt-sms");
    const enableBtn = document.getElementById("enable-btn");
    const skipBtn = document.getElementById("skip-btn");
  
    let selectedOption = "Authenticator App";
  
    // Toggle selection between 2FA options
    if (optApp && optSms) {
      optApp.addEventListener("click", () => {
        optApp.classList.add("active");
        optSms.classList.remove("active");
        selectedOption = "Authenticator App";
      });
  
      optSms.addEventListener("click", () => {
        optSms.classList.add("active");
        optApp.classList.remove("active");
        selectedOption = "SMS Verification";
      });
    }
  
    // Handle Enable Protection Action
    if (enableBtn) {
      enableBtn.addEventListener("click", () => {
        alert(`Enabling ${selectedOption}... Proceeding to next step.`);
      });
    }
  
    // Handle Skip
    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to skip two-factor authentication setup?")) {
          alert("Redirecting to dashboard...");
        }
      });
    }
  });
  
  