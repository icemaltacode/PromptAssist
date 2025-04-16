let chosenAssistant = 'assistant';
let sendButton = null;
let inputField = null;
let outputDiv = null;
let conversation_thread = null;

const ENV = 'prod';

window.addEventListener('load', () => {
    handleTheme();
    loadView('a3', bindAssistantSelection);
});

// window.addEventListener('resize', function () {
//     console.log(bootstrapDetectBreakpoint());
// });

function handleTheme() {
    // Determine default preference
    const userPrefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;

    // See if there is a saved preference, otherwise set default preference
    const savedTheme = localStorage.getItem('theme');
    const theme =
        savedTheme === 'light' || savedTheme === 'dark'
            ? savedTheme
            : userPrefersDark
            ? 'dark'
            : 'light';

    document.body.setAttribute('data-bs-theme', theme);
    const icon = document.getElementById('themeToggleBtn').querySelector('i');
    if (theme === 'dark') {
        icon.classList.remove('bi-moon');
        icon.classList.add('bi-sun');
    }

    // Handle theme switch button
    document
        .getElementById('themeToggleBtn')
        .addEventListener('click', function () {
            const icon = document
                .getElementById('themeToggleBtn')
                .querySelector('i');
            const iconName = [...icon.classList]
                .find((cls) => cls.startsWith('bi-'))
                .replace('bi-', '');

            if (iconName === 'sun') {
                document.body.setAttribute('data-bs-theme', 'light');
                icon.classList.remove('bi-sun');
                icon.classList.add('bi-moon');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.setAttribute('data-bs-theme', 'dark');
                icon.classList.remove('bi-moon');
                icon.classList.add('bi-sun');
                localStorage.setItem('theme', 'dark');
            }
        });
}

function loadView(view, cb) {
    fetch(`partials/${view}.html`)
        .then((response) => response.text())
        .then((data) => {
            document.getElementById('main-content').innerHTML = data;
            cb();
        })
        .catch((error) => console.error('Error fetching the HTML:', error));
}

function bindAssistantSelection() {
    document.querySelector('#hero').style.display = 'block';
    document.querySelectorAll('#main-content a').forEach((link) => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            chosenAssistant = new URL(this.href).hash.substring(1);
            loadView('form', bindForm);
        });
    });
}

function bindForm() {
    // Bootstrap validation
    // Example starter JavaScript for disabling form submissions if there are invalid fields
    (function () {
        'use strict';

        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.querySelectorAll('.needs-validation');

        // Loop over them and prevent submission
        Array.prototype.slice.call(forms).forEach(function (form) {
            form.addEventListener(
                'submit',
                function (event) {
                    if (!form.checkValidity()) {
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    form.classList.add('was-validated');
                },
                false
            );
        });
    })();

    // Hide hero
    document.querySelector('#hero').style.display = 'none';

    // Restart with new assistant
    document
        .querySelector('#startover')
        .addEventListener('click', function (event) {
            event.preventDefault();
            let warningModal = new bootstrap.Modal(
                document.getElementById('warningModal')
            );
            warningModal.show();
            document
                .getElementById('confirmYes')
                .addEventListener('click', function () {
                    warningModal.hide();
                    loadView('a3', bindAssistantSelection);
                });
        });

    // Generate the prompt
    document
        .querySelector("button[type='submit']")
        .addEventListener('click', function (event) {
            const form = document.querySelector('#promptForm');

            if (!form.checkValidity()) {
                form.reportValidity(); // Show validation messages
                return; // Stop execution if the form is invalid
            }

            event.preventDefault(); // Prevent form submission if valid

            // Show modal
            let promptModal = new bootstrap.Modal(
                document.getElementById('promptModal')
            );
            generatePrompt();
            promptModal.show();
        });

    // Copy to clipboard functionality
    document
        .getElementById('copyPrompt')
        .addEventListener('click', function () {
            let promptText = document.getElementById('promptText');
            promptText.select();
            navigator.clipboard
                .writeText(promptText.value)
                .then(() => {
                    let copyButton = document.getElementById('copyPrompt');
                    let icon = copyButton.querySelector('i');
                    copyButton.classList.remove('btn-primary');
                    copyButton.classList.add('btn-success');
                    icon.classList.remove('bi-clipboard');
                    icon.classList.add('bi-clipboard-check');
                    setTimeout(() => {
                        copyButton.classList.remove('btn-success');
                        copyButton.classList.add('btn-primary');
                        if (icon) {
                            icon.classList.remove('bi-clipboard-check');
                            icon.classList.add('bi-clipboard');
                        }
                    }, 5000);
                })
                .catch((err) => {
                    console.error('Failed to copy: ', err);
                    alert(
                        'Your browser does not support copying to clipboard. Please copy the text manually.'
                    );
                });
        });
}

async function generatePrompt(display = true) {
    try {
        // Load the base persona prompt
        let response = await fetch('data/a3.json');
        let jsonData = await response.json();
        let prompt = jsonData.find(
            (item) => item.name === chosenAssistant
        ).prompt;

        // Load the C3 prompt
        response = await fetch('data/c3.json');
        jsonData = await response.json();
        prompt += jsonData.find((item) => item.name === 'main').prompt;

        // Get user input
        let formData = {};
        document
            .querySelectorAll('form input, form textarea')
            .forEach((input) => {
                formData[input.id] = input.value.trim(); // Store values in object
            });

        // Inject user input
        // Replace placeholders with user input
        Object.keys(formData).forEach((key) => {
            const placeholder = `⟨${key}⟩`;
            prompt = prompt.replaceAll(placeholder, formData[key] || '');
        });

        // Additional logic that should run after fetch completes
        if (display) {
            document.getElementById('promptText').value = prompt;
        }
        return prompt;
    } catch (error) {
        console.error('Error loading JSON:', error);
    }
}