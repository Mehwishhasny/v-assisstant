const credentials = [
    { email: "user2", password: "1235" },
    {email: "admin", password: "1234"}
  ];
  
  function login() {
    const idInput = document.getElementById("loginId") as HTMLInputElement;
    const passwordInput = document.getElementById("loginPassword") as HTMLInputElement;
    const errorMsg = document.getElementById("errorMsg");
  
    if (!idInput || !passwordInput) return;
  
    const id = idInput.value;
    const password = passwordInput.value;
  
    let matched = null;
  
    for (let i = 0; i < credentials.length; i++) {
      if (credentials[i].email === id && credentials[i].password === password) {
        matched = credentials[i];
        break;
      }
    }
  
    if (matched) {
      localStorage.setItem("loggedIn", "true");
      window.location.href = "loginpage.html"; // redirect to dashboard
    } else {
      if (errorMsg) {
        errorMsg.textContent = "Invalid ID or password!";
      }
    }
  }
  document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      login();
    }
  });
  
  