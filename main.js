// Immediately apply theme from localStorage or system preferences to avoid rendering flash
(function preApplyTheme() {
  const savedTheme = localStorage.getItem('theme');
  let currentTheme = 'dark'; // default
  if (savedTheme) {
    currentTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    currentTheme = 'light';
  }
  document.documentElement.setAttribute('data-theme', currentTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initActiveLinks();
  initContactForm();
});

/**
 * Dynamic Light/Dark Theme Controller
 * Synchronizes toggle icons, aria labels, and handles localStorage.
 */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');

  function syncToggleUI(theme) {
    if (theme === 'light') {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
      themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    } else {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
      themeToggle.setAttribute('aria-label', 'Switch to light theme');
    }
  }

  // Sync toggle button UI with the current theme set on html element
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  syncToggleUI(currentTheme);

  themeToggle.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    syncToggleUI(newTheme);
  });
}


/**
 * Mobile Navigation Menu controller
 * Implements accessible disclosure pattern with Escape key handling.
 */
function initMobileNav() {
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');
  
  if (!menuToggle || !mainNav) return;

  const toggleText = menuToggle.querySelector('.menu-toggle-text');

  function openMenu() {
    menuToggle.setAttribute('aria-expanded', 'true');
    mainNav.classList.add('active');
    if (toggleText) toggleText.textContent = 'Close';
  }

  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('active');
    if (toggleText) toggleText.textContent = 'Menu';
  }

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Handle Escape key to close navigation menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('active')) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

/**
 * Marks the active navigation link based on the current URL
 * and assigns the aria-current="page" attribute for screen readers.
 */
function initActiveLinks() {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = window.location.pathname;
  
  navLinks.forEach(link => {
    // Get file name from href (e.g. index.html)
    const hrefAttr = link.getAttribute('href');
    
    // Check if path ends with hrefAttr, or if it's home and path is root
    const isActive = (currentPath.endsWith(hrefAttr)) || 
                     (hrefAttr === 'index.html' && (currentPath === '/' || currentPath.endsWith('/') || currentPath.endsWith('index.html')));
    
    if (isActive) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * Accessible Contact Form Validation
 * Leverages aria-invalid, aria-describedby, and aria-live status alerts.
 */
function initContactForm() {
  const form = document.getElementById('portfolio-contact-form');
  const statusMsg = document.getElementById('form-status-message');
  
  if (!form) return;

  const inputs = form.querySelectorAll('.form-control');

  // Validate individual input
  function validateInput(input) {
    const errorElement = document.getElementById(`${input.id}-error`);
    const helperElement = document.getElementById(`${input.id}-helper`);
    let isValid = true;
    let errorMessage = '';

    if (input.required && !input.value.trim()) {
      isValid = false;
      errorMessage = `${input.previousElementSibling.textContent.replace('*', '').trim()} is required.`;
    } else if (input.type === 'email' && input.value.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(input.value.trim())) {
        isValid = false;
        errorMessage = 'Please enter a valid email address.';
      }
    }

    if (!isValid) {
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add('active');
      }
      
      // Connect both helper and error elements so screen reader reads both
      const descriptions = [];
      if (helperElement) descriptions.push(helperElement.id);
      if (errorElement) descriptions.push(errorElement.id);
      if (descriptions.length > 0) {
        input.setAttribute('aria-describedby', descriptions.join(' '));
      }
    } else {
      input.classList.remove('invalid');
      input.setAttribute('aria-invalid', 'false');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('active');
      }
      
      // Reset aria-describedby to only helper text
      if (helperElement) {
        input.setAttribute('aria-describedby', helperElement.id);
      } else {
        input.removeAttribute('aria-describedby');
      }
    }

    return isValid;
  }

  // Validate fields on blur for real-time accessible correction feedback
  inputs.forEach(input => {
    input.addEventListener('blur', () => {
      validateInput(input);
    });
    
    // Clear error style immediately as user types
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid')) {
        validateInput(input);
      }
    });
  });

  // Submit action handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isFormValid = true;
    let firstInvalidInput = null;

    inputs.forEach(input => {
      const isValid = validateInput(input);
      if (!isValid) {
        isFormValid = false;
        if (!firstInvalidInput) {
          firstInvalidInput = input;
        }
      }
    });

    if (!isFormValid) {
      // Focus on the first invalid input so screen reader announces it immediately
      if (firstInvalidInput) {
        firstInvalidInput.focus();
      }
      
      if (statusMsg) {
        statusMsg.className = 'status-message error';
        statusMsg.textContent = 'Please correct the errors in the form before submitting.';
      }
      return;
    }

    // Success simulation
    if (statusMsg) {
      statusMsg.className = 'status-message success';
      statusMsg.textContent = 'Thank you! Your message has been sent successfully. I will get back to you soon.';
      
      // Reset form fields
      form.reset();
      
      // Reset validation states
      inputs.forEach(input => {
        input.removeAttribute('aria-describedby');
        input.setAttribute('aria-invalid', 'false');
        input.classList.remove('invalid');
      });
      
      // Focus the status message for accessibility announcements
      statusMsg.setAttribute('tabindex', '-1');
      statusMsg.focus();
    }
  });
}
