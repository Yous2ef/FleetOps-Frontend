import api from "/shared/api-handler.js";
import { setToken, setUser, getIntendedPath, clearIntendedPath } from "../../services/auth.js";

api.setBaseURL("http://localhost:8000");

let cleanupFns = [];

function navigate(path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
}

export function mount() {
    cleanupFns = [];

    const form        = document.getElementById("login-form");
    const emailInput  = document.getElementById("login-email");
    const passInput   = document.getElementById("login-password");
    const emailErr    = document.getElementById("login-email-error");
    const passErr     = document.getElementById("login-password-error");
    const globalErr   = document.getElementById("login-global-error");
    const submitBtn   = document.getElementById("login-submit-btn");

    if (!form) return;

    const onSubmit = async (e) => {
        e.preventDefault();

        // Reset errors
        emailErr.textContent  = "";
        passErr.textContent   = "";
        globalErr.textContent = "";
        emailInput.classList.remove("is-error");
        passInput.classList.remove("is-error");

        const email    = emailInput.value.trim();
        const password = passInput.value;

        let valid = true;
        if (!email) {
            emailErr.textContent = "Email is required.";
            emailInput.classList.add("is-error");
            valid = false;
        }
        if (!password) {
            passErr.textContent = "Password is required.";
            passInput.classList.add("is-error");
            valid = false;
        }
        if (!valid) return;

        submitBtn.disabled    = true;
        submitBtn.textContent = "Signing in…";

        try {
            const { data } = await api.post("/api/v1/auth/login", { email, password });

            if (!data?.success) {
                globalErr.textContent = data?.message ?? "Invalid credentials.";
                return;
            }

            setToken(data.data.token);
            setUser(data.data.user);

            const intended = getIntendedPath();
            clearIntendedPath();
            navigate(intended);
        } catch (err) {
            const msg = err?.data?.message ?? err?.message ?? "Login failed. Please try again.";
            globalErr.textContent = msg;
        } finally {
            submitBtn.disabled    = false;
            submitBtn.textContent = "Sign In";
        }
    };

    form.addEventListener("submit", onSubmit);
    cleanupFns.push(() => form.removeEventListener("submit", onSubmit));
}

export function unmount() {
    cleanupFns.forEach(fn => fn && fn());
    cleanupFns = [];
}
