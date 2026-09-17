function togglePassword(inputId, button) {
    var input = document.getElementById(inputId);
    if (!input) {
        return;
    }
    var show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.classList.toggle('visible', show);
    button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}