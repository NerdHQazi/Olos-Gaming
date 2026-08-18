document.addEventListener("DOMContentLoaded"), () => {
    const togglePwdBtn = document.getElementById("toggle-pwd");
    const pwdInput = document.getElementById("password-input");
    const loginForm = document.getElementById("login-form");
    const walletConnectBtn = document.getElementById("wallet-connect-btn");
  
    // Toggle Password Visibility
    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener("click", () => {
        const type = pwdInput.getAttribute("type") === "password" ? "text" : "password";
        pwdInput.setAttribute("type", type);
      });
    }
}