(function registerDemo(global) {
  "use strict";

  const passLabels = Object.freeze({
    "three-day": "Three-day explorer",
    studios: "Studio sessions",
    remote: "Remote notes",
  });

  function normalizeName(value) {
    return String(value).trim().replace(/\s+/g, " ");
  }

  function buildConfirmation(name, passType) {
    const safeName = normalizeName(name);
    const passLabel = passLabels[passType] || "Demo pass";
    return `Demo complete for ${safeName}: ${passLabel}. Nothing was sent or saved.`;
  }

  global.RegistrationDemo = Object.freeze({
    buildConfirmation,
    normalizeName,
    passLabels,
  });

  if (typeof document === "undefined") {
    return;
  }

  const form = document.querySelector("#registration-form");
  if (!form) {
    return;
  }

  const status = document.querySelector("#form-status");
  const fields = Array.from(form.querySelectorAll("input, select, textarea"));

  function getErrorElement(field) {
    return document.querySelector(`#${field.id}-error`);
  }

  function messageFor(field) {
    if (field.type === "checkbox" && !field.checked) {
      return "Confirm that you understand this is only a demo.";
    }

    if (field.required && !String(field.value).trim()) {
      return "Complete this required field.";
    }

    if (field.id === "display-name" && normalizeName(field.value).length < 2) {
      return "Enter at least two characters.";
    }

    if (field.type === "email" && field.validity.typeMismatch) {
      return "Enter an email in the format name@example.com.";
    }

    return "";
  }

  function validateField(field) {
    field.setCustomValidity("");
    const message = messageFor(field);
    const error = getErrorElement(field);

    field.setCustomValidity(message);
    field.setAttribute("aria-invalid", message ? "true" : "false");

    if (error) {
      error.textContent = message;
    }

    return message === "";
  }

  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
      status.textContent = "";
    });
    field.addEventListener("change", () => {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
      status.textContent = "";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const invalidFields = fields.filter((field) => !validateField(field));
    if (invalidFields.length > 0) {
      status.textContent = "Review the highlighted fields and try again.";
      invalidFields[0].focus();
      return;
    }

    const confirmation = buildConfirmation(
      form.elements.displayName.value,
      form.elements.passType.value,
    );

    form.reset();
    fields.forEach((field) => {
      field.setAttribute("aria-invalid", "false");
      const error = getErrorElement(field);
      if (error) {
        error.textContent = "";
      }
    });
    status.textContent = confirmation;
    status.focus();
  });
})(globalThis);
